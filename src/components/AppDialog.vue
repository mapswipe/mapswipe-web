<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      action: () => true,
      cancelButton: true,
      message: '',
      persistent: false,
      show: false,
      title: '',
    }
  },
  provide() {
    return {
      hideDialog: () => {
        this.show = false
      },
      showDialog: (
        title: string,
        message: string,
        action = () => true,
        persistent = false,
        cancelButton = true,
      ) => {
        this.title = title
        this.message = message
        this.action = action
        this.show = true
        this.persistent = persistent
        this.cancelButton = cancelButton
      },
    }
  },
})
</script>

<template>
  <slot name="content"></slot>
  <v-dialog v-model="show" max-width="600" :persistent="persistent">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn v-if="cancelButton" color="primary" @click="show = false">{{
          $t('appDialog.cancel')
        }}</v-btn>
        <v-btn color="primary" @click="action">{{ $t('appDialog.ok') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
