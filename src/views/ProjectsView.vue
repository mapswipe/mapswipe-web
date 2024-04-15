<script lang="ts">
import { defineComponent } from 'vue'
import BasicPage from '@/components/BasicPage.vue'
import ProjectMoreInfo from '@/components/ProjectMoreInfo.vue'
import { onValue } from 'firebase/database'
import { activeProjectsQuery, getUserContributionsRef } from '@/firebase'
import { i18nRoute } from '@/i18n/translation'
import { mapStores } from 'pinia'
import { useCurrentUserStore } from '@/stores/currentUser'
import projectFilters from '@/config/projectFilters'
import projectTypes from '@/config/projectTypes'

export default defineComponent({
  components: {
    basicPage: BasicPage,
    projectMoreInfo: ProjectMoreInfo,
  },
  data: () => ({
    projects: {},
    userContributions: [],
    currentProject: null,
    selectedItems: projectFilters.map((f) => f.defaultItems),
    showFilterCard: false,
  }),
  computed: {
    ...mapStores(useCurrentUserStore),
    availableProjectTypes() {
      let availableProjectTypes = Object.keys(projectTypes)
      return availableProjectTypes
    },
    fallbackImage() {
      const img = import.meta.env.VITE_PROJECTS_FALLBACK_IMAGE
      return img
    },
    filteredProjects() {
      const projects = this.filterProjects()
      return projects
    },
    filterShow() {
      const filterShow = this.filters.map((f) => f.show)
      return filterShow
    },
    filterIsAvailable() {
      const filterIsAvailable = this.filters.map((f) => f.show).some((e) => e)
      return filterIsAvailable
    },
    filters() {
      let filters = []
      if (projectFilters && Array.isArray(projectFilters)) {
        filters = projectFilters?.map((filter, i) => {
          if (filter.multiple && !Array.isArray(filter.defaultItems)) {
            filter.defaultItems = new Array(filter.defaultItems)
            this.selectedItems[i] = filter.defaultItems
          }
          if (
            !filter.multiple &&
            Array.isArray(filter.defaultItems) &&
            filter.defaultItems.length > 0
          ) {
            filter.defaultItems = filter.defaultItems[0]
            this.selectedItems[i] = filter.defaultItems
          }
          return filter
        })
      }
      return filters
    },
    noProjects() {
      // TODO
      // return !Object.keys(this.filteredProjects).length
      return false
    },
    showFilterBadge() {
      const filterSelections = (e, i) => this.filterShow[i] && e.length > 0
      const show = this.selectedItems.map(filterSelections).some((e) => e)
      return show
    },
    user() {
      const user = this.currentUserStore.currentUser
      return user
    },
  },
  methods: {
    bindProjects() {
      onValue(activeProjectsQuery, (snapshot) => {
        const data = snapshot.val() || {}
        this.projects = data
      })
    },
    bindUserContributions() {
      onValue(getUserContributionsRef(this.user.uid), (snapshot) => {
        const data = snapshot.val() || {}
        this.userContributions = data
      })
    },
    filterItems(filter, filterIndex) {
      const items = Object.values(this.filterProjects(filterIndex))
        .map((p) => p[filter.attribute])
        .concat(this.selectedItems[filterIndex])
        .filter((item) => !(typeof item === 'undefined' || item === null))
        .sort(Intl.Collator().compare)
      const unique = (arr) => [...new Set(arr)]
      const uniqueItems = unique(items)
      return uniqueItems
    },
    filterProjects(filterIndex) {
      let projects = Object.entries(this.projects)
      for (let i in this.filters) {
        if (i == filterIndex) continue
        projects = projects.filter((project) => {
          const filter = this.filters[i]
          const value = project[1][filter.attribute]
          const items = this.selectedItems[i]
          if (items.length === 0) {
            return true
          } else {
            return filter.multiple ? items.includes(value) : value === items
          }
        })
      }
      /* TODO filter by locale?
      if(appConfig.filterProjectsByLocale) {
        projects = projects.filter(project => project[1].language === this.$i18n.locale)
      }
      */
      // filter for projects of available types
      projects = projects.filter((p) =>
        this.availableProjectTypes.includes(p[1].projectType?.toString()),
      )
      projects = Object.fromEntries(projects)
      return projects
    },
    projectCompleted(project) {
      const completed = project.progress >= 100
      return completed
    },
    projectCompletedByYou(project) {
      const taskContributionCount =
        this.userContributions[project.projectId]?.taskContributionCount || 0
      const totalTasks = project.requiredResults / project.verificationNumber
      const maxTasksPerUser = project.maxTasksPerUser || Infinity
      const maxTasks = Math.min(maxTasksPerUser, totalTasks)
      const completedByYou = taskContributionCount >= maxTasks
      return completedByYou
    },
    projectUnavailable(project) {
      const unavailable = this.projectCompleted(project) || this.projectCompletedByYou(project)
      return unavailable
    },
    selectProject(project) {
      this.$router.push(i18nRoute({ name: 'project', params: { projectId: project.projectId } }))
    },
    translateFilterLabel(label, attribute) {
      const translationName = 'projectsView.filterLabels.' + attribute
      return label || (this.$te(translationName) ? this.$t(translationName) : attribute)
    },
  },
  mounted() {
    this.bindProjects()
    this.bindUserContributions()
  },
})
</script>

