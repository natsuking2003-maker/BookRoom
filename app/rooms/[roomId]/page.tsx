"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  doc, getDoc, collection, onSnapshot, addDoc, orderBy, query, deleteDoc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, MiniRoom } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile, toggleFavorite, toggleSavedTopic } = useAuth();
  const presenceCount = usePresence(`presence/r/${roomId}`);

  const [room,      setRoom]      = useState<Room | null>(null);
  const [miniRooms, setMiniRooms] = useState<MiniRoom[]>([]);
  const [newTitle,  setNewTitle]  = useState("");
  const [creating,  setCreating]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [unreadMap, setUnreadMap] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    getDoc(doc(db, "rooms", roomId)).then((snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() } as Room);
    });

    const q = query(collection(db, "rooms", roomId, "miniRooms"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const mrs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MiniRoom[];
      setMiniRooms(mrs);

      const newMap: { [id: string]: number } = {};
      mrs.forEach((mr) => {
        const lastSeen = parseInt(localStorage.getItem(`visit_${mr.id}`) ?? "0");
        newMap[mr.id] = Math.max(0, (mr.messageCount ?? 0) - lastSeen);
      });
      setUnreadMap(newMap);
    });
    return unsubscribe;
  }, [roomId]);

  const createMiniRoom = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    const now    = Date.now();
    const newMr  = { title: newTitle.trim(), createdBy: user.uid, createdAt: now, messageCount: 0 };
    const docRef = await addDoc(collection(db, "rooms", roomId, "miniRooms"), newMr);

    // 作成したトピックを自動でマイページに保存
    await toggleSavedTopic(
      { id: docRef.id, title: newMr.title, createdBy: newMr.createdBy, createdAt: newMr.createdAt, solved: false },
      roomId,
      room?.title ?? "",
    );

    setNewTitle("");
    setCreating(false);
    setShowForm(false);
  };

  const deleteMiniRoom = async (e: React.MouseEvent, mr: MiniRoom) => {
    e.preventDefault();
    if (!confirm(`「# ${mr.title}」を削除しますか？`)) return;
    await deleteDoc(doc(db, "rooms", roomId, "miniRooms", mr.id));
  };

  const canDeleteMiniRoom = (mr: MiniRoom) =>
    profile?.isAdmin || (user && mr.createdBy === user.uid);

  if (!room) return <p className="text-center text-gray-400 py-16">読み込み中...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-indigo-500">ホーム</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600 truncate">{room.title}</span>
      </nav>

      {/* 書籍情報 */}
      <div className="bg-white rounded-xl shadow p-5 mb-6 flex gap-4">
        {room.thumbnail ? (
          <div className="flex-shrink-0 w-16 h-20 relative">
            <Image src={room.thumbnail} alt={room.title} fill className="object-cover rounded" sizes="64px" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-20 bg-indigo-100 rounded flex items-center justify-center text-indigo-300 text-3xl">📚</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold text-gray-800">{room.title}</h1>
            {user && (
              <button
                onClick={() => toggleFavorite(room.id)}
                title={profile?.favorites?.includes(room.id) ? "お気に入り解除" : "お気に入り登録"}
                className="flex-shrink-0 text-xl leading-none transition hover:scale-110"
              >
                {profile?.favorites?.includes(room.id) ? "⭐" : "☆"}
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">{room.author}</p>
          {room.tags && room.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {room.tags.map((tag) => (
                <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {room.description && <p className="text-xs text-gray-400 mt-1 line-clamp-3">{room.description}</p>}
        </div>
      </div>

      {/* トピック一覧 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">トピック一覧</h2>
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            {presenceCount}人が閲覧中
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition"
        >
          {showForm ? "キャンセル" : "+ トピックを追加"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMiniRoom()}
            placeholder="トピック名を入力..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            autoFocus
          />
          <button
            onClick={createMiniRoom}
            disabled={creating || !newTitle.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition"
          >
            追加
          </button>
        </div>
      )}

      {miniRooms.length === 0 ? (
        <p className="text-center text-gray-400 py-12">まだトピックがありません。最初のトピックを作りましょう！</p>
      ) : (
        <div className="space-y-2">
          {miniRooms.map((mr) => {
            const unread   = unreadMap[mr.id] ?? 0;
            const isSaved  = profile?.savedTopicIds?.includes(mr.id) ?? false;
            return (
              <div key={mr.id} className="relative group">
                <Link
                  href={`/rooms/${roomId}/${mr.id}`}
                  className="flex items-center justify-between bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl p-4 transition"
                >
                  <span className="font-medium text-gray-800 group-hover:text-indigo-600 flex items-center gap-2">
                    # {mr.title}
                    {mr.solved && <span title="解決済み">✅</span>}
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                  <span className="text-indigo-400 text-sm">→</span>
                </Link>

                {/* 右端のアクションボタン群 */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {/* 📌 マイページに保存ボタン（ログイン済みのみ） */}
                  {user && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSavedTopic(mr, roomId, room?.title ?? "");
                      }}
                      title={isSaved ? "マイページから削除" : "マイページに追加"}
                      className={`text-base px-1.5 py-1 rounded transition ${
                        isSaved
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-gray-400 hover:text-indigo-500"
                      }`}
                    >
                      {isSaved ? "📌" : "📍"}
                    </button>
                  )}

                  {/* 削除ボタン */}
                  {canDeleteMiniRoom(mr) && (
                    <button
                      onClick={(e) => deleteMiniRoom(e, mr)}
                      className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 rounded"
                      title="トピックを削除"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
