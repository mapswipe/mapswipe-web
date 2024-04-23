import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import { getCurrentUser } from 'vuefire'
import { default as Tr, i18nRoute } from '@/i18n/translation'

const appName = import.meta.env.VITE_APP_NAME

const denyUnauthorized = async (to, from, next) => {
  const currentUser = await getCurrentUser()
  if (currentUser?.emailVerified) {
    next()
  } else if (currentUser) {
    next(i18nRoute({ name: 'authentication', params: { authTab: 'recover-account' } }))
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
          path: 'projects',
          name: 'projects',
          alias: '',
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
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title
  next()
})

export default router
