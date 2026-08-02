import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemoUser: (role?: "user" | "club_admin", customName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  toggleDemoAdminRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInDemoUser: async () => {},
  signOut: async () => {},
  updateProfileData: async () => {},
  toggleDemoAdminRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from Firestore whenever user changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);

        // Listen to profile updates live
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Create initial profile
            const isDefaultAdmin = currentUser.email?.includes("admin") || currentUser.email === "lukemendelsohn@gmail.com";
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Disc Golfer",
              email: currentUser.email || undefined,
              preferredCourse: "loriella-park",
              experienceLevel: "Novice",
              role: isDefaultAdmin ? "club_admin" : "user",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.warn("Firestore profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        // Check if demo user saved in local storage
        const localDemo = localStorage.getItem("spotsy_demo_user");
        if (localDemo) {
          try {
            const parsed = JSON.parse(localDemo) as UserProfile;
            setUserProfile(parsed);
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // Fallback to demo user login if popup blocked in iframe
      await signInDemoUser("user", "Spotsy Golfer");
    }
  };

  const signInDemoUser = async (role: "user" | "club_admin" = "user", customName?: string) => {
    const demoUid = role === "club_admin" ? "demo-admin-uid-101" : "demo-user-uid-202";
    const demoProfile: UserProfile = {
      uid: demoUid,
      displayName: customName || (role === "club_admin" ? "Bob Cannon (Club Admin)" : "Alex River (Club Member)"),
      email: role === "club_admin" ? "admin@spotsydiscgolf.org" : "member@spotsydiscgolf.org",
      preferredCourse: "loriella-park",
      experienceLevel: "Intermediate",
      role: role,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("spotsy_demo_user", JSON.stringify(demoProfile));
    setUserProfile(demoProfile);

    // Also persist to Firestore if possible
    try {
      await setDoc(doc(db, "users", demoUid), demoProfile, { merge: true });
    } catch (e) {
      console.warn("Demo user firestore sync notice:", e);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("spotsy_demo_user");
    setUserProfile(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Signout error:", e);
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, data);
    } else {
      localStorage.setItem("spotsy_demo_user", JSON.stringify(updated));
      try {
        await setDoc(doc(db, "users", userProfile.uid), updated, { merge: true });
      } catch (e) {
        console.warn("Demo profile update notice:", e);
      }
    }
  };

  const toggleDemoAdminRole = async () => {
    if (!userProfile) {
      await signInDemoUser("club_admin");
      return;
    }
    const newRole = userProfile.role === "club_admin" ? "user" : "club_admin";
    await updateProfileData({ role: newRole });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInDemoUser,
        signOut,
        updateProfileData,
        toggleDemoAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
