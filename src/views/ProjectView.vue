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
import { mapStores } from 'pinia'
import { i18nRoute } from '@/i18n/translation'
import { useCurrentUserStore } from '@/stores/currentUser'
import { version } from '../../package.json'
import matchIcon from '@/utils/matchIcon'
import BasicPage from '@/components/BasicPage.vue'
import CompareProject from '@/components/CompareProject.vue'
import FindProject from '@/components/FindProject.vue'
import MediaProject from '@/components/MediaProject.vue'
import ValidateProject from '@/components/ValidateProject.vue'
import DigitizeProject from '@/components/DigitizeProject.vue'
import StreetProject from '@/components/StreetProject.vue'
import ConflationProject from '@/components/ConflationProject.vue'
import CompletenessProject from '@/components/CompletenessProject.vue'
import ValidateImageProject from '@/components/ValidateImageProject.vue'
import projectTypes from '@/config/projectTypes'
import { decompressTasks } from '@/utils/tasks'

export default defineComponent({
  components: {
    basicPage: BasicPage,
    compareProject: CompareProject,
    findProject: FindProject,
    completenessProject: CompletenessProject,
    validateImageProject: ValidateImageProject,
    mediaProject: MediaProject,
    validateProject: ValidateProject,
    digitizeProject: DigitizeProject,
    streetProject: StreetProject,
    conflationProject: ConflationProject,
  },
  data() {
    return {
      completedGroupId: null,
      group: null,
      mode: 'prepare',
      mappingSpeed: 1,
      nextDialog: false,
      project: null,
      projectContributions: [],
      tasks: null,
      tutorial: null,
      tutorialTasks: null,
      to: null,
    }
  },
  provide() {
    return {
      logMappingStarted: (projectType) => {
        logAnalyticsEvent('mapping_started', { projectType: projectType })
      },
      saveResults: (results, startTime, reference) => {
        if (Object.values(results).every((v) => v === null)) {
          this.to = this.i18nRoute({ name: 'projects' })
          this.showDialog(
            this.$t('projectView.noResults'),
            this.$t('projectView.checkConnection'),
            this.leaveProject,
            true,
            false,
          )
          return 0
        }

        const numberOfTasks = Object.keys(results).length
        const endTime = new Date().toISOString()
        const dev = import.meta.env.DEV
        const appVersion = version + (dev ? '-dev' : '')
        const clientType = 'web'
        this.mappingSpeed = (Date.parse(endTime) - Date.parse(startTime)) / numberOfTasks

        const entry = {
          appVersion,
          clientType,
          endTime,
          results,
          startTime,
        }

        reference && (entry.reference = reference)

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
        if (this.project?.tutorialId) {
          this.bindTutorial(this.project?.tutorialId)
        } else {
          this.mode = 'contribute'
        }
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
        const flatGroups: any[] = []
        snapshot.forEach((childSnapshot) => {
          flatGroups.push(childSnapshot.val())
        })
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
        if (projectTypes[this.project.projectType]?.prioritizeNearlyCompletedGroups) {
          this.group = available[0]
        } else {
          const random = available[Math.floor(Math.random() * available.length)]
          this.group = random
        }
        this.bindTasks()
      })
    },
    bindTasks() {
      onValue(getTasksRef(this.projectId, this.group?.groupId), (snapshot) => {
        const data = snapshot.val()
        this.tasks = decompressTasks(data)
      })
    },
    bindTutorial(tutorialId) {
      onValue(getProjectRef(tutorialId), (snapshot) => {
        const data = snapshot.val() || {}
        this.tutorial = data
        this.bindTutorialTasks(tutorialId)
      })
    },
    bindTutorialTasks(tutorialId) {
      onValue(getTasksRef(tutorialId, '101'), (snapshot) => {
        const data = snapshot.val()
        this.tutorialTasks = decompressTasks(data)
        this.mode = 'contribute'
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
    handleProjectError() {
      this.to = '/projects'
      this.showDialog(
        this.$t('projectView.projectErrorTitle'),
        this.$t('projectView.projectErrorText'),
        this.leaveProject,
        true,
        false,
      )
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
      next()
    }
  },
  mounted() {
    this.bindProject()
    this.bindProjectContributions()
    this.bindTaskGroup()
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
      :tutorial="tutorial"
      :tutorialTasks="tutorialTasks"
      @created="handleTaskComponentCreated"
      @error="handleProjectError"
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
  </basic-page>
</template>
