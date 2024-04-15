<script lang="ts">
import BasicPage from '@/components/BasicPage.vue'
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { getAuth, signOut, updateProfile } from 'firebase/auth'
import { getDatabase, ref, push, set, update, onValue } from 'firebase/database'
import { useCurrentUserStore } from '@/stores/currentUser'
import {
  dbRef,
  getUserGroupsOfUserRef,
  userGroupsRef,
  userGroupMembershipLogsRef,
} from '@/firebase'
import { i18nRoute } from '@/i18n/translation'

export default defineComponent({
  components: {
    basicPage: BasicPage,
  },
  data: () => ({
    changeUsernameDialog: false,
    isFormValid: false,
    leaveUserGroupId: null,
    newUsername: '',
    userGroups: [],
    userGroupsOfUser: [],
    selectedUserGroup: null,
  }),
  inject: {
    showSnackbar: 'showSnackbar',
    showDialog: 'showDialog',
    hideDialog: 'hideDialog',
  },
  computed: {
    ...mapStores(useCurrentUserStore),
    user() {
      const user = this.currentUserStore.currentUser
      return user
    },
    username() {
      const name = this.user?.displayName || this.$t(`profileView.unnamedUser`)
      return name
    },
    communityDashboardUrl() {
      const url = import.meta.env.VITE_COMMUNITY_DASHBOARD_URL
      return url
    },
    userStatsUrl() {
      try {
        return new URL(`/user/${this.user.uid}`, this.communityDashboardUrl)
      } catch (err) {
        return false
      }
    },
  },
  methods: {
    bindUserGroups() {
      onValue(userGroupsRef, (snapshot) => {
        const data = snapshot.val() || {}
        const destructure = ([groupId, group]) => ({ groupId, ...group })
        this.userGroups = Object.entries(data).map(destructure)
      })
    },
    bindUserGroupsOfUser() {
      const userId = this.user.uid
      onValue(getUserGroupsOfUserRef(userId), (snapshot) => {
        const data = snapshot.val() || {}
        const groupKeys = Object.keys(data)
        this.userGroupsOfUser = this.userGroups.filter((userGroup) =>
          groupKeys.includes(userGroup.groupId),
        )
      })
    },
    deleteAccount() {
      this.hideDialog()
      this.user
        .delete()
        .then(() => {
          this.$router.push(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } })),
            this.showSnackbar(this.$t(`profileView.accountDeleted`), 'success')
        })
        .catch(() => {
          this.showSnackbar(this.$t(`profileView.accountDeletionFailed`))
        })
    },
    changeUsername() {
      this.changeUsernameDialog = false
      const userId = this.user.uid
      const db = getDatabase()

      if ((this.newUsername?.length ?? 0) >= 4) {
        updateProfile(this.user, { displayName: this.newUsername })
          .then(() => {
            set(ref(db, `/v2/users/${userId}/username`), this.newUsername)
          })
          .then(() => {
            this.showSnackbar(this.$t(`profileView.usernameChanged`), 'success')
          })
          .catch(() => this.showSnackbar(this.$t(`profileView.usernameChangeFailed`), 'error'))
      }
    },
    getGroupStatsUrl(userGroupId) {
      try {
        return new URL(`/user-group/${userGroupId}`, this.communityDashboardUrl)
      } catch (err) {
        return false
      }
    },
    joinUserGroup() {
      this.hideDialog()
      const userId = this.user.uid
      const userGroupId = this.selectedUserGroup.groupId
      const updates = {}

      push(userGroupMembershipLogsRef) // generates unique log id
        .then((logId) => {
          if (logId) {
            updates[`/v2/users/${userId}/userGroups/${userGroupId}`] = true
            updates[`/v2/userGroups/${userGroupId}/users/${userId}`] = true
            updates[`/v2/userGroupMembershipLogs/${logId.key}`] = {
              userId,
              userGroupId,
              action: 'join',
              timestamp: new Date().getTime(),
            }

            update(dbRef, updates).then(() =>
              this.showSnackbar(this.$t('profileView.joinedGroup'), 'success'),
            )

            this.selectedUserGroup = null
          } else {
            this.showSnackbar(this.$t('profileView.failedToJoinGroup'), 'error')
          }
        })
        .catch(() => this.showSnackbar(this.$t('profileView.failedToJoinGroup'), 'error'))
    },
    leaveUserGroup() {
      this.hideDialog()
      const userId = this.user.uid
      const userGroupId = this.leaveUserGroupId

      const updates = {}
      push(userGroupMembershipLogsRef) // generates unique log id
        .then((logId) => {
          if (logId) {
            updates[`/v2/users/${userId}/userGroups/${userGroupId}`] = null
            updates[`/v2/userGroups/${userGroupId}/users/${userId}`] = null
            updates[`/v2/userGroupMembershipLogs/${logId.key}`] = {
              userId,
              userGroupId,
              action: 'leave',
              timestamp: new Date().getTime(),
            }

            update(dbRef, updates).then(() =>
              this.showSnackbar(this.$t(`profileView.leftGroup`), 'success'),
            )
          } else {
            this.showSnackbar(this.$t(`profileView.failedToLeaveGroup`), 'error')
          }
        })
        .catch(() => context.showError(this.$t(`profileView.failedToLeaveGroup`)))
    },
    showDeleteDialog() {
      this.showDialog(
        this.$t('profileView.deleteAccount'),
        this.$t('profileView.AreYouSureYouWantToDelete'),
        this.deleteAccount,
        false,
      )
    },
    showSignOutDialog() {
      this.showDialog(
        this.$t('profileView.signOut'),
        this.$t('profileView.AreYouSureYouWantToSignOut'),
        this.signOut,
        false,
      )
    },
    showLeaveDialog(userGroupId) {
      this.leaveUserGroupId = userGroupId
      this.showDialog(
        this.$t('profileView.leave'),
        this.$t('profileView.AreYouSureYouWantToLeave'),
        this.leaveUserGroup,
        false,
      )
    },
    showJoinDialog() {
      this.showDialog(
        this.$t('profileView.join'),
        this.$t('profileView.AreYouSureYouWantToJoin'),
        this.joinUserGroup,
        false,
      )
    },
    signOut() {
      this.hideDialog()
      const auth = getAuth()
      signOut(auth)
        .then(() =>
          this.$router.push(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } })),
        )
        .catch(() => this.showSnackbar(this.$t(`profileView.signOutFailed`), 'error'))
    },
  },
  mounted() {
    this.bindUserGroups()
    this.bindUserGroupsOfUser()
  },
})
</script>

