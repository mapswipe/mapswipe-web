import { initializeApp } from 'firebase/app'
import { initializeAnalytics, logEvent } from 'firebase/analytics'
import {
  connectDatabaseEmulator,
  equalTo,
  getDatabase,
  orderByChild,
  query,
  ref,
  startAfter,
} from 'firebase/database'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { isDefined } from '@togglecorp/fujs'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)

export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (firebaseConfig.measurementId) {
    const fbAnalytics = initializeAnalytics(firebaseApp)
    logEvent(fbAnalytics, eventName, eventParams)
  }
}

// used for the database refs
export const db = getDatabase(firebaseApp)

const shouldUseEmulator =
  isDefined(import.meta.env.VITE_FIREBASE_DB_EMULATOR_HOST) &&
  isDefined(import.meta.env.VITE_FIREBASE_DB_EMULATOR_PORT)

if (shouldUseEmulator) {
  connectDatabaseEmulator(
    db,
    import.meta.env.VITE_FIREBASE_DB_EMULATOR_HOST,
    import.meta.env.VITE_FIREBASE_DB_EMULATOR_PORT,
  )
}

export function getFirebaseAuth() {
  const auth = getAuth(firebaseApp)

  if (shouldUseEmulator && isDefined(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL)) {
    connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL)
  }

  return auth
}

// export reusable database references
export const dbRef = ref(db)
export const getProjectRef = (projectId: string) => ref(db, `v2/projects/${projectId}`)
export const getResultsRef = (projectId: string, groupId: string, userId: string) =>
  ref(db, `v2/results/${projectId}/${groupId}/${userId}`)
export const getTasksRef = (projectId: string, groupId: string) =>
  ref(db, `v2/tasks/${projectId}/${groupId}`)
export const getUserContributionsRef = (userId: string) =>
  ref(db, `v2/users/${userId}/contributions/`)
export const getProjectContributionsRef = (userId: string, projectId: string) => {
  return ref(db, `v2/users/${userId}/contributions/${projectId}`)
}
export const getUserGroupsOfUserRef = (userId: string) => ref(db, `v2/users/${userId}/userGroups/`)
export const projectsRef = ref(db, 'v2/projects')
export const userGroupsRef = ref(db, 'v2/userGroups')
export const userGroupMembershipLogsRef = ref(db, '/v2/userGroupMembershipLogs/')

export const getGroupsRef = (projectId: string) => ref(db, `v2/groups/${projectId}`)
// export reusable database queries
export const getGroupsQuery = (projectId: string) => {
  return query(getGroupsRef(projectId), orderByChild('requiredCount'), startAfter(0))
}
export const activeProjectsQuery = query(projectsRef, orderByChild('status'), equalTo('active'))
