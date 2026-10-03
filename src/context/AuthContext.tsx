import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '../types';
const KEY = 'spotsy-demo-session-v1';
function load(): UserProfile | null { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }
interface AuthContextType {
  user: null; userProfile: UserProfile | null; loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemoUser: (role?: 'user' | 'club_admin', customName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  toggleDemoAdminRole: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>(null!);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setProfile] = useState<UserProfile | null>(load);
  const persist = (profile: UserProfile | null) => { setProfile(profile); localStorage.setItem(KEY, JSON.stringify(profile)); };
  const signInDemoUser = async (role: 'user' | 'club_admin' = 'user', customName?: string) => {
    persist({ uid: role === 'club_admin' ? 'demo-organizer' : customName ? 'demo-new-member' : 'demo-user-uid-202',
      displayName: customName || (role === 'club_admin' ? 'Sample Organizer' : 'Alex River'),
      preferredCourse: 'loriella-park', experienceLevel: 'Intermediate', role, createdAt: new Date().toISOString() });
  };
  return <AuthContext.Provider value={{ user: null, userProfile, loading: false, signInDemoUser,
    signInWithGoogle: async () => { throw new Error('Real sign-in is disabled. Choose Demo Sign In.'); },
    signOut: async () => persist(null),
    updateProfileData: async (data) => { if (userProfile) persist({ ...userProfile, ...data, uid: userProfile.uid, role: userProfile.role }); },
    toggleDemoAdminRole: async () => { await signInDemoUser(userProfile?.role === 'club_admin' ? 'user' : 'club_admin'); },
  }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
