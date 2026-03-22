"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room, PREDEFINED_TAGS } from "@/lib/types";
import { CATEGORY_TREE, CategoryNode } from "@/lib/categories";
import RoomCard from "@/components/RoomCard";
import { useAuth } from "@/contexts/AuthContext";

type SortKey    = "newest" | "popular";
type SearchMode = "text" | "category";

// カテゴリツリーのトップラベル → PREDEFINED_TAGS のマッピング
const CATEGORY_TAG_MAP: Record<string, string> = {
  "小説・文学":         "小説・文学",
  "ビジネス・経済":     "ビジネス・経済",
  "自己啓発・生き方":   "自己啓発",
  "科学・テクノロジー": "科学・技術",
  "プログラミング・IT": "プログラミング",
  "歴史・社会":         "歴史・社会",
  "哲学・思想・宗教":   "哲学・思想",
  "趣味・実用":         "趣味・実用",
  "マンガ・グラフィック": "マンガ",
  "学習・参考書":       "学習・参考書",
};

export default function HomePage() {
  const { user, profile } = useAuth();
  const [rooms,   setRooms]   = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState<SortKey>("newest");

  // テキスト検索モード
  const [search,       setSearch]       = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // カテゴリ検索モード
  const [searchMode,     setSearchMode]     = useState<SearchMode>("text");
  const [categoryPath,   setCategoryPath]   = useState<CategoryNode[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [personTab,      setPersonTab]      = useState<"author" | "publisher">("author");

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Room[]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ---- テキストモード ---- */
  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setCategoryPath([]);
    setCategorySearch("");
    setSearch("");
    setSelectedTags([]);
    setPersonTab("author");
  };

  /* ---- カテゴリモード（計算値） ---- */
  const lastCategoryNode = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : null;

  // 著者/出版社リストが並ぶレベル（children なし・authors か publishers あり）
  const isPersonLevel = !!(lastCategoryNode && !lastCategoryNode.children && (lastCategoryNode.authors || lastCategoryNode.publishers));
  const isAuthorLevel = isPersonLevel; // 後方互換エイリアス

  // 現在表示するカテゴリ一覧
  const currentCategoryLevel: CategoryNode[] =
    isPersonLevel
      ? []
      : categoryPath.length === 0
        ? CATEGORY_TREE
        : lastCategoryNode?.children ?? [];

  // 選択中の著者（inauthor: クエリを持つ末端ノード）
  const selectedAuthorName: string | null = (() => {
    if (categoryPath.length === 0) return null;
    const last = categoryPath[categoryPath.length - 1];
    if (!last.children && !last.authors && !last.publishers && last.searchQuery?.startsWith("inauthor:")) {
      return last.label;
    }
    return null;
  })();

  // 選択中の出版社（inpublisher: クエリを持つ末端ノード）
  const selectedPublisherName: string | null = (() => {
    if (categoryPath.length === 0) return null;
    const last = categoryPath[categoryPath.length - 1];
    if (!last.children && !last.authors && !last.publishers && last.searchQuery?.startsWith("inpublisher:")) {
      return last.label;
    }
    return null;
  })();

  // 著者/出版社リストを表示するノード（人物選択レベル or 選択済みの場合は親ノード）
  const leafNode: CategoryNode | null = isPersonLevel
    ? lastCategoryNode
    : ((selectedAuthorName || selectedPublisherName) && categoryPath.length >= 2 &&
       (categoryPath[categoryPath.length - 2]?.authors || categoryPath[categoryPath.length - 2]?.publishers))
      ? categoryPath[categoryPath.length - 2]
      : null;
  // 後方互換エイリアス
  const authorListNode = leafNode;

  // トップレベルカテゴリ → タグ変換
  const categoryTag: string | null =
    categoryPath.length > 0 ? (CATEGORY_TAG_MAP[categoryPath[0].label] ?? null) : null;

  const handleCategoryClick = (node: CategoryNode) => {
    setCategoryPath((prev) => [...prev, node]);
    if (!node.children && (node.authors || node.publishers)) {
      setPersonTab(node.authors ? "author" : "publisher");
    }
  };

  const handleAuthorClick = (author: string) => {
    const authorNode: CategoryNode = { label: author, searchQuery: `inauthor:"${author}"` };
    // 著者または出版社が選択済みの場合は最後のノードを差し替え
    setCategoryPath((prev) =>
      (selectedAuthorName || selectedPublisherName) ? [...prev.slice(0, -1), authorNode] : [...prev, authorNode]
    );
  };

  const handlePublisherClick = (publisher: string) => {
    const publisherNode: CategoryNode = { label: publisher, searchQuery: `inpublisher:"${publisher}"` };
    // 著者または出版社が選択済みの場合は最後のノードを差し替え
    setCategoryPath((prev) =>
      (selectedAuthorName || selectedPublisherName) ? [...prev.slice(0, -1), publisherNode] : [...prev, publisherNode]
    );
  };

  const handleBreadcrumb = (index: number) => {
    const newPath = categoryPath.slice(0, index + 1);
    const newLast = newPath[newPath.length - 1];
    setCategoryPath(newPath);
    if (newLast?.authors || newLast?.publishers) {
      setPersonTab(newLast.authors ? "author" : "publisher");
    }
  };

  /* ---- フィルタリング ---- */
  const filtered = rooms
    .filter((r) => {
      if (searchMode === "text") {
        const matchSearch =
          !search ||
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.author.toLowerCase().includes(search.toLowerCase());
        const matchTag =
          selectedTags.length === 0 || selectedTags.some((t) => r.tags?.includes(t));
        return matchSearch && matchTag;
      } else {
        // カテゴリモード：タグ一致 + 著者一致 + 出版社一致 + テキスト一致
        const matchTag    = !categoryTag || (r.tags?.includes(categoryTag) ?? false);
        const matchAuthor =
          !selectedAuthorName ||
          r.author.toLowerCase().includes(selectedAuthorName.toLowerCase());
        const matchPublisher =
          !selectedPublisherName ||
          (r.publisher ?? "").toLowerCase().includes(selectedPublisherName.toLowerCase());
        const matchText   =
          !categorySearch ||
          r.title.toLowerCase().includes(categorySearch.toLowerCase()) ||
          r.author.toLowerCase().includes(categorySearch.toLowerCase());
        return matchTag && matchAuthor && matchPublisher && matchText;
      }
    })
    .sort((a, b) =>
      sort === "popular"
        ? (b.messageCount ?? 0) - (a.messageCount ?? 0)
        : b.createdAt - a.createdAt
    );

  const favoriteRooms = rooms.filter((r) => profile?.favorites?.includes(r.id));

  const noRoomsMsg =
    searchMode === "text" && (search || selectedTags.length > 0)
      ? "条件に一致するルームが見つかりませんでした"
      : searchMode === "category" && categoryPath.length > 0
        ? selectedAuthorName
          ? `「${selectedAuthorName}」の書籍ルームはまだありません`
          : selectedPublisherName
            ? `「${selectedPublisherName}」の書籍ルームはまだありません`
            : "このカテゴリのルームはまだありません"
        : "まだルームがありません。最初のルームを作りましょう！";

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">書籍ルーム一覧</h1>
        <Link
          href="/rooms/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + ルームを作成
        </Link>
      </div>

      {/* お気に入りセクション */}
      {user && favoriteRooms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-700 mb-3">⭐ お気に入り</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      {/* 検索モードタブ + ソート */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
          <button
            onClick={() => switchMode("text")}
            className={`px-4 py-2 font-medium transition ${searchMode === "text" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            🔍 テキスト検索
          </button>
          <button
            onClick={() => switchMode("category")}
            className={`px-4 py-2 font-medium transition ${searchMode === "category" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            📂 カテゴリから探す
          </button>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white text-sm ml-auto flex-shrink-0">
          <button
            onClick={() => setSort("newest")}
            className={`px-3 py-2 transition ${sort === "newest" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            新着順
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`px-3 py-2 transition ${sort === "popular" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            人気順
          </button>
        </div>
      </div>

      {/* ===== テキスト検索モード ===== */}
      {searchMode === "text" && (
        <>
          <input
            type="text"
            placeholder="タイトルまたは著者で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-3"
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition"
              >
                ✕ クリア
              </button>
            )}
          </div>
        </>
      )}

      {/* ===== カテゴリ検索モード ===== */}
      {searchMode === "category" && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          {/* パンくずナビ */}
          <div className="flex items-center flex-wrap gap-1 text-sm mb-3 min-h-[24px]">
            <button
              onClick={() => setCategoryPath([])}
              className="text-indigo-500 hover:text-indigo-700 font-medium"
            >
              トップ
            </button>
            {categoryPath.map((node, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-gray-400">›</span>
                {i < categoryPath.length - 1 || node.children || node.authors || node.publishers ? (
                  <button
                    onClick={() => handleBreadcrumb(i)}
                    className="text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    {node.label}
                  </button>
                ) : (
                  <span className="text-gray-700 font-semibold">{node.label}</span>
                )}
              </span>
            ))}
          </div>

          {/* テキスト絞り込み（常に表示） */}
          <div className="relative mb-3">
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder={
                categoryPath.length === 0
                  ? "すべてのルームをタイトル・著者で絞り込む..."
                  : `「${categoryPath[categoryPath.length - 1].label}」内をタイトル・著者で絞り込む...`
              }
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            {categorySearch && (
              <button
                onClick={() => setCategorySearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 絞り込み件数 */}
          {(categoryPath.length > 0 || categorySearch) && (
            <p className="text-xs text-gray-400 mb-3">
              {filtered.length > 0
                ? <>{filtered.length} 件のルームが見つかりました</>
                : <>該当するルームがありません</>
              }
              {selectedAuthorName && (
                <span className="ml-1 text-indigo-500">— 著者: {selectedAuthorName}</span>
              )}
              {selectedPublisherName && (
                <span className="ml-1 text-indigo-500">— 出版社: {selectedPublisherName}</span>
              )}
              {categorySearch && (
                <span className="ml-1 text-indigo-500">— キーワード: {categorySearch}</span>
              )}
            </p>
          )}

          {/* カテゴリボタン */}
          {currentCategoryLevel.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {currentCategoryLevel.map((node) => (
                <button
                  key={node.label}
                  onClick={() => handleCategoryClick(node)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 text-sm font-medium transition text-left"
                >
                  <span>{node.label}</span>
                  <span className="text-gray-400 text-xs ml-1">
                    {node.children ? "›" : (node.authors && node.publishers) ? "👤" : node.authors ? "👤" : node.publishers ? "🏢" : "›"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 著者/出版社一覧（人物選択レベル or 選択済み時も表示） */}
          {leafNode && (leafNode.authors || leafNode.publishers) && (
            <div>
              {/* タブ（両方ある場合のみ） */}
              {leafNode.authors && leafNode.publishers && (
                <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-3 text-xs">
                  <button
                    onClick={() => setPersonTab("author")}
                    className={`flex-1 py-1.5 font-medium transition ${personTab === "author" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    👤 著者
                  </button>
                  <button
                    onClick={() => setPersonTab("publisher")}
                    className={`flex-1 py-1.5 font-medium transition ${personTab === "publisher" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    🏢 出版社
                  </button>
                </div>
              )}

              {/* 著者一覧 */}
              {leafNode.authors && (!leafNode.publishers || personTab === "author") && (
                <>
                  {!leafNode.publishers && (
                    <p className="text-xs text-gray-400 mb-2">
                      {isPersonLevel ? "著者を選んで絞り込む" : "著者を切り替える"}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {leafNode.authors.map((author) => (
                      <button
                        key={author}
                        onClick={() => handleAuthorClick(author)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm font-medium text-left ${
                          selectedAuthorName === author
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700"
                        }`}
                      >
                        <span>{author}</span>
                        {selectedAuthorName !== author && (
                          <span className="text-gray-400 text-xs ml-1">🔍</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 出版社一覧 */}
              {leafNode.publishers && (!leafNode.authors || personTab === "publisher") && (
                <>
                  {!leafNode.authors && (
                    <p className="text-xs text-gray-400 mb-2">
                      {isPersonLevel ? "出版社を選んで絞り込む" : "出版社を切り替える"}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {leafNode.publishers.map((publisher) => (
                      <button
                        key={publisher}
                        onClick={() => handlePublisherClick(publisher)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm font-medium text-left ${
                          selectedPublisherName === publisher
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700"
                        }`}
                      >
                        <span>{publisher}</span>
                        {selectedPublisherName !== publisher && (
                          <span className="text-gray-400 text-xs ml-1">🔍</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(selectedAuthorName || selectedPublisherName) && (
                <button
                  onClick={() => setCategoryPath((prev) => prev.slice(0, -1))}
                  className="mt-3 text-sm text-gray-400 hover:text-indigo-500 underline"
                >
                  {selectedAuthorName ? "著者フィルターを解除" : "出版社フィルターを解除"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ルーム一覧 ===== */}
      {loading ? (
        <p className="text-center text-gray-400 py-16">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">{noRoomsMsg}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
