<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      action: () => true,
      message: '',
      persistent: false,
      show: false,
      theme: '',
      timeout: 6000,
      title: '',
    }
  },
  provide() {
    return {
      showSnackbar: (message: string, theme = 'info', timeout: number = 6000) => {
        this.message = message
        this.theme = theme
        this.timeout = timeout
        this.show = true
      },
      hideSnackbar: () => {
        this.show = false
      },
    }
  },
})
</script>

<template>
  <slot name="content"></slot>
  <v-snackbar v-model="show" :color="theme" :timeout="timeout">
    {{ message }}
    <template #actions>
      <v-btn variant="text" @click="show = false">
        {{ $t('appToaster.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped></style>
