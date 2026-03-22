"use client";

import { useEffect, useState } from "react";
import { ref, onValue, onDisconnect, set, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Firebase Realtime Database を使ったリアルタイム在席カウント
 * presencePath: 例 "presence/r/roomId123" や "presence/m/miniRoomId456"
 */
export function usePresence(presencePath: string): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!presencePath) return;

    const presenceRef = ref(rtdb, presencePath);

    // 人数をリアルタイム購読
    const unsubscribe = onValue(presenceRef, (snap) => {
      setCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });

    // ログイン済みなら自分の在席を登録
    if (user) {
      const myRef = ref(rtdb, `${presencePath}/${user.uid}`);
      set(myRef, true);
      // ブラウザを閉じても自動削除
      onDisconnect(myRef).remove();

      return () => {
        unsubscribe();
        remove(myRef); // ページ離脱時に即時削除
      };
    }

    return unsubscribe;
  // user.uid が変わった場合も再実行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presencePath, user?.uid]);

  return count;
}
