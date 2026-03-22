"use client";

import { useState } from "react";
import Image from "next/image";
import { Message, REACTION_EMOJIS } from "@/lib/types";
import LatexText from "./LatexText";
import ImageLightbox from "./ImageLightbox";

interface Props {
  message: Message;
  isOwn: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  isBookmarked?: boolean;
  onBookmark?: () => void;
}

function formatTimestamp(createdAt: number): string {
  const now  = new Date();
  const date = new Date(createdAt);
  const isToday = date.toDateString() === now.toDateString();
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  if (isToday) return `${hh}:${mm}`;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${hh}:${mm}`;
}

export default function MessageItem({
  message, isOwn, isAdmin, currentUserId, onDelete, onReact, isBookmarked, onBookmark,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const timeStr   = formatTimestamp(message.createdAt);
  const canDelete = isOwn || isAdmin;
  const hasText   = message.text.trim().length > 0;
  const hasImage  = !!message.imageUrl;

  const activeReactions = REACTION_EMOJIS.filter(
    ({ emoji }) => (message.reactions?.[emoji]?.length ?? 0) > 0
  );

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-4 group`}>

      {/* 名前・時刻・削除 */}
      <div className="flex items-baseline gap-2 mb-1">
        {!isOwn && (
          <span className="text-xs font-medium text-gray-600">{message.displayName}</span>
        )}
        <span className="text-xs text-gray-400">{timeStr}</span>
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
          >
            削除
          </button>
        )}
      </div>

      {/* 画像（添付あり） */}
      {hasImage && (
        <>
          <button
            onClick={() => setLightboxOpen(true)}
            className={`block mb-1 rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}
            style={{ maxWidth: 260 }}
          >
            <Image
              src={message.imageUrl!}
              alt="添付画像"
              width={260}
              height={200}
              className="object-cover w-full hover:brightness-90 transition"
              style={{ maxHeight: 280, objectFit: "cover" }}
            />
          </button>

          {lightboxOpen && (
            <ImageLightbox
              src={message.imageUrl!}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </>
      )}

      {/* テキストバブル */}
      {hasText && (
        <div className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
        }`}>
          <LatexText text={message.text} dark={isOwn} />
        </div>
      )}

      {/* リアクションエリア */}
      <div className={`flex flex-wrap gap-1 mt-1 items-center ${isOwn ? "justify-end" : "justify-start"}`}>
        {activeReactions.map(({ emoji, label }) => {
          const users   = message.reactions?.[emoji] ?? [];
          const reacted = currentUserId ? users.includes(currentUserId) : false;
          return (
            <button key={emoji} onClick={() => onReact?.(emoji)} title={label}
              className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition ${
                reacted
                  ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}>
              {emoji}<span className="ml-0.5">{users.length}</span>
            </button>
          );
        })}

        {onReact && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button key={emoji} onClick={() => onReact(emoji)} title={label}
                className="text-sm hover:scale-125 transition-transform px-0.5">
                {emoji}
              </button>
            ))}
          </div>
        )}

        {onBookmark && (
          <button
            onClick={onBookmark}
            title={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
            className={`text-sm px-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-125 ${
              isBookmarked ? "text-indigo-500 opacity-100" : "text-gray-400"
            }`}
          >
            🔖
          </button>
        )}
      </div>
    </div>
  );
}
