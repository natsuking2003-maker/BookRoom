"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection, query, where, orderBy, getDocs,
  collectionGroup, doc, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Message, Room } from "@/lib/types";

type Tab = "posts" | "created" | "favorites";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();

  const [tab, setTab]                   = useState<Tab>("posts");
  const [recentPosts, setRecentPosts]   = useState<Message[]>([]);
  const [createdRooms, setCreatedRooms] = useState<Room[]>([]);
  const [favoriteRooms, setFavoriteRooms] = useState<Room[]>([]);
  const [fetching, setFetching]         = useState(false);

  useEffect(() => {
    if (!user) return;
    if (tab === "posts")     fetchPosts();
    if (tab === "created")   fetchCreated();
    if (tab === "favorites") fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user]);

  const fetchPosts = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const q = query(
        collectionGroup(db, "messages"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Message)
        .slice(0, 50);
      setRecentPosts(msgs);
    } catch (e) {
      console.error("投稿履歴の取得失敗:", e);
    }
    setFetching(false);
  };

  const fetchCreated = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const q = query(
        collection(db, "rooms"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setCreatedRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Room));
    } catch (e) {
      console.error("作成ルームの取得失敗:", e);
    }
    setFetching(false);
  };

  const fetchFavorites = async () => {
    if (!user || !profile?.favorites?.length) {
      setFavoriteRooms([]);
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      const fetched = await Promise.all(
        profile.favorites.map(async (roomId) => {
          const snap = await getDoc(doc(db, "rooms", roomId));
          return snap.exists() ? ({ id: snap.id, ...snap.data() } as Room) : null;
        })
      );
      setFavoriteRooms(fetched.filter(Boolean) as Room[]);
    } catch (e) {
      console.error("お気に入りの取得失敗:", e);
    }
    setFetching(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">読み込み中...</div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">プロフィールを見るにはログインが必要です。</p>
        <Link href="/" className="text-indigo-600 hover:underline">ホームに戻る</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "posts",     label: "📝 投稿履歴" },
    { key: "created",   label: "🏠 作成ルーム" },
    { key: "favorites", label: "⭐ お気に入り" },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 flex-shrink-0">
          {(profile?.displayName ?? "?")[0].toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-800">
            {profile?.displayName ?? "ユーザー"}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {user.isAnonymous ? "匿名ユーザー" : (user.email ?? "")}
          </div>
          {profile?.isAdmin && (
            <span className="mt-1 inline-block text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              管理者
            </span>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-5">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === key
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {fetching ? (
        <div className="text-center py-16 text-gray-400">読み込み中...</div>
      ) : (
        <>
          {/* 投稿履歴 */}
          {tab === "posts" && (
            <div className="space-y-3">
              {recentPosts.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">投稿はまだありません。</p>
              ) : (
                recentPosts.map((msg) => (
                  <PostCard key={msg.id} msg={msg} />
                ))
              )}
            </div>
          )}

          {/* 作成ルーム */}
          {tab === "created" && (
            <div className="space-y-3">
              {createdRooms.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">作成したルームはありません。</p>
              ) : (
                createdRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))
              )}
            </div>
          )}

          {/* お気に入り */}
          {tab === "favorites" && (
            <div className="space-y-3">
              {favoriteRooms.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">お気に入りのルームはありません。</p>
              ) : (
                favoriteRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostCard({ msg }: { msg: Message }) {
  const date = new Date(msg.createdAt);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  const href = msg.roomId && msg.miniRoomId
    ? `/rooms/${msg.roomId}/${msg.miniRoomId}`
    : "/";

  return (
    <Link href={href} className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 hover:shadow transition group">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        {msg.roomTitle && (
          <span className="font-medium text-indigo-500 truncate">📚 {msg.roomTitle}</span>
        )}
        {msg.miniRoomTitle && (
          <span className="truncate text-gray-400"># {msg.miniRoomTitle}</span>
        )}
        <span className="ml-auto flex-shrink-0">{dateStr}</span>
      </div>

      {msg.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={msg.imageUrl}
          alt="添付画像"
          className="h-16 rounded-lg object-cover mb-2"
        />
      )}

      <p className="text-sm text-gray-700 line-clamp-3 group-hover:text-gray-900 transition">
        {msg.text || <span className="text-gray-400 italic">（画像のみ）</span>}
      </p>
    </Link>
  );
}

function RoomCard({ room }: { room: Room }) {
  return (
    <Link href={`/rooms/${room.id}`} className="flex gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 hover:shadow transition">
      {room.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={room.thumbnail}
          alt={room.title}
          className="w-14 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-100"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
          {room.title}
        </div>
        <div className="text-xs text-gray-400 mt-1">{room.author}</div>
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {room.tags.map((tag) => (
              <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-300 mt-1">
          💬 {room.messageCount ?? 0} 件
        </div>
      </div>
    </Link>
  );
}
