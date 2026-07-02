import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let app: FirebaseApp | null = null
let db: Database | null = null

if (firebaseConfig.databaseURL) {
  try {
    app = initializeApp(firebaseConfig)
    db = getDatabase(app)
    console.log('✅ Firebase initialized')
  } catch (error) {
    console.warn('⚠️ Firebase init failed:', error)
  }
} else {
  console.warn('⚠️ No Firebase Database URL found. Running in offline mode.')
}

export { app, db }
export default app