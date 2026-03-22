"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection, addDoc, onSnapshot, orderBy, query,
  doc, getDoc, limit, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Message, MiniRoom, Room, ViewedTopic } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import MessageItem from "@/components/MessageItem";
import Toast from "@/components/Toast";
import { usePresence } from "@/hooks/usePresence";

export default function ChatPage() {
  const { roomId, miniRoomId } = useParams<{ roomId: string; miniRoomId: string }>();
  const { user, profile, signInWithGoogle, signInAsGuest, toggleBookmark } = useAuth();
  const presenceCount = usePresence(`presence/m/${miniRoomId}`);

  const [room, setRoom]         = useState<Room | null>(null);
  const [miniRoom, setMiniRoom] = useState<MiniRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);

  const [imageFile, setImageFile]             = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadError, setUploadError]         = useState<string | null>(null);
  const [toastMsg,   setToastMsg]             = useState("");
  const [showToast,  setShowToast]            = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2500);
  };

  useEffect(() => {
    getDoc(doc(db, "rooms", roomId)).then((snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() } as Room);
    });
    getDoc(doc(db, "rooms", roomId, "miniRooms", miniRoomId)).then((snap) => {
      if (snap.exists()) {
        const mr = { id: snap.id, ...snap.data() } as MiniRoom;
        setMiniRoom(mr);
        localStorage.setItem(`visit_${miniRoomId}`, String(mr.messageCount ?? 0));
      }
    });

    const q = query(
      collection(db, "rooms", roomId, "miniRooms", miniRoomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]);
    });
    return unsubscribe;
  }, [roomId, miniRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 閲覧履歴をFirestoreに保存（user・room・miniRoom が揃ったタイミングで1回）
  const viewedSaved = useRef(false);
  useEffect(() => {
    if (!user || !room || !miniRoom || viewedSaved.current) return;
    viewedSaved.current = true;
    const viewed: ViewedTopic = {
      id:        miniRoom.id,
      roomId,
      roomTitle: room.title,
      title:     miniRoom.title,
      createdBy: miniRoom.createdBy,
      createdAt: miniRoom.createdAt,
      viewedAt:  Date.now(),
    };
    setDoc(doc(db, "users", user.uid, "viewedTopics", miniRoomId), viewed);
  }, [user, room, miniRoom, roomId, miniRoomId]);

  // 画像選択ハンドラ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("画像は5MB以下にしてください。");
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    // input をリセットして同じファイルを再選択可能に
    e.target.value = "";
  };

  // 画像プレビュー削除
  const removeImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  // メッセージ送信
  const sendMessage = async () => {
    if (!text.trim() && !imageFile) return;
    if (!user) return;
    setSending(true);
    setUploading(!!imageFile);
    setUploadError(null);

    let imageUrl: string | undefined;

    // 画像アップロード（30秒タイムアウト付き）
    if (imageFile) {
      try {
        const storageRef = ref(
          storage,
          `chat-images/${roomId}/${miniRoomId}/${Date.now()}_${imageFile.name}`
        );

        // タイムアウト用 Promise（30秒）
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 30000)
        );

        await Promise.race([uploadBytes(storageRef, imageFile), timeout]);
        imageUrl = await getDownloadURL(storageRef);
      } catch (err: unknown) {
        console.error("画像アップロード失敗:", err);
        const msg = err instanceof Error ? err.message : String(err);

        let userMsg = "画像のアップロードに失敗しました。";
        if (msg === "TIMEOUT") {
          userMsg = "アップロードがタイムアウトしました。Firebase StorageがFirebaseコンソールで有効になっているか確認してください。";
        } else if (msg.includes("storage/unauthorized") || msg.includes("403")) {
          userMsg = "アップロード権限がありません。Firebase Storageのルールを確認してください。";
        } else if (msg.includes("storage/object-not-found")) {
          userMsg = "Storageバケットが見つかりません。Firebase Storageを有効化してください。";
        }

        setUploadError(userMsg);
        setSending(false);
        setUploading(false);
        return;
      }
    }

    const displayName = profile?.displayName ?? (user.isAnonymous ? "匿名ユーザー" : "ユーザー");

    const msgData: Record<string, unknown> = {
      text:          text.trim(),
      userId:        user.uid,
      displayName,
      createdAt:     Date.now(),
      roomId,
      miniRoomId,
      roomTitle:     room?.title ?? "",
      miniRoomTitle: miniRoom?.title ?? "",
    };
    if (imageUrl) msgData.imageUrl = imageUrl;

    await addDoc(
      collection(db, "rooms", roomId, "miniRooms", miniRoomId, "messages"),
      msgData
    );

    await Promise.all([
      updateDoc(doc(db, "rooms", roomId), { messageCount: increment(1) }),
      updateDoc(doc(db, "rooms", roomId, "miniRooms", miniRoomId), { messageCount: increment(1) }),
      updateDoc(doc(db, "users", user.uid), { messagesSent: increment(1) }),
    ]);

    const currentCount = (miniRoom?.messageCount ?? 0) + 1;
    localStorage.setItem(`visit_${miniRoomId}`, String(currentCount));

    setText("");
    removeImage();
    setSending(false);
    setUploading(false);
  };

  // メッセージ削除
  const deleteMessage = async (messageId: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;
    await deleteDoc(doc(db, "rooms", roomId, "miniRooms", miniRoomId, "messages", messageId));
  };

  // リアクション切り替え
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const msgRef  = doc(db, "rooms", roomId, "miniRooms", miniRoomId, "messages", messageId);
    const msg     = messages.find((m) => m.id === messageId);
    const reactors = msg?.reactions?.[emoji] ?? [];
    if (reactors.includes(user.uid)) {
      await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayRemove(user.uid) });
    } else {
      await updateDoc(msgRef, { [`reactions.${emoji}`]: arrayUnion(user.uid) });
    }
  };

  const canSend = !sending && (text.trim().length > 0 || !!imageFile);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Toast message={toastMsg} show={showToast} />

      {/* パンくずリスト */}
      <nav className="text-sm text-gray-400 mb-3 flex-shrink-0">
        <Link href="/" className="hover:text-indigo-500">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href={`/rooms/${roomId}`} className="hover:text-indigo-500 truncate max-w-[160px] inline-block align-bottom">
          {room?.title ?? "..."}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600"># {miniRoom?.title ?? "..."}</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          {presenceCount}人が参加中
        </span>
      </nav>

      {/* 解決済みトグルボタン（作成者のみ） */}
      {user && miniRoom && miniRoom.createdBy === user.uid && (
        <div className="mb-3 flex-shrink-0">
          <button
            onClick={async () => {
              const newSolved = !miniRoom.solved;
              await updateDoc(doc(db, "rooms", roomId, "miniRooms", miniRoomId), { solved: newSolved });
              setMiniRoom((prev) => prev ? { ...prev, solved: newSolved } : null);
            }}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
              miniRoom.solved
                ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
            }`}
          >
            {miniRoom.solved ? "🔄 未解決に戻す" : "✅ 解決済みにする"}
          </button>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow p-4 mb-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">
            まだメッセージはありません。最初のメッセージを送りましょう！
          </p>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwn={msg.userId === user?.uid}
              isAdmin={profile?.isAdmin}
              currentUserId={user?.uid}
              onDelete={() => deleteMessage(msg.id)}
              onReact={user ? (emoji) => toggleReaction(msg.id, emoji) : undefined}
              isBookmarked={profile?.bookmarkIds?.includes(msg.id)}
              onBookmark={user ? async () => {
                const wasBookmarked = profile?.bookmarkIds?.includes(msg.id) ?? false;
                await toggleBookmark(msg);
                triggerToast(wasBookmarked ? "ブックマークを解除しました" : "ブックマークに追加しました");
              } : undefined}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      {user ? (
        <div className="flex-shrink-0 space-y-2">
          {/* アップロードエラー表示 */}
          {uploadError && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* 画像プレビュー */}
          {imagePreviewUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="プレビュー"
                className="h-24 rounded-xl border border-gray-200 object-cover shadow-sm"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-white border border-gray-300 text-gray-500 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* 画像添付ボタン */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="画像を添付"
              className="text-gray-400 hover:text-indigo-500 transition text-xl px-1 flex-shrink-0"
            >
              📎
            </button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="メッセージを入力... (数式は $E=mc^2$ のように書けます)"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition"
            >
              {uploading ? "..." : "送信"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 bg-white rounded-xl shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-3">メッセージを送るにはログインが必要です</p>
          <div className="flex justify-center gap-3">
            <button onClick={signInWithGoogle} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Googleでログイン
            </button>
            <button onClick={signInAsGuest} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition">
              匿名で参加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
