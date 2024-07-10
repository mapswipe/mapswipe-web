<script lang="ts">
import { defineComponent } from 'vue'
import { goOffline, goOnline, off, onValue, set } from 'firebase/database'
import {
  db,
  getGroupsQuery,
  getProjectRef,
  getProjectContributionsRef,
  getResultsRef,
  getTasksRef,
  logAnalyticsEvent,
} from '@/firebase'
import { inflate } from 'pako'
import { decode } from 'base-64'
import { mapStores } from 'pinia'
import { i18nRoute } from '@/i18n/translation'
import { useCurrentUserStore } from '@/stores/currentUser'
import matchIcon from '@/utils/matchIcon'
import BasicPage from '@/components/BasicPage.vue'
import CompareProject from '@/components/CompareProject.vue'
import FindProject from '@/components/FindProject.vue'
import MediaProject from '@/components/MediaProject.vue'
import ValidateProject from '@/components/ValidateProject.vue'
import DigitizeProject from '@/components/DigitizeProject.vue'
import projectTypes from '@/config/projectTypes'
import { buddy } from '@/service/buddy'
import systemPrompt from '@/config/buddyConfig'
import { vuetify } from '@/plugins/vuetify'

export default defineComponent({
  components: {
    basicPage: BasicPage,
    compareProject: CompareProject,
    findProject: FindProject,
    mediaProject: MediaProject,
    validateProject: ValidateProject,
    digitizeProject: DigitizeProject,
  },
  data() {
    const themeColors = vuetify.theme.current._value.colors
    return {
      completedGroupId: null,
      group: null,
      mode: 'contribute',
      mappingSpeed: 1,
      nextDialog: false,
      project: null,
      projectContributions: [],
      tasks: null,
      to: null,
      chat: {
        participants: [
          {
            id: 'buddy',
            name: 'MapSwipe Buddy',
          },
        ], // the list of all the participant of the conversation. `name` is the user name, `id` is used to establish the author of a message, `imageUrl` is supposed to be the user avatar.
        titleImageUrl: '',
        messageList: [],
        newMessagesCount: 0,
        isChatOpen: false, // to determine whether the chat window should be open or closed
        showTypingIndicator: '', // when set to a value matching the participant.id it shows the typing indicator for the specific user
        colors: {
          header: {
            bg: themeColors.secondary,
            text: '#ffffff',
          },
          launcher: {
            bg: themeColors.secondary,
          },
          messageList: {
            bg: '#ffffff',
          },
          sentMessage: {
            bg: themeColors.secondary,
            text: '#ffffff',
          },
          receivedMessage: {
            bg: '#eaeaea',
            text: '#222222',
          },
          userInput: {
            bg: '#f4f7f9',
            text: '#565867',
          },
        }, // specifies the color scheme for the component
        alwaysScrollToBottom: true, // when set to true always scrolls the chat to the bottom when new events are in (new message, user starts typing...)
        messageStyling: true, // enables *bold* /emph/ _underline_ and such (more info at github.com/mattezza/msgdown)
      },
    }
  },
  provide() {
    return {
      logMappingStarted: (projectType) => {
        logAnalyticsEvent('mapping_started', { projectType: projectType })
      },
      saveResults: (results, startTime) => {
        const numberOfTasks = Object.keys(results).length
        const endTime = new Date().toISOString()
        this.mappingSpeed = (Date.parse(endTime) - Date.parse(startTime)) / numberOfTasks

        const entry = {
          endTime,
          results,
          startTime,
        }

        this.completedGroupId = this.group.groupId

        goOnline(db)
        set(getResultsRef(this.project.projectId, this.group.groupId, this.user.uid), entry)
          .then(() => {
            this.showSnackbar(
              this.$t('projectView.resultsSaved', { user: this.user.displayName }),
              'success',
            )
            logAnalyticsEvent('complete_group')
            this.mode = 'finished'
            this.nextDialog = true
          })
          .catch(() => {
            this.showSnackbar(this.$t('projectView.saveFailed'), 'error')
          })
      },
    }
  },
  inject: {
    showSnackbar: 'showSnackbar',
    showDialog: 'showDialog',
    hideDialog: 'hideDialog',
  },
  computed: {
    ...mapStores(useCurrentUserStore),
    options() {
      var options = this.project?.customOptions
      options ??= this.project?.answerLabels
      const completedOptions = options?.map(this.completeOptions)
      return completedOptions
    },
    projectId() {
      return this.$route.params.projectId
    },
    taskComponent() {
      const component = projectTypes[this.project.projectType]?.component
      return component
    },
    user() {
      const user = this.currentUserStore.currentUser
      return user
    },
    first() {
      const count = this.projectContributions?.taskContributionCount || 0
      const first = count == 0
      return first
    },
  },
  methods: {
    bindProject() {
      onValue(getProjectRef(this.projectId), (snapshot) => {
        const data = snapshot.val() || {}
        this.project = data
      })
    },
    bindProjectContributions() {
      onValue(getProjectContributionsRef(this.user.uid, this.projectId), (snapshot) => {
        const data = snapshot.val() || {}
        this.projectContributions = data
      })
    },
    bindTaskGroup() {
      onValue(getGroupsQuery(this.projectId), (snapshot) => {
        const data = snapshot.val() || {}
        const flatGroups = Object.values(data).flat()
        const completed = Object.keys(this.projectContributions)
        const available = flatGroups.filter(
          (g) => g.requiredCount > 0 && !completed.includes(g.groupId),
        )
        if (!available.length) {
          this.nextDialog = false
          this.to = this.i18nRoute({ name: 'projects' })
          this.showDialog(
            this.$t('projectView.noTasksAvailable'),
            this.$t('projectView.goBackToProjects', { user: this.user.displayName }),
            this.leaveProject,
            true,
            false,
          )
        } else {
          this.hideDialog()
        }
        const random = available[Math.floor(Math.random() * available.length)]
        this.group = random
        this.bindTasks()
      })
    },
    bindTasks() {
      onValue(getTasksRef(this.projectId, this.group?.groupId), (snapshot) => {
        const data = snapshot.val() || []
        const tasks = typeof data == 'string' ? this.decompressTasks(data) : data
        this.tasks = tasks
      })
    },
    completeOptions(option, index) {
      option.title ??= option.label
      option.iconColor ??= option.color || '#d1dad1'
      option.value ??= index
      option.subOptionValues = [option.value]
      option.subOptions?.forEach((subOption) => option.subOptionValues.push(subOption.value))
      option.shortkey = index < 9 ? index + 1 : ''
      option.mdiIcon =
        this.matchIcon(option.icon) || option.icon || `mdi-numeric-${option.shortkey}-box`
      return option
    },
    continueMapping() {
      this.nextDialog = false
      this.mode = 'contribute'
    },
    decompressTasks(tasks) {
      const strTasks = decode(tasks)
      const charTasks = strTasks.split('').map(function (x) {
        return x.charCodeAt(0)
      })
      const binaryTasks = new Uint8Array(charTasks)
      const expandedTasks = inflate(binaryTasks, { to: 'string' })
      return JSON.parse(expandedTasks)
    },
    i18nRoute,
    leaveProject() {
      this.hideDialog()
      this.mode = 'leave'
      this.$router.push(this.to)
    },
    matchIcon,
    ready() {
      if (!this.completedGroupId) {
        return true
      } else {
        const updated =
          this.projectContributions[this.completedGroupId] &&
          this.completedGroupId !== this.group?.groupId
        /*
          Firebase rejects results that are produced at a speed of less than 125 ms per task. Therefore, we do not wait for
          updated projectContributions for speedy results.
        */
        const tooSpeedy = this.mappingSpeed < 125
        return updated || tooSpeedy
      }
    },
    handleTaskComponentCreated() {
      goOffline(db)
    },

    appendToLastMessage(text: string) {
      if (this.chat.showTypingIndicator) {
        this.chat.showTypingIndicator = ''
        let output = { author: 'buddy', type: 'text', data: { text: '' } }
        this.chat.messageList.push(output)
      }
      this.chat.messageList[this.chat.messageList.length - 1].data.text += text
    },

    onMessageWasSent(message) {
      this.chat.messageList = [...this.chat.messageList, message]
      this.chat.showTypingIndicator = 'buddy'
      buddy.sendMessageToOllama(this.chat.messageList, this.appendToLastMessage)
    },
    openChat() {
      buddy
        .initContext(this.user?.uid, systemPrompt.createFrom(this.project, this.user?.displayName))
        .then(() => {
          this.chat.isChatOpen = true
        })
        .catch((err) => {
          console.log(err)
        })
    },
    closeChat() {
      // called when the user clicks on the botton to close the chat
      this.chat.isChatOpen = false
    },
    handleScrollToTop() {
      // called when the user scrolls message list to top
      // leverage pagination for loading another page of messages
    },
    handleOnType() {},
    editMessage() {
      console.log('Disabled')
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.mode === 'contribute' && to.name !== 'authentication') {
      this.to = to
      this.showDialog(
        this.$t('projectView.leave'),
        this.$t('projectView.AreYouSureYouWantToLeave'),
        this.leaveProject,
        true,
      )
    } else {
      off(getProjectRef(this.projectId))
      off(getGroupsQuery(this.projectId))
      off(getProjectContributionsRef(this.user.uid, this.projectId))
      goOnline(db)
      buddy.endContext()
      next()
    }
  },
  mounted() {
    this.bindProject()
    this.bindProjectContributions()
    this.bindTaskGroup()
    this.chat.messageList.push({
      author: 'buddy',
      type: 'text',
      data: { text: `Hey ${this.user?.displayName}! I'm your MapSwipe Buddy. Can I help you?` },
      suggestions: ['What is this project about?', 'How does this project work?'],
    })
    logAnalyticsEvent('project_view_opened')
  },
})
</script>

