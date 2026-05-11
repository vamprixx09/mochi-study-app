import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validation for connection
async function testConnection() {
  try {
    // We use a simple getDoc to check if we can at least reach the SDK
    // but we don't want to crash or show scary errors if the initial connection is slow
    await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
      // Ignore initial server failure, let the app operate in offline mode if needed
    });
    console.log("Firebase initialized! 🍡");
  } catch (error) {
    // Silently handle
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // If it's just an offline error or transient failure, don't throw and crash the app
  const lowerError = errInfo.error.toLowerCase();
  if (lowerError.includes('offline') || lowerError.includes('unavailable') || lowerError.includes('network')) {
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}
