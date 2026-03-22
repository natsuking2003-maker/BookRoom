"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  orderBy,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  ALL_BADGES,
  BookmarkedMessage,
  Room,
  SavedTopic,
  ViewedTopic,
  getRank,
  computeEarnedBadges,
} from "@/lib/types";
import DisplayNameModal from "@/components/DisplayNameModal";
import LatexText from "@/components/LatexText";

type Tab = "dashboard" | "topics" | "bookmarks" | "settings";
type TopicFilter = "all" | "own" | "others" | "viewed";

export default function MyPage() {
  const { user, profile, updateAffiliation, removeSavedCategory } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Dashboard state
  const [weeklyPosts, setWeeklyPosts] = useState(0);
  const [reactedPosts, setReactedPosts] = useState(0);
  const [favoriteRooms, setFavoriteRooms] = useState<Room[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // Topics state
  const [myTopics, setMyTopics]       = useState<SavedTopic[]>([]);
  const [viewedTopics, setViewedTopics] = useState<ViewedTopic[]>([]);
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [viewedLoaded, setViewedLoaded] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);

  // Settings state
  const [affiliation, setAffiliation] = useState(profile?.affiliation ?? "");
  const [affiliationSaving, setAffiliationSaving] = useState(false);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && profile === null) {
      // wait for loading
    }
  }, [user, profile]);

  // Load dashboard data
  useEffect(() => {
    if (!user) return;
    const loadDashboard = async () => {
      // 今週のメッセージ
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const msgsQuery = query(
        collectionGroup(db, "messages"),
        where("userId", "==", user.uid),
        where("createdAt", ">", sevenDaysAgo)
      );
      const msgsSnap = await getDocs(msgsQuery);
      setWeeklyPosts(msgsSnap.size);

      // リアクションがついた投稿
      let reacted = 0;
      msgsSnap.forEach((d) => {
        const reactions = d.data().reactions as Record<string, string[]> | undefined;
        if (reactions) {
          const hasReaction = Object.values(reactions).some((users) => users.length > 0);
          if (hasReaction) reacted++;
        }
      });
      setReactedPosts(reacted);

      // お気に入りルーム（最大3件）
      if (profile?.favorites && profile.favorites.length > 0) {
        const roomIds = profile.favorites.slice(0, 3);
        const rooms = await Promise.all(
          roomIds.map(async (rid) => {
            const snap = await getDoc(doc(db, "rooms", rid));
            return snap.exists() ? ({ id: snap.id, ...snap.data() } as Room) : null;
          })
        );
        setFavoriteRooms(rooms.filter(Boolean) as Room[]);
      }

      // ブックマーク数
      const bmSnap = await getDocs(collection(db, "users", user.uid, "bookmarks"));
      setBookmarkCount(bmSnap.size);
    };
    loadDashboard();
  }, [user, profile]);

  // Load topics（savedTopics サブコレクションから取得）
  useEffect(() => {
    if (!user || activeTab !== "topics" || topicsLoaded) return;
    const loadTopics = async () => {
      const q = query(
        collection(db, "users", user.uid, "savedTopics"),
        orderBy("savedAt", "desc")
      );
      const snap = await getDocs(q);
      setMyTopics(snap.docs.map((d) => d.data() as SavedTopic));
      setTopicsLoaded(true);
    };
    loadTopics();
  }, [user, activeTab, topicsLoaded]);

  // Load viewed topics
  useEffect(() => {
    if (!user || topicFilter !== "viewed" || viewedLoaded) return;
    const load = async () => {
      const q = query(
        collection(db, "users", user.uid, "viewedTopics"),
        orderBy("viewedAt", "desc")
      );
      const snap = await getDocs(q);
      setViewedTopics(snap.docs.map((d) => d.data() as ViewedTopic));
      setViewedLoaded(true);
    };
    load();
  }, [user, topicFilter, viewedLoaded]);

  // Load bookmarks
  useEffect(() => {
    if (!user || activeTab !== "bookmarks" || bookmarksLoaded) return;
    const loadBookmarks = async () => {
      const q = query(
        collection(db, "users", user.uid, "bookmarks"),
        orderBy("savedAt", "desc")
      );
      const snap = await getDocs(q);
      setBookmarks(snap.docs.map((d) => d.data() as BookmarkedMessage));
      setBookmarksLoaded(true);
    };
    loadBookmarks();
  }, [user, activeTab, bookmarksLoaded]);

  // Sync affiliation input with profile
  useEffect(() => {
    setAffiliation(profile?.affiliation ?? "");
  }, [profile?.affiliation]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-500 mb-4">マイページを表示するにはログインが必要です。</p>
        <Link href="/" className="text-indigo-600 hover:underline">ホームへ戻る</Link>
      </div>
    );
  }

  const posts = profile?.messagesSent ?? 0;
  const streak = profile?.streakCount ?? 0;
  const { current: currentRank, next: nextRank } = getRank(posts);
  const earnedBadges = computeEarnedBadges(profile ?? { uid: user.uid, displayName: "", isAdmin: false }, bookmarkCount);

  const filteredTopics = myTopics.filter((t) => {
    if (topicFilter === "own")    return t.createdBy === user?.uid;
    if (topicFilter === "others") return t.createdBy !== user?.uid;
    return true;
  });

  const handleSaveAffiliation = async () => {
    setAffiliationSaving(true);
    await updateAffiliation(affiliation);
    setAffiliationSaving(false);
  };

  const handleRemoveBookmark = async (bm: BookmarkedMessage) => {
    if (!user) return;
    // Remove from local state immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
    // Remove from Firestore bookmarks subcollection
    const { deleteDoc, doc: firestoreDoc, updateDoc: firestoreUpdateDoc, arrayRemove } = await import("firebase/firestore");
    await deleteDoc(firestoreDoc(db, "users", user.uid, "bookmarks", bm.id));
    await firestoreUpdateDoc(firestoreDoc(db, "users", user.uid), {
      bookmarkIds: arrayRemove(bm.id),
    });
  };

  const handleToggleSolved = async (topic: SavedTopic) => {
    const newSolved = !topic.solved;
    await updateDoc(doc(db, "rooms", topic.roomId, "miniRooms", topic.id), { solved: newSolved });
    setMyTopics((prev) =>
      prev.map((t) => (t.id === topic.id ? { ...t, solved: newSolved } : t))
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "ダッシュボード" },
    { key: "topics", label: "自分のトピック" },
    { key: "bookmarks", label: "ブックマーク" },
    { key: "settings", label: "設定" },
  ];

  // Progress bar for rank
  const progressPercent = nextRank
    ? Math.round(((posts - currentRank.minPosts) / (nextRank.minPosts - currentRank.minPosts)) * 100)
    : 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">マイページ</h1>
        <p className="text-sm text-gray-500">{profile?.displayName ?? "ユーザー"} さん</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm py-2 px-2 rounded-lg font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ダッシュボード */}
      {activeTab === "dashboard" && (
        <div className="space-y-4">
          {/* ストリーク */}
          <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{streak}日連続</p>
              <p className="text-sm text-gray-500">継続は力なり！</p>
            </div>
          </div>

          {/* ランクカード */}
          <div className={`rounded-xl shadow p-5 ${currentRank.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{currentRank.emoji}</span>
              <div>
                <p className={`text-lg font-bold ${currentRank.color}`}>{currentRank.label}</p>
                <p className="text-sm text-gray-500">累計投稿数: {posts}件</p>
              </div>
            </div>
            {nextRank ? (
              <>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{currentRank.label}</span>
                  <span>{nextRank.label}まであと{nextRank.minPosts - posts}件</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">最高ランク達成！おめでとうございます！</p>
            )}
          </div>

          {/* バッジエリア */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">バッジ</h3>
            <div className="grid grid-cols-4 gap-3">
              {ALL_BADGES.map((badge) => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
                      earned
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-gray-100 bg-gray-50 opacity-40 grayscale"
                    }`}
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-xs text-center text-gray-600 leading-tight">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 活動ログ */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">今週の活動</h3>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{weeklyPosts}</p>
                <p className="text-xs text-gray-500">今週の投稿数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{reactedPosts}</p>
                <p className="text-xs text-gray-500">リアクションがついた投稿</p>
              </div>
            </div>
          </div>

          {/* お気に入りルームのクイックアクセス */}
          {favoriteRooms.length > 0 && (
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">お気に入りルーム</h3>
              <div className="space-y-2">
                {favoriteRooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/rooms/${room.id}`}
                    className="flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <span className="text-sm font-medium text-indigo-700">{room.title}</span>
                    <span className="text-indigo-400 text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 自分のトピック */}
      {activeTab === "topics" && (
        <div className="space-y-4">
          {/* フィルター */}
          <div className="flex flex-wrap gap-2">
            {(["all", "own", "others", "viewed"] as TopicFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTopicFilter(f)}
                className={`text-sm px-4 py-1.5 rounded-full border transition ${
                  topicFilter === f
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {f === "all" ? "すべて" : f === "own" ? "自分が作成" : f === "others" ? "他人が作成" : "👁 閲覧済み"}
              </button>
            ))}
          </div>

          {/* 保存済みトピック（すべて・自分が作成・他人が作成） */}
          {topicFilter !== "viewed" && (
            !topicsLoaded ? (
              <p className="text-center text-gray-400 py-8">読み込み中...</p>
            ) : filteredTopics.length === 0 ? (
              <p className="text-center text-gray-400 py-8">トピックがありません</p>
            ) : (
              <div className="space-y-3">
                {filteredTopics.map((topic) => (
                  <div key={topic.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">{topic.roomTitle}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate"># {topic.title}</span>
                          {topic.solved ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">解決済み</span>
                          ) : (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">未解決</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleSolved(topic)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            topic.solved
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-600"
                              : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                          }`}
                        >
                          {topic.solved ? "🔄 未解決に戻す" : "✅ 解決済みにする"}
                        </button>
                        <Link
                          href={`/rooms/${topic.roomId}/${topic.id}`}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition"
                        >
                          チャット →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* 閲覧済みトピック */}
          {topicFilter === "viewed" && (
            !viewedLoaded ? (
              <p className="text-center text-gray-400 py-8">読み込み中...</p>
            ) : viewedTopics.length === 0 ? (
              <p className="text-center text-gray-400 py-8">閲覧したトピックはありません</p>
            ) : (
              <div className="space-y-3">
                {viewedTopics.map((topic) => {
                  const d = new Date(topic.viewedAt);
                  const viewedStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    <div key={topic.id} className="bg-white rounded-xl shadow p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 mb-1">{topic.roomTitle}</p>
                          <span className="font-medium text-gray-800 truncate block"># {topic.title}</span>
                          <p className="text-xs text-gray-400 mt-1">👁 {viewedStr} に閲覧</p>
                        </div>
                        <Link
                          href={`/rooms/${topic.roomId}/${topic.id}`}
                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition flex-shrink-0"
                        >
                          チャット →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* ブックマーク */}
      {activeTab === "bookmarks" && (
        <div className="space-y-3">
          {!bookmarksLoaded ? (
            <p className="text-center text-gray-400 py-8">読み込み中...</p>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-8">
            <p className="text-gray-400 mb-1">ブックマークがありません</p>
            <p className="text-sm text-gray-300">チャット内のメッセージをブックマークしてみましょう</p>
          </div>
          ) : (
            bookmarks.map((bm) => (
              <div key={bm.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {bm.roomTitle} / #{bm.miniRoomTitle}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-gray-700">{bm.displayName}</span>
                    </p>
                    {bm.text && (
                      <div className="text-sm text-gray-800 line-clamp-3">
                        <LatexText text={bm.text} />
                      </div>
                    )}
                    {bm.imageUrl && (
                      <p className="text-xs text-indigo-500 mt-1">画像あり</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBookmark(bm)}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 rounded transition"
                    title="ブックマーク削除"
                  >
                    削除
                  </button>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/rooms/${bm.roomId}/${bm.miniRoomId}`}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    チャットへ →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 設定 */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* 表示名変更 */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">表示名</h3>
            <p className="text-sm text-gray-600 mb-3">現在の表示名: <span className="font-medium">{profile?.displayName}</span></p>
            <button
              onClick={() => setShowDisplayNameModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition"
            >
              表示名を変更
            </button>
          </div>

          {/* 所属・志望校 */}
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">所属・志望校</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="例：東大理系志望、物理学科"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleSaveAffiliation}
                disabled={affiliationSaving}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                {affiliationSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>

          {/* 保存済みカテゴリ */}
          {(profile?.savedCategories?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">保存済みカテゴリ</h3>
              <div className="space-y-2">
                {profile?.savedCategories?.map((cat) => (
                  <div key={cat.query} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{cat.query}</span>
                    </div>
                    <button
                      onClick={() => removeSavedCategory(cat.query)}
                      className="text-gray-400 hover:text-red-500 transition text-sm"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showDisplayNameModal && (
        <DisplayNameModal onClose={() => setShowDisplayNameModal(false)} />
      )}
    </div>
  );
}
