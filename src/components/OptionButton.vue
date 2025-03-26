<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    option: {
      type: Object,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    isNotSelected: {
      type: Boolean,
      default: false,
    },
    onlyIcon: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    handleOptionButtonClick() {
      this.$emit('option-click', this.option)
    },
    trimTitle(title) {
      return title.length > 12 ? title.substring(0, 12) + '...' : title
    },
  },
})
</script>
<template>
  <v-sheet class="mx-5" v-if="!onlyIcon">
    <v-row>
      <v-btn
        class="mx-2 text-caption"
        @click="handleOptionButtonClick"
        v-shortkey="[option.shortkey]"
        @shortkey="handleOptionButtonClick"
        :disabled="disabled"
        :title="
          [`(${option.shortkey}) ` + option.title, option.description].filter(Boolean).join(': ')
        "
        :value="option.value"
        :color="isNotSelected ? 'grey' : option.iconColor"
        :icon="option.mdiIcon"
        :variant="'flat'"
        size="small"
      />
    </v-row>
    <v-row
      justify="center"
      class="text-caption text-truncate"
      :style="{ color: isNotSelected ? 'grey' : option.iconColor }"
    >
      <span :title="option.title">
        {{ trimTitle(option.title) }}
      </span>
    </v-row>
  </v-sheet>
  <v-btn
    v-if="onlyIcon"
    :icon="option.mdiIcon"
    :color="option.iconColor"
    :variant="'flat'"
    size="small"
  />
</template>
<style scoped></style>
