<script lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppBanner from '@/components/AppBanner.vue'
import AppToaster from '@/components/AppToaster.vue'
import AppDialog from '@/components/AppDialog.vue'
import AppFooter from '@/components/AppFooter.vue'

export default {
  name: 'App',
  components: {
    appHeader: AppHeader,
    appBanner: AppBanner,
    appToaster: AppToaster,
    appDialog: AppDialog,
    appFooter: AppFooter,
  },
}
</script>

<template>
  <v-app>
    <app-header />
    <v-main>
      <app-banner />
      <app-toaster>
        <template #content>
          <app-dialog>
            <template #content>
              <router-view v-slot="{ Component }">
                <v-fade-transition mode="out-in">
                  <component :is="Component" />
                </v-fade-transition>
              </router-view>
            </template>
          </app-dialog>
        </template>
      </app-toaster>
    </v-main>
    <app-footer />
  </v-app>
</template>

<style scoped></style>
