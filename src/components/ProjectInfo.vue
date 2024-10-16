<script lang="ts">
import { defineComponent } from 'vue'
import VueMarkdown from 'vue-markdown-render'

type TabType = number | string

export default defineComponent({
  components: {
    VueMarkdown,
  },
  props: {
    informationPages: {
      // FIXME: move type to common types
      type: Array<{
        pageNumber: number
        title: string
        blocks: {
          blockNumber: number
          blockType: 'text' | 'image'
          textDescription?: string
          image?: string
        }[]
      }>,
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
  data: (): {
    activeTab: TabType | null
    dialog: boolean
  } => ({
    activeTab: null,
    dialog: false,
  }),
  computed: {
    hasTutorialSlot() {
      return !!this.$slots.tutorial
    },
    tabs() {
      const tabs: TabType[] = ['instructions']
      if (this.informationPages && this.informationPages.length > 0) {
        tabs.push(...Array.from(new Array(this.informationPages?.length ?? 0).keys()))
      }
      if (this.hasTutorialSlot) {
        tabs.push('tutorial')
      }
      return tabs
    },
  },
  methods: {
    toggleDialog() {
      this.$emit('toggleDialog')
      this.dialog = !this.dialog
    },
    back() {
      if (this.activeTab === null) {
        return
      }

      const currentTabIndex = this.tabs.indexOf(this.activeTab)
      if (currentTabIndex > 0) this.activeTab = this.tabs[currentTabIndex - 1]
    },
    forward() {
      if (this.activeTab === null) {
        return
      }

      const currentTabIndex = this.tabs.indexOf(this.activeTab)
      if (currentTabIndex < this.tabs.length - 1) this.activeTab = this.tabs[currentTabIndex + 1]
    },
  },
  emits: ['toggleDialog'],
  created() {
    if (this.first) this.toggleDialog()
  },
})
</script>

<template>
  <v-btn
    :title="$t('projectInstructions.howToContribute')"
    icon="mdi-information"
    color="primary"
    @click="toggleDialog()"
  />
  <v-dialog
    v-model="dialog"
    height="calc(100% - 32px)"
    max-height="100vh"
    width="calc(100% - 32px)"
    max-width="1024"
    persistent
  >
    <v-card class="pa-2" height="100%">
      <v-tabs v-model="activeTab" style="flex-shrink: 0">
        <v-tab :text="$t('projectInstructions.howToContribute')" value="instructions" />
        <v-tab
          v-for="(page, index) in informationPages"
          :text="page.title"
          :value="index"
          :key="page.pageNumber"
        />
        <v-tab v-if="hasTutorialSlot" value="tutorial" :text="$t('projectInstructions.tutorial')" />
      </v-tabs>
      <v-divider />
      <v-tabs-window v-model="activeTab" style="flex-grow: 1; overflow-y: auto">
        <v-tabs-window-item value="instructions">
          <slot name="instructions"></slot>
        </v-tabs-window-item>
        <v-tabs-window-item
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
                :source="block.textDescription?.replaceAll('\\n', '\n')"
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
        </v-tabs-window-item>
        <v-tabs-window-item value="tutorial">
          <slot name="tutorial"></slot>
        </v-tabs-window-item>
      </v-tabs-window>
      <v-divider />
      <v-card-actions>
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
        <v-btn color="primary" @click="toggleDialog()">{{
          $t('findProjectInstructions.close')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
