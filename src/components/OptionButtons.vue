<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    options: {
      type: Array,
      require: true,
    },
    taskId: {
      type: String,
      require: true,
    },
    result: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return {
      selectedOption: undefined,
      selectedSubOptionValue: undefined,
      subOptionsDialog: false,
    }
  },
  watch: {
    taskId() {
      this.resetSelectedSubOption()
    },
  },
  methods: {
    handleCloseSubOptionsDialog() {
      const value = this.selectedSubOptionValue
      this.$emit('addResult', value)
      this.subOptionsDialog = false
    },
    handleOptionButtonClicked(option) {
      if (!option.subOptions) {
        const value = option.value
        this.$emit('addResult', value)
      } else {
        this.selectedOption = option
        this.subOptionsDialog = true
      }
    },
    isOptionSelected(option) {
      const values = option.subOptionValues || [option.value]
      const isOptionSelected = values.includes(this.result)
      return isOptionSelected
    },
    resetSelectedSubOption() {
      const hasResult = this.result !== undefined
      const resultIsSubOption = !this.options.map((o) => o.value).includes(this.result)
      this.selectedSubOptionValue = hasResult && resultIsSubOption ? this.result : undefined
    },
  },
})
</script>

<template>
  <v-toolbar color="white" density="compact" class="pt-1">
    <v-spacer />
    <v-btn
      v-for="(option, optionIndex) in options"
      class="mx-2 text-caption"
      @click="handleOptionButtonClicked(option)"
      v-shortkey="[option.shortkey]"
      @shortkey="handleOptionButtonClicked(option)"
      :title="[option.title, option.description].filter(Boolean).join(': ')"
      :text="'(' + option.shortkey + ') ' + option.title"
      :key="optionIndex"
      :value="option.value"
      :color="option.iconColor"
      :prepend-icon="option.mdiIcon"
      :variant="isOptionSelected(option) ? 'tonal' : 'plain'"
      width="6rem"
      stacked
    />
    <v-spacer />
    <v-dialog
      v-model="subOptionsDialog"
      :persistent="selectedSubOptionValue === undefined"
      width="unset"
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ selectedOption?.title }}
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="selectedSubOptionValue" column>
            <v-radio
              v-for="subOption in selectedOption?.subOptions"
              :key="subOption.value"
              :value="subOption.value"
              :label="subOption.description"
              :color="selectedOption?.iconColor"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            @click="handleCloseSubOptionsDialog"
            :disabled="selectedSubOptionValue === undefined"
            :text="$t('tileMap.close')"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-toolbar>
</template>

<style scoped></style>
