"use client";

import Link from "next/link";
import Image from "next/image";
import { Room } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  room: Room;
  presenceCount?: number;
}

export default function RoomCard({ room, presenceCount = 0 }: Props) {
  const { user, profile, toggleFavorite } = useAuth();
  const isFavorite = profile?.favorites?.includes(room.id) ?? false;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`「${room.title}」を削除しますか？`)) return;
    await deleteDoc(doc(db, "rooms", room.id));
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    await toggleFavorite(room.id);
  };

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <div className="bg-white rounded-xl shadow hover:shadow-md transition border border-gray-100 overflow-hidden flex gap-4 p-4 relative">
        {/* サムネイル */}
        {room.thumbnail ? (
          <div className="flex-shrink-0 w-16 h-20 relative">
            <Image src={room.thumbnail} alt={room.title} fill className="object-cover rounded" sizes="64px" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-20 bg-indigo-100 rounded flex items-center justify-center text-indigo-300 text-3xl">
            📚
          </div>
        )}

        {/* テキスト */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 truncate">
            {room.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{room.author}</p>
          {room.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{room.description}</p>
          )}
          {/* 在席人数 */}
          {presenceCount > 0 && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              {presenceCount}人が閲覧中
            </p>
          )}

          {/* タグ */}
          {room.tags && room.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {room.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* お気に入りボタン */}
        {user && (
          <button
            onClick={handleFavorite}
            title={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
            className="absolute top-2 right-2 text-lg transition hover:scale-110"
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
        )}

        {/* 管理者削除ボタン */}
        {profile?.isAdmin && (
          <button
            onClick={handleDelete}
            className="absolute bottom-2 right-2 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
          >
            削除
          </button>
        )}
      </div>
    </Link>
  );
}
