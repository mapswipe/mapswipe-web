import { createApp } from 'vue'
import { VueFire, VueFireAuth, VueFireDatabaseOptionsAPI } from 'vuefire'
import { createPinia } from 'pinia'
import { vuetify } from '@/plugins/vuetify'
import { firebaseApp } from './firebase'
import OpenLayersMap from 'vue3-openlayers'
import Shortkey from 'vue3-shortkey'
import Chat from 'vue3-beautiful-chat'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth(), VueFireDatabaseOptionsAPI()],
})
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(i18n)
app.use(OpenLayersMap)
app.use(Shortkey)
app.use(Chat)

app.mount('#app')
