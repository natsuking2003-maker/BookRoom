"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { BookmarkedMessage, Message, MiniRoom, SavedTopic, UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  toggleFavorite: (roomId: string) => Promise<void>;
  updateAffiliation: (affiliation: string) => Promise<void>;
  toggleBookmark: (msg: Message) => Promise<void>;
  addSavedCategory: (cat: { label: string; query: string }) => Promise<void>;
  removeSavedCategory: (query: string) => Promise<void>;
  toggleSavedTopic: (mr: Pick<MiniRoom, "id" | "title" | "createdBy" | "createdAt" | "solved">, roomId: string, roomTitle: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  logout: async () => {},
  updateDisplayName: async () => {},
  toggleFavorite: async () => {},
  updateAffiliation: async () => {},
  toggleBookmark: async () => {},
  addSavedCategory: async () => {},
  removeSavedCategory: async () => {},
  toggleSavedTopic: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        let loadedProfile: UserProfile;
        if (snap.exists()) {
          loadedProfile = snap.data() as UserProfile;
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName:
              firebaseUser.displayName ||
              (firebaseUser.isAnonymous ? "匿名ユーザー" : "ユーザー"),
            isAdmin: false,
            favorites: [],
          };
          await setDoc(ref, newProfile);
          loadedProfile = newProfile;
        }

        // ストリーク更新
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const lastActiveDate = loadedProfile.lastActiveDate;
        if (lastActiveDate !== today) {
          let newStreak = 1;
          if (lastActiveDate === yesterday) {
            newStreak = (loadedProfile.streakCount ?? 0) + 1;
          }
          await updateDoc(ref, { lastActiveDate: today, streakCount: newStreak });
          loadedProfile = { ...loadedProfile, lastActiveDate: today, streakCount: newStreak };
        }

        setProfile(loadedProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) return;
      throw e;
    }
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { displayName: name });
    setProfile((prev) => (prev ? { ...prev, displayName: name } : null));
  };

  const toggleFavorite = async (roomId: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const isFav = profile?.favorites?.includes(roomId);
    await updateDoc(ref, {
      favorites: isFav ? arrayRemove(roomId) : arrayUnion(roomId),
    });
    setProfile((prev) => {
      if (!prev) return null;
      const favs = prev.favorites ?? [];
      return {
        ...prev,
        favorites: isFav ? favs.filter((id) => id !== roomId) : [...favs, roomId],
      };
    });
  };

  const updateAffiliation = async (affiliation: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { affiliation });
    setProfile((prev) => (prev ? { ...prev, affiliation } : null));
  };

  const toggleBookmark = async (msg: Message) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", msg.id);
    const isBookmarked = profile?.bookmarkIds?.includes(msg.id);

    if (isBookmarked) {
      await updateDoc(userRef, { bookmarkIds: arrayRemove(msg.id) });
      await deleteDoc(bookmarkRef);
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          bookmarkIds: (prev.bookmarkIds ?? []).filter((id) => id !== msg.id),
        };
      });
    } else {
      const bookmarkedMsg: BookmarkedMessage = {
        id:            msg.id,
        text:          msg.text,
        displayName:   msg.displayName,
        createdAt:     msg.createdAt,
        roomId:        msg.roomId        ?? "",
        miniRoomId:    msg.miniRoomId    ?? "",
        roomTitle:     msg.roomTitle     ?? "",
        miniRoomTitle: msg.miniRoomTitle ?? "",
        savedAt:       Date.now(),
        // undefined をFirestoreに書き込まないよう条件付きで追加
        ...(msg.imageUrl ? { imageUrl: msg.imageUrl } : {}),
      };
      await updateDoc(userRef, { bookmarkIds: arrayUnion(msg.id) });
      await setDoc(bookmarkRef, bookmarkedMsg);
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          bookmarkIds: [...(prev.bookmarkIds ?? []), msg.id],
        };
      });
    }
  };

  const addSavedCategory = async (cat: { label: string; query: string }) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { savedCategories: arrayUnion(cat) });
    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        savedCategories: [...(prev.savedCategories ?? []), cat],
      };
    });
  };

  const toggleSavedTopic = async (
    mr: Pick<MiniRoom, "id" | "title" | "createdBy" | "createdAt" | "solved">,
    roomId: string,
    roomTitle: string,
  ) => {
    if (!user) return;
    const userRef   = doc(db, "users", user.uid);
    const topicRef  = doc(db, "users", user.uid, "savedTopics", mr.id);
    const isSaved   = profile?.savedTopicIds?.includes(mr.id);

    if (isSaved) {
      await updateDoc(userRef, { savedTopicIds: arrayRemove(mr.id) });
      await deleteDoc(topicRef);
      setProfile((prev) =>
        prev ? { ...prev, savedTopicIds: (prev.savedTopicIds ?? []).filter((id) => id !== mr.id) } : null
      );
    } else {
      const savedTopic: SavedTopic = {
        id: mr.id,
        roomId,
        roomTitle,
        title:     mr.title,
        createdBy: mr.createdBy,
        createdAt: mr.createdAt,
        savedAt:   Date.now(),
        solved:    mr.solved ?? false,
      };
      await updateDoc(userRef, { savedTopicIds: arrayUnion(mr.id) });
      await setDoc(topicRef, savedTopic);
      setProfile((prev) =>
        prev ? { ...prev, savedTopicIds: [...(prev.savedTopicIds ?? []), mr.id] } : null
      );
    }
  };

  const removeSavedCategory = async (query: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const newCats = (profile?.savedCategories ?? []).filter((c) => c.query !== query);
    await updateDoc(ref, { savedCategories: newCats });
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, savedCategories: newCats };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user, profile, loading,
        signInWithGoogle, signInAsGuest, logout,
        updateDisplayName, toggleFavorite,
        updateAffiliation, toggleBookmark,
        addSavedCategory, removeSavedCategory,
        toggleSavedTopic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
