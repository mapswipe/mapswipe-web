<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
console.log('Route:', route)

onMounted(() => {
  const osmCode = route.query.code 
  const osmState = route.query.state 
  const fbToken = route.query.fbToken as string
  const osmError = route.query.error 

  console.log('code:', osmCode)
  console.log('state:', osmState)
  console.log('fbToken:', fbToken)
  console.log('error:', osmError)

})
</script>

<template>
  <p>Testing return from Firebase</p>
</template>




