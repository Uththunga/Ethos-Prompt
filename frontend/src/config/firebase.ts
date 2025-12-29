import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
// Type-only imports to avoid forcing analytics/performance into the bundle unless enabled
import type { Analytics } from 'firebase/analytics';
import type { Performance } from 'firebase/performance';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Staging configuration (explicit constants)
const STAGING_CONFIG = {
  apiKey: 'AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8',
  authDomain: 'rag-prompt-library-staging.firebaseapp.com',
  projectId: 'rag-prompt-library-staging',
  storageBucket: 'rag-prompt-library-staging.appspot.com',
  messagingSenderId: '857724136585',
  appId: '1:857724136585:web:aa8f0aaf24ff930aabea58',
  measurementId: 'G-MMB37GGBEN',
} as const;

// Detect staging mode via Vite mode, explicit env flag, or hostname
const IS_STAGING =
  (typeof import.meta.env.MODE !== 'undefined' && import.meta.env.MODE === 'staging') ||
  import.meta.env.VITE_APP_ENVIRONMENT === 'staging' ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.includes('rag-prompt-library-staging.web.app') ||
      window.location.hostname.includes('rag-prompt-library-staging.firebaseapp.com')));

// Prefer explicit staging config in staging builds; otherwise use env-driven config
const firebaseConfig = IS_STAGING
  ? STAGING_CONFIG
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

// Debug: Log environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Firebase Config Debug:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}

// Validate required configuration
const requiredConfig = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const missingConfig = requiredConfig.filter(
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingConfig.length > 0) {
  throw new Error(`Missing required Firebase configuration: ${missingConfig.join(', ')}`);
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'australia-southeast1');

// Initialize Analytics (guarded)
export const analyticsRef: { current: Analytics | null } = { current: null };

if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && typeof window !== 'undefined') {
  // Lazy-load analytics only in supported browsers
  import('firebase/analytics')
    .then(({ getAnalytics, isSupported }) =>
      isSupported()
        .then((supported) => {
          if (supported) {
            analyticsRef.current = getAnalytics(app);
            if (import.meta.env.DEV) console.log('📈 Firebase Analytics initialized');
          } else if (import.meta.env.DEV) {
            console.warn('Analytics not supported in this environment');
          }
        })
        .catch((err) => console.warn('Analytics support check failed:', err))
    )
    .catch((err) => console.warn('Analytics init skipped (module load failed):', err));
}

// Helper to access analytics instance (may be null until initialized)
export const getAnalyticsInstance = () => analyticsRef.current;

// Initialize App Check for additional security (bot protection, abuse prevention)
// Enabled in production with reCAPTCHA v3: 6Lc3yt0rAAAAAOjhUf_GzR0e-NublElsil8lq6YJ
if (import.meta.env.VITE_ENABLE_APP_CHECK === 'true') {
  import('./appCheck')
    .then(({ initializeFirebaseAppCheck }) => {
      initializeFirebaseAppCheck();
      if (import.meta.env.DEV) console.log('🛡️ Firebase App Check initialized');
    })
    .catch((error) => {
      console.warn('⚠️ Failed to load App Check:', error);
    });
}

// Connect to Firebase Emulators in development
// Check environment variables to determine if emulators should be used
const ENABLE_EMULATORS = import.meta.env.VITE_ENABLE_EMULATORS === 'true';
const USE_PRODUCTION_AUTH = import.meta.env.VITE_USE_PRODUCTION_AUTH === 'true';

// Debug logging for authentication configuration
if (import.meta.env.DEV) {
  console.log('🔐 Auth Configuration:', {
    enableEmulators: ENABLE_EMULATORS,
    useProductionAuth: USE_PRODUCTION_AUTH,
    environment: import.meta.env.VITE_APP_ENVIRONMENT,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  });
}

if (ENABLE_EMULATORS && typeof window !== 'undefined') {
  (async () => {
    try {
      // Force reconnection by clearing any cached connection state
      sessionStorage.removeItem('firebase-emulator-connected');
      localStorage.removeItem('firebase-emulator-connected');

      console.log('🔧 Connecting to Firebase Emulators (forced by VITE_ENABLE_EMULATORS)...');

      // Connect to Auth Emulator
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Auth Emulator connected on 9099');

      // Connect to Firestore Emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Firestore Emulator connected on 8080');

      // Connect to Functions Emulator
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('✅ Functions Emulator connected on 5001');

      // Connect to Storage Emulator
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Storage Emulator connected on 9199');

      sessionStorage.setItem('firebase-emulator-connected', 'true');
      console.log('🎉 Firebase Emulator connections established');
    } catch (error) {
      console.warn('❌ Emulator connection failed, using production services:', error);
    }
  })();
} else {
  if (USE_PRODUCTION_AUTH) {
    console.log('📡 Using production Firebase authentication for local development');
  } else {
    console.log('📡 Using production Firebase configuration (emulators disabled)');
  }
}

// Initialize Performance Monitoring (guarded)
export const perfRef: { current: Performance | null } = { current: null };

if (import.meta.env.VITE_ENABLE_PERFORMANCE === 'true' && typeof window !== 'undefined') {
  import('firebase/performance')
    .then(({ getPerformance }) => {
      perfRef.current = getPerformance(app);
      if (import.meta.env.DEV) console.log('⏱️ Firebase Performance initialized');
    })
    .catch((err) => console.warn('Performance init skipped (module load failed):', err));
}

export default app;
