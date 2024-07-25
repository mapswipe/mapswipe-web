<script lang="ts">
import { defineComponent } from 'vue'
import VueMarkdown from 'vue-markdown-render'

export default defineComponent({
  components: {
    VueMarkdown,
  },
  props: {
    informationPages: {
      type: Array,
      required: false,
    },
    manualUrl: {
      type: String,
      require: false,
    },
    first: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    activeTab: null,
    dialog: false,
  }),
  computed: {
    tabs() {
      const tabs = this.informationPages
        ? Array.from({ length: this.informationPages.length }, (v, i) => i).concat(['instructions'])
        : ['instructions']
      return tabs
    },
  },
  methods: {
    closeDialog() {
      this.dialog = false
    },
    back() {
      const currentTabIndex = this.tabs.indexOf(this.activeTab)
      if (currentTabIndex > 0) this.activeTab = this.tabs[currentTabIndex - 1]
    },
    forward() {
      const currentTabIndex = this.tabs.indexOf(this.activeTab)
      if (currentTabIndex < this.tabs.length - 1) this.activeTab = this.tabs[currentTabIndex + 1]
    },
  },
  created() {
    this.dialog = this.first
  },
})
</script>

<template>
  <v-btn
    :title="$t('findProjectInstructions.howToContribute')"
    icon="mdi-information"
    color="primary"
    @click="dialog = true"
  />
  <v-dialog v-model="dialog" max-width="70vw">
    <v-card v-click-outside="closeDialog" class="pa-3">
      <v-tabs v-model="activeTab">
        <v-tab
          v-for="(page, index) in informationPages"
          :text="page.title"
          :value="index"
          :key="page.pageNumber"
        ></v-tab>
        <v-tab :text="$t('findProjectInstructions.howToContribute')" value="instructions"></v-tab>
      </v-tabs>

      <v-window v-model="activeTab" style="height: 70vh; overflow-y: auto">
        <v-window-item
          v-for="(page, index) in informationPages"
          :value="index"
          :key="page.pageNumber"
        >
          <span
            v-for="block in page.blocks?.sort((a, b) => a.blockNumber - b.blockNumber)"
            :key="block.blockNumber"
          >
            <v-card-text v-if="block.blockType === 'text'" class="text-justify">
              <vue-markdown
                :source="block.textDescription.replaceAll('\\n', '\n')"
                :options="{ typographer: true }"
              />
            </v-card-text>
            <v-img
              v-if="block.blockType === 'image'"
              :src="block.image"
              max-width="400"
              class="mx-auto"
            />
          </span>
        </v-window-item>
        <v-window-item value="instructions">
          <slot name="instructions"></slot>
        </v-window-item>
      </v-window>
      <v-card-actions class="justify-end">
        <v-btn
          :title="$t('findProjectInstructions.moveLeft')"
          icon="mdi-chevron-left"
          color="secondary"
          :disabled="tabs.indexOf(activeTab) <= 0"
          @click="back"
          v-shortkey.native="['arrowleft']"
          @shortkey="back"
        />
        <v-btn
          :title="$t('findProjectInstructions.moveRight')"
          icon="mdi-chevron-right"
          color="secondary"
          :disabled="tabs.indexOf(activeTab) >= tabs.length - 1"
          @click="forward"
          v-shortkey.native="['arrowright']"
          @shortkey="forward"
        />
        <v-spacer />
        <v-btn
          v-if="manualUrl"
          color="primary"
          :href="manualUrl"
          target="_blank"
          prepend-icon="mdi-help-circle"
          >{{ $t('findProjectInstructions.moreInfo') }}</v-btn
        >
        <v-btn v-if="activeTab == 'instructions'" color="primary" @click="dialog = false">{{
          $t('findProjectInstructions.close')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
