<script lang="ts">
import { defineComponent } from 'vue'
import RecoverAccount from '@/components/RecoverAccount.vue'
import SignIn from '@/components/SignIn.vue'
import SignUp from '@/components/SignUp.vue'
import BasicPage from '@/components/BasicPage.vue'
import { i18nRoute } from '@/i18n/translation'

export default defineComponent({
  components: {
    basicPage: BasicPage,
    signIn: SignIn,
    signUp: SignUp,
    recoverAccount: RecoverAccount,
  },
  data: () => ({
    activeTab: '',
    projectsDialog: false,
    tabs: [
      { name: 'authView.signIn', icon: 'mdi-login', route: 'sign-in', component: 'signIn' },
      { name: 'authView.signUp', icon: 'mdi-account-plus', route: 'sign-up', component: 'signUp' },
      {
        name: 'authView.recoverAccount',
        icon: 'mdi-email-fast',
        route: 'recover-account',
        component: 'recoverAccount',
      },
    ],
  }),
  methods: {
    i18nRoute,
  },
  mounted() {
    // if(this.$route.params.fromProjects) this.projectsDialog = true
  },
})
</script>

<template>
  <basic-page page-name="auth">
    <v-tabs v-model="activeTab" color="secondary" align-tabs="center">
      <v-tab
        v-for="tab in tabs"
        :key="tab.name"
        :value="tab.route"
        :to="i18nRoute({ name: 'authentication', params: { authTab: tab.route } })"
      >
        <v-icon class="hidden-sm-and-up" size="x-large">{{ tab.icon }}</v-icon>
        <span class="hidden-xs">{{ $t(tab.name) }}</span>
      </v-tab>
    </v-tabs>
    <div>
      <v-window v-model="activeTab" align="center">
        <v-window-item v-for="tab in tabs" :key="tab.name" :value="tab.route">
          <component :is="tab.component" />
        </v-window-item>
      </v-window>
    </div>

    <!--v-dialog
      v-model="projectsDialog"
      max-width="600"
      >
      <v-card>
        <v-card-title class="text-h5">
          {{$t('authView.pleaseSignIn')}}
        </v-card-title>
        <v-card-text>
          {{$t('auth.signInToAccessProjects')}}.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn
            color="primary"
            @click="projectsDialog = false"
            text
            >
            {{$t('global.ok')}}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog-->
  </basic-page>
</template>