<template>
  <basic-page page-name="projects">
    <v-card v-if="filterIsAvailable" variant="flat">
      <v-card-actions>
        <v-btn @click="showFilterCard = !showFilterCard" color="primary" text>
          <v-badge :model-value="showFilterBadge" color="primary" floating dot>
            <v-icon>{{ showFilterCard ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            {{ $t('projectsView.filter') }}
          </v-badge>
        </v-btn>
      </v-card-actions>

      <v-expand-transition>
        <v-card-text v-show="showFilterCard">
          <v-select
            :key="filterIndex"
            v-for="(filter, filterIndex) in filters"
            v-show="filter.show"
            v-model="selectedItems[filterIndex]"
            :items="filterItems(filter, filterIndex)"
            :multiple="filter.multiple"
            :label="translateFilterLabel(filter.label, filter.attribute)"
            :chips="filter.multiple"
            :deletable-chips="filter.multiple"
            :clearable="filter.multiple"
            item-color="primary"
          />
        </v-card-text>
      </v-expand-transition>
    </v-card>

    <v-row justify="center">
      <div :key="index" v-for="(project, index) in filteredProjects">
        <v-col>
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 3 : 1"
              :disabled="projectUnavailable(project)"
              width="350"
              tile
            >
              <v-img
                height="250"
                :src="project.image"
                @error="() => (project.image = fallbackImage)"
              />
              <v-card-title>{{ project.projectTopic }}</v-card-title>
              <v-card-text>
                <v-icon small>mdi-pound</v-icon>
                {{ project.projectNumber || $t('projectsView.unknown') }}
                <br />
                <v-icon small>mdi-map-marker</v-icon>
                {{ project.projectRegion || $t('projectsView.unknown') }}
                <br />
                <v-icon small>mdi-domain</v-icon>
                {{ project.requestingOrganisation || $t('projectsView.unknown') }}
              </v-card-text>
              <v-card-text>
                {{ project.progress }} % {{ $t('projectsView.by') }} {{ project.contributorCount }}
                {{ $t('projectsView.contributor', project.contributorCount) }}
                <v-progress-linear :value="project.progress" color="primary" />
              </v-card-text>
              <v-divider class="mx-4" />
              <v-card-actions>
                <span v-if="projectUnavailable(project)">
                  {{ $t('projectsView.completed') }}
                  <span v-if="projectCompletedByYou(project)"
                    >&nbsp;{{ $t('projectsView.byYou') }}</span
                  >
                </span>
                <project-more-info
                  v-if="!projectUnavailable(project)"
                  :project="project"
                  :fallbackImage="fallbackImage"
                  :selectFun="selectProject"
                />
                <v-spacer />
                <v-btn
                  color="primary"
                  :disabled="projectUnavailable(project)"
                  @click="selectProject(project)"
                >
                  {{ $t('projectsView.select') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-hover>
        </v-col>
      </div>
      <v-card v-if="noProjects">
        <v-card-title>{{ $t('projectsView.noProjectsAvailable') }}.</v-card-title>
      </v-card>
    </v-row>
  </basic-page>
</template>
