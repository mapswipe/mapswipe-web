<script lang="ts">
import { defineComponent } from 'vue'
import { i18nRoute } from '@/i18n/translation'
import { mapStores } from 'pinia'
import { useCurrentUserStore, CurrentUserStore } from '@/stores/currentUser'

export default defineComponent({
  methods: {
    i18nRoute,
  },
  computed: {
    ...mapStores(useCurrentUserStore),
    user: {
      get(): CurrentUserStore | undefined { // Type annotation for user computed property
        return this.currentUserStore.currentUser
      },
      cache: false, // Ensure reactivity
    },
    isVerified(): boolean | undefined { // Type annotation for isVerified computed property
      return this.currentUserStore.currentUser?.emailVerified
    },
  },
})
</script>
