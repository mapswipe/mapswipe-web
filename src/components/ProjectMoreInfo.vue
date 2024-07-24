<script lang="ts">
import { defineComponent } from 'vue'
import VueMarkdown from 'vue-markdown-render'

export default defineComponent({
  components: {
    VueMarkdown,
  },
  props: {
    project: {
      type: Object,
      require: true,
    },
    fallbackImage: {
      type: String,
      require: true,
    },
    selectFun: {
      type: Function,
      require: true,
    },
  },
  data() {
    return {
      projectImage: this.project?.image || this.fallbackImage,
    }
  },
})
</script>

<template>
  <v-dialog max-width="1000">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn color="primary" v-bind="activatorProps">{{ $t('projectsView.contribute') }}</v-btn>
    </template>
    <template v-slot:default="{ isActive }">
      <v-card>
        <v-img :src="projectImage" @error="() => (projectImage = fallbackImage)" />
        <v-card-title>{{ project.projectTopic }}</v-card-title>
        <v-card-text>
          <v-icon>mdi-pound</v-icon>
          {{ project.projectNumber || $t('projectsView.unknown') }}
          <br />
          <v-icon>mdi-map-marker</v-icon>
          {{ project.projectRegion || $t('projectsView.unknown') }}
          <br />
          <v-icon>mdi-domain</v-icon>
          {{ project.requestingOrganisation || $t('projectsView.unknown') }}
        </v-card-text>
        <v-card-text>
          <vue-markdown
            :source="project.projectDetails.replaceAll('\\n', '\n')"
            :options="{ typographer: true }"
          />
          <br />
          {{ project.progress }} % {{ $t('projectsView.by') }} {{ project.contributorCount }}
          {{ $t('projectsView.contributor', project.contributorCount) }}
          <v-progress-linear :model-value="project.progress" color="primary" />
        </v-card-text>
        <v-divider class="mx-4" />
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="isActive.value = false">
            {{ $t('appDialog.cancel') }}
          </v-btn>
          <v-btn color="primary" @click="selectFun(project)">
            {{ $t('projectsView.contribute') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped></style>
