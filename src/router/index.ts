import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getCurrentUser } from 'vuefire'
import { default as Tr, i18nRoute } from '@/i18n/translation'

const appName = import.meta.env.VITE_APP_NAME
const allowUnverifiedUsers = import.meta.env.VITE_ALLOW_UNVERIFIED_USERS

const denyUnauthorized = async (to, from, next) => {
  const currentUser = await getCurrentUser()
  if (currentUser?.emailVerified || (currentUser && allowUnverifiedUsers)) {
    next()
  } else if (currentUser) {
    next(i18nRoute({ name: 'home', params: { authTab: 'recover-account' } }))
  } else {
    next(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } }))
  }
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/:locale?',
      component: RouterView,
      beforeEnter: Tr.routeMiddleware,
      meta: { title: appName },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'projects',
          name: 'projects',
          // lazy-load component when the route is visited
          component: () => import('../views/ProjectsView.vue'),
          beforeEnter: denyUnauthorized,
        },
        {
          path: 'projects/:projectId',
          name: 'project',
          component: () => import('../views/ProjectView.vue'),
          beforeEnter: denyUnauthorized,
        },
        {
          path: 'auth/:authTab?',
          name: 'authentication',
          component: () => import('../views/AuthView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          beforeEnter: async (to, from, next) => {
            const currentUser = await getCurrentUser()
            if (currentUser) {
              next()
            } else {
              next(i18nRoute({ name: 'authentication', params: { authTab: 'sign-in' } }))
            }
          },
        },
        {
          path: 'osm-callback',
          name: 'osm-callback',
          component: () => import('../components/OauthReturn.vue'),
          props: (route) => ({ token: route.query.token }),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title
  next()
})

export default router
