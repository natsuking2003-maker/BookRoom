"use client";

import { useEffect, useState } from "react";
import { ref, onValue, onDisconnect, set, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

/** 全ルームの在席人数を一括取得（ホームページ用） */
export function useAllRoomPresenceCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const presenceRef = ref(rtdb, "presence/r");
    const unsubscribe = onValue(presenceRef, (snap) => {
      const data = snap.val() ?? {};
      const result: Record<string, number> = {};
      Object.entries(data).forEach(([roomId, users]) => {
        result[roomId] = Object.keys(users as object).length;
      });
      setCounts(result);
    });
    return unsubscribe;
  }, []);

  return counts;
}

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
