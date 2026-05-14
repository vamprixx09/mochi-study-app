import { UserProfile, PremiumHistoryEntry } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export function checkPremiumExpiry(user: UserProfile): { isExpired: boolean, updatedUser?: UserProfile } {
  if (!user.isPremium || user.premiumPlan === 'lifetime' || !user.premiumExpiresAt) {
    return { isExpired: false };
  }

  const now = new Date();
  const expiry = new Date(user.premiumExpiresAt);

  if (now > expiry) {
    // Premium has expired
    const updatedUser: UserProfile = {
      ...user,
      isPremium: false,
      premiumPlan: 'none',
      premiumExpiresAt: undefined,
    };
    return { isExpired: true, updatedUser };
  }

  return { isExpired: false };
}

export async function syncPremiumStatus(user: UserProfile, setUser: (user: UserProfile) => void) {
  const { isExpired, updatedUser } = checkPremiumExpiry(user);
  
  if (isExpired && updatedUser && user.uid) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPremium: false,
        premiumPlan: 'none',
        premiumExpiresAt: null
      });
      setUser(updatedUser);
      console.log('Premium expired and user downgraded to free.');
    } catch (error) {
      console.error('Failed to sync premium status:', error);
    }
  }
}

export function calculateExpiryDate(plan: 'starter' | 'full' | 'lifetime'): string | undefined {
  const now = new Date();
  if (plan === 'starter') {
    now.setDate(now.getDate() + 30);
    return now.toISOString();
  }
  if (plan === 'full') {
    now.setDate(now.getDate() + 90);
    return now.toISOString();
  }
  return undefined; // Lifetime
}

export type PremiumFeature = 'ai_advanced' | 'themes' | 'templates' | 'notes' | 'image_gen' | 'stickers' | 'ai_pdf' | 'ai_tutor';

export const isFeatureUnlocked = (user: UserProfile, feature: PremiumFeature): boolean => {
  // Basic AI chat and standard notes are free for everyone 🎀
  if (feature === 'notes') return true;

  if (!user.isPremium) return false;
  
  // Lifetime and Full unlock everything
  if (user.premiumPlan === 'lifetime' || user.premiumPlan === 'full') return true;
  
  // Starter has limited features
  if (user.premiumPlan === 'starter') {
    // Starter: Frames, Themes, Aesthetic packs (stickers), Basic AI (but not PDF/Tutor)
    return ['themes', 'templates', 'stickers'].includes(feature);
  }
  
  return true;
};