<template>
  <basic-page page-name="project">
    <component
      :is="taskComponent"
      v-if="project && group && tasks && mode === 'contribute'"
      :first="first"
      :group="group"
      :options="options"
      :project="project"
      :tasks="tasks"
      @created="handleTaskComponentCreated"
    />

    <v-dialog v-model="nextDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>
          {{ $t('projectView.wellDone', { user: user.displayName }) }}
        </v-card-title>
        <v-card-text>
          {{ $t('projectView.youHaveCompletedAllTheTasks') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" :to="i18nRoute({ name: 'projects' })">
            {{ $t('projectView.seeAllProjects') }}
          </v-btn>
          <v-btn :loading="!ready()" :disabled="!ready()" color="primary" @click="continueMapping">
            {{ $t('projectView.continueMapping') }}
            <template v-slot:loader>
              <v-progress-circular indeterminate />
              {{ $t('projectView.continueMapping') }}
            </template>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--v-dialog v-model="langDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('project.notAvailable') }}
        </v-card-title>
        <v-card-text>
          {{ $t('project.langChange') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="langDialog = false" text>
            {{ $t('global.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog-->
    <!--    :icons="chat.icons"-->

    <beautiful-chat
      :participants="chat.participants"
      :titleImageUrl="chat.titleImageUrl"
      :onMessageWasSent="onMessageWasSent"
      :messageList="chat.messageList"
      :newMessagesCount="chat.newMessagesCount"
      :isOpen="chat.isChatOpen"
      :close="closeChat"
      :open="openChat"
      :showEmoji="false"
      :showFile="false"
      :showEdition="true"
      :showDeletion="true"
      :deletionConfirmation="true"
      :showTypingIndicator="chat.showTypingIndicator"
      :showLauncher="true"
      :showCloseButton="true"
      :colors="chat.colors"
      :alwaysScrollToBottom="chat.alwaysScrollToBottom"
      :disableUserListToggle="true"
      :messageStyling="chat.messageStyling"
      title="MapSwipeBuddy"
      @onType="handleOnType"
      @edit="editMessage"
    />
  </basic-page>
</template>

<style>
.sc-launcher,
.sc-launcher .sc-open-icon,
.sc-launcher .sc-closed-icon,
.sc-chat-window {
  bottom: 86px !important;
}
.sc-chat-window {
  font-family: inherit !important;
}
.sc-message--text .sc-message--text-content {
  font-weight: 400 !important;
}
.sc-message--avatar {
  width: 0px !important;
  min-width: 0px !important;
  margin: 0px !important;
}
.sc-message-list {
  padding: 20px 0 !important;
}
.sc-message {
  width: 90% !important;
}
</style>
