import { defineStore } from 'pinia'
import { useCurrentUser } from 'vuefire'

export const useCurrentUserStore = defineStore('currentUser', () => {
  const currentUser = useCurrentUser()

  return { currentUser }
})
