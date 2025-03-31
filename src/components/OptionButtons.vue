<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { isDefined } from '@/utils/common'
import OptionButton from '@/components/OptionButton.vue'

export interface Option {
  shortkey?: number
  title: string
  description: string
  iconColor: string
  mdiIcon: string

  value: number
  subOptions?: {
    value: number
    description: string
  }[]
  subOptionValues?: number[]
}

export default defineComponent({
  components: {
    optionButton: OptionButton,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array as PropType<Option[]>,
      required: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    result: {
      type: Number,
      default: undefined,
    },
  },
  data(): {
    selectedOption: Option | undefined
    selectedSubOptionValue: number | undefined
    subOptionsDialog: boolean
  } {
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
    handleOptionButtonClicked(option: Option) {
      if (!option.subOptions) {
        const value = option.value
        this.$emit('addResult', value)
      } else {
        this.selectedOption = option
        this.subOptionsDialog = true
      }
    },
    isOptionSelected(option: Option) {
      const values = option.subOptionValues || [option.value]
      const isOptionSelected = isDefined(this.result) && values.includes(this.result)
      return isOptionSelected
    },
    isOptionNotSelected(option: Option) {
      const isOptionNotSelected = isDefined(this.result) && !this.isOptionSelected(option)
      return isOptionNotSelected
    },
    resetSelectedSubOption() {
      const resultIsSubOption =
        isDefined(this.result) && !this.options.map((o) => o.value).includes(this.result)
      this.selectedSubOptionValue = resultIsSubOption ? this.result : undefined
    },
  },
})
</script>
<template>
  <v-toolbar color="white" height="64" class="pt-1">
    <v-spacer />
    <option-button
      v-for="(option, optionIndex) in options"
      :key="optionIndex"
      :option="option"
      :disabled="disabled"
      :is-selected="isOptionSelected(option)"
      :is-not-selected="isOptionNotSelected(option)"
      @option-click="handleOptionButtonClicked"
    />
    <v-spacer />
    <v-dialog v-model="subOptionsDialog" width="unset">
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
