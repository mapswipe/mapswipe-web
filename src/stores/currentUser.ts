import { defineStore } from 'pinia'
import { useCurrentUser } from 'vuefire'

export interface CurrentUserStore {
  currentUser: any // TODO: need to be more precise
}

export const useCurrentUserStore = defineStore('currentUser', () => {
  const currentUser = useCurrentUser()

  return {
    currentUser,
  } as CurrentUserStore
})