<template>
  <basic-page page-name="profile">
    <h2>{{ username }}</h2>

    <v-row>
      <v-col v-if="userStatsUrl">
        <v-btn :href="userStatsUrl.href" color="primary" target="_blank">
          <v-icon>mdi-chart-bar</v-icon> {{ $t('profileView.userStats') }}
        </v-btn>
      </v-col>
      <v-col>
        <v-btn color="primary" @click="changeUsernameDialog = true" :disabled="!user">
          <v-icon>mdi-account-edit</v-icon> {{ $t('profileView.changeUsername') }}
        </v-btn>
      </v-col>
      <v-col>
        <v-btn color="warning" @click="showDeleteDialog">
          <v-icon>mdi-delete</v-icon> {{ $t('profileView.deleteAccount') }}
        </v-btn>
      </v-col>
      <v-col>
        <v-btn color="primary" @click="showSignOutDialog" :disabled="!user">
          <v-icon>mdi-logout</v-icon>{{ $t('profileView.signOut') }}
        </v-btn>
      </v-col>
    </v-row>

    <br />

    <span v-if="userGroups.length">
      <h2>{{ $t('profileView.userGroups') }}</h2>
      <br />
      <h3>{{ $t('profileView.joinNewGroup') }}</h3>
      <v-autocomplete
        v-model="selectedUserGroup"
        :label="$t('profileView.exploreUserGroups')"
        :items="userGroups.filter((userGroup) => !userGroupsOfUser.includes(userGroup))"
        item-title="name"
        :no-data-text="$t('profileView.noGroupsAvailable')"
        auto-select-first
        clearable
        return-object
      />
      <v-row justify="center">
        <v-col v-if="selectedUserGroup">
          <v-hover v-slot="{ isHovering, props }">
            <v-card v-bind="props" :elevation="isHovering ? 3 : 1" width="350" tile>
              <v-card-title>{{ selectedUserGroup.name }}</v-card-title>
              <v-card-text>
                <span v-if="selectedUserGroup">{{ selectedUserGroup.description }}</span>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  v-if="selectedUserGroup && getGroupStatsUrl(selectedUserGroup.groupId)"
                  color="primary"
                  :href="getGroupStatsUrl(selectedUserGroup.groupId).href"
                  target="_blank"
                >
                  <v-icon>mdi-chart-bar</v-icon> {{ $t('profileView.groupStats') }}
                </v-btn>
                <v-spacer />
                <v-btn color="primary" @click="showJoinDialog" :disabled="!selectedUserGroup">
                  {{ $t('profileView.join') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>

      <br />
      <v-divider> /</v-divider>
      <br />

      <h3>{{ $t('profileView.memberships') }}</h3>
      <v-row justify="center">
        <v-col :key="index" v-for="(userGroup, index) in userGroupsOfUser">
          <v-hover v-slot="{ isHovering, props }">
            <v-card v-bind="props" :elevation="isHovering ? 3 : 1" width="350" tile>
              <v-card-title>{{ userGroup.name }}</v-card-title>
              <v-card-text>{{ userGroup.description }}</v-card-text>
              <v-card-actions>
                <v-btn
                  v-if="getGroupStatsUrl(userGroup.groupId)"
                  color="primary"
                  :href="getGroupStatsUrl(userGroup.groupId).href"
                  target="_blank"
                >
                  <v-icon>mdi-chart-bar</v-icon> {{ $t('profileView.groupStats') }}
                </v-btn>
                <v-spacer />
                <v-btn color="primary" @click="showLeaveDialog(userGroup.groupId)">
                  {{ $t('profileView.leave') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </span>

    <v-dialog v-model="changeUsernameDialog" max-width="600">
      <v-card>
        <v-card-title>{{ $t('profileView.changeUsername') }}</v-card-title>
        <v-card-text>
          <v-form v-model="isFormValid" ref="form">
            <v-text-field v-model="username" :label="$t('profileView.currentUsername')" readonly />
            <v-text-field
              v-model="newUsername"
              ref="newUsername"
              :label="$t('profileView.newUsername') + '*'"
              :rules="[
                (v) => !!v || $t('authView.required'),
                (v) => v.length >= 4 || $t('authView.minChar', { number: '4' }),
              ]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="changeUsernameDialog = false">{{
            $t('appDialog.cancel')
          }}</v-btn>
          <v-btn color="primary" :disabled="!isFormValid" @click="changeUsername">{{
            $t('appDialog.ok')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </basic-page>
</template>
