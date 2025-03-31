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
  <v-btn
    v-if="onlyIcon"
    :icon="option.mdiIcon"
    :color="option.iconColor"
    variant="flat"
    size="small"
  />
  <v-sheet v-else class="mx-1 mx-sm-2 mx-md-3" :min-width="$vuetify.display.smAndUp ? 60 : 40">
    <v-row justify="center">
      <v-btn
        class="text-caption"
        @click="handleOptionButtonClick"
        v-shortkey="[option.shortkey]"
        @shortkey="handleOptionButtonClick"
        :disabled="disabled"
        :title="
          [`(${option.shortkey}) ` + option.title, option.description].filter(Boolean).join(': ')
        "
        :value="option.value"
        :color="isNotSelected ? '#ccc' : option.iconColor"
        :icon="option.mdiIcon"
        variant="flat"
        size="small"
      />
    </v-row>
    <v-row
      v-if="$vuetify.display.smAndUp"
      justify="center"
      class="text-caption text-truncate"
      :style="{ color: isNotSelected ? '#888' : option.iconColor }"
    >
      <span :title="option.title">
        {{ trimTitle(option.title) }}
      </span>
    </v-row>
  </v-sheet>
</template>
<style scoped></style>
