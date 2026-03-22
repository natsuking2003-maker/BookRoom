"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { PREDEFINED_TAGS, Room } from "@/lib/types";
import { CATEGORY_TREE, CategoryNode } from "@/lib/categories";

// ページあたりの表示件数
const ITEMS_PER_PAGE = 12;

interface BookCandidate {
  title: string;
  author: string;
  publisher: string;
  thumbnail: string;
  description: string;
  roomMessageCount: number; // アプリ内既存ルームのメッセージ数（-1=なし）
}

type SearchMode = "text" | "category";
type SortMode  = "relevance" | "popular";

// タイトルの正規化（比較用）
const normalizeTitle = (t: string) =>
  t.toLowerCase().replace(/[\s　・「」『』【】\-―]/g, "");

export default function NewRoomPage() {
  const router = useRouter();
  const { user } = useAuth();

  /* ---- 検索モード ---- */
  const [searchMode, setSearchMode] = useState<SearchMode>("text");
  const [sortMode,   setSortMode]   = useState<SortMode>("relevance");

  /* ---- テキスト検索 ---- */
  const [query, setQuery] = useState("");

  /* ---- カテゴリ検索 ---- */
  const [categoryPath,    setCategoryPath]    = useState<CategoryNode[]>([]);
  const [refinementText,  setRefinementText]  = useState(""); // カテゴリ内絞り込み
  const [personTab,       setPersonTab]       = useState<"author" | "publisher">("author"); // 著者/出版社タブ

  /* ---- ページネーション ---- */
  const [page,               setPage]               = useState(0);
  const [totalItems,         setTotalItems]         = useState(0);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  /* ---- 結果・選択 ---- */
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [selected,   setSelected]   = useState<BookCandidate | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [error,     setError]     = useState("");

  /* ---- Firestoreの既存ルーム（人気度照合用） ---- */
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rooms"), (snap) => {
      setAllRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Room[]);
    });
    return unsub;
  }, []);

  // ========== 人気度照合 ==========
  // Google Books の書籍と既存ルームをタイトルで照合し roomMessageCount を付与
  const enrichWithRoomData = (books: Omit<BookCandidate, "roomMessageCount">[]): BookCandidate[] =>
    books.map((book) => {
      const bookNorm = normalizeTitle(book.title);
      const match = allRooms.find((r) => {
        const roomNorm = normalizeTitle(r.title);
        // 一方が他方を含む、かつ6文字以上の一致
        return (
          (bookNorm.includes(roomNorm) || roomNorm.includes(bookNorm)) &&
          Math.min(bookNorm.length, roomNorm.length) >= 6
        );
      });
      return { ...book, roomMessageCount: match ? (match.messageCount ?? 0) : -1 };
    });

  // ========== ソート適用 ==========
  const applySortMode = (books: BookCandidate[], mode: SortMode): BookCandidate[] => {
    if (mode === "popular") {
      return [...books].sort((a, b) => b.roomMessageCount - a.roomMessageCount);
    }
    return books; // relevance = API順のまま
  };

  // ========== Google Books 検索（共通） ==========
  const searchByQuery = async (searchQuery: string, pageNum = 0) => {
    setSearching(true);
    setError("");
    setCurrentSearchQuery(searchQuery);
    const apiKey  = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : "";
    const startIndex = pageNum * ITEMS_PER_PAGE;

    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes` +
        `?q=${encodeURIComponent(searchQuery)}` +
        `&maxResults=${ITEMS_PER_PAGE}` +
        `&startIndex=${startIndex}` +
        `&orderBy=relevance` +
        keyParam
      );
      const data = await res.json();

      // Google Books は totalItems が大きすぎる場合があるので 480 件でキャップ
      setTotalItems(Math.min(data.totalItems ?? 0, 480));
      setPage(pageNum);

      const raw = (data.items ?? []).map((item: any) => ({
        title:       item.volumeInfo.title ?? "不明",
        author:      (item.volumeInfo.authors ?? []).join(", ") || "不明",
        publisher:   item.volumeInfo.publisher ?? "",
        thumbnail:   item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ?? "",
        description: item.volumeInfo.description?.slice(0, 120) ?? "",
      }));

      const enriched = enrichWithRoomData(raw);
      setCandidates(applySortMode(enriched, sortMode));

      if (raw.length === 0) setError("該当する書籍が見つかりませんでした。別のキーワードで試してください。");
    } catch {
      setError("検索中にエラーが発生しました。ネットワーク接続を確認してください。");
    } finally {
      setSearching(false);
    }
  };

  // ソートモードが変わったときは結果を並び替えるだけ（再検索しない）
  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    setCandidates((prev) => applySortMode([...prev], mode));
  };

  // ページ移動
  const goToPage = (pageNum: number) => {
    searchByQuery(currentSearchQuery, pageNum);
    setCandidates([]); // 先にクリアして古い結果を見せない
  };

  // ========== テキスト検索 ==========
  const handleTextSearch = () => {
    if (!query.trim()) return;
    setCandidates([]);
    searchByQuery(query.trim(), 0);
  };

  // ========== カテゴリ検索 ==========
  const lastCategoryNode = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : null;
  const isPersonLevel = !!(lastCategoryNode && !lastCategoryNode.children && (lastCategoryNode.authors || lastCategoryNode.publishers));
  const isAuthorLevel = isPersonLevel; // 後方互換エイリアス
  const currentLevel: CategoryNode[] =
    isPersonLevel
      ? []
      : categoryPath.length === 0
        ? CATEGORY_TREE
        : lastCategoryNode?.children ?? [];

  const handleCategoryClick = async (node: CategoryNode) => {
    if (node.children) {
      setCategoryPath((prev) => [...prev, node]);
      setCandidates([]);
      setRefinementText("");
    } else if (node.authors || node.publishers) {
      // 著者/出版社リストがある → 人物選択レベルへ（即検索しない）
      setCategoryPath((prev) => [...prev, node]);
      setCandidates([]);
      setRefinementText("");
      // 両方ある場合は著者タブ、出版社のみの場合は出版社タブをデフォルトに
      setPersonTab(node.authors ? "author" : "publisher");
    } else if (node.searchQuery) {
      const newPath = [...categoryPath, node];
      setCategoryPath(newPath);
      setCandidates([]);
      // カテゴリのベースクエリ ＋ 絞り込みテキストを合成して検索
      const combined = refinementText.trim()
        ? `${node.searchQuery} ${refinementText.trim()}`
        : node.searchQuery;
      await searchByQuery(combined, 0);
    }
  };

  // 著者を選択して検索（著者名だけで検索 — 親クエリと組み合わせると件数が激減するため）
  const handleAuthorClick = async (author: string) => {
    const authorQuery = `inauthor:"${author}"`;
    const authorNode: CategoryNode = {
      label: author,
      searchQuery: authorQuery,
    };
    setCategoryPath((prev) => [...prev, authorNode]);
    setCandidates([]);
    await searchByQuery(authorQuery, 0);
  };

  // 出版社を選択して検索（出版社は多分野出版しているため親カテゴリの searchQuery と組み合わせる）
  const handlePublisherClick = async (publisher: string) => {
    const baseQuery = lastCategoryNode?.searchQuery ?? "";
    const publisherQuery = `inpublisher:"${publisher}"`;
    const combined = baseQuery ? `${baseQuery} ${publisherQuery}` : publisherQuery;
    const publisherNode: CategoryNode = {
      label: publisher,
      searchQuery: publisherQuery,
    };
    setCategoryPath((prev) => [...prev, publisherNode]);
    setCandidates([]);
    await searchByQuery(combined, 0);
  };

  // カテゴリ内の絞り込みテキストで再検索（カテゴリ未選択時は単独テキスト検索）
  const handleCategoryRefine = () => {
    if (!refinementText.trim()) return;
    // パス中で最も深い searchQuery を基底クエリとして使用
    let baseQuery = "";
    for (let i = categoryPath.length - 1; i >= 0; i--) {
      if (categoryPath[i].searchQuery) {
        baseQuery = categoryPath[i].searchQuery;
        break;
      }
    }
    const combined = baseQuery
      ? `${baseQuery} ${refinementText.trim()}`
      : refinementText.trim();
    setCandidates([]);
    searchByQuery(combined, 0);
  };

  const handleBreadcrumb = (index: number) => {
    const newPath = categoryPath.slice(0, index + 1);
    const newLast = newPath[newPath.length - 1];
    setCategoryPath(newPath);
    setCandidates([]);
    setError("");
    setRefinementText("");
    if (newLast?.authors || newLast?.publishers) {
      setPersonTab(newLast.authors ? "author" : "publisher");
    }
  };

  // ========== タグ ==========
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ========== ルーム作成 ==========
  const createRoom = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        title:       selected.title,
        author:      selected.author,
        publisher:   selected.publisher,
        thumbnail:   selected.thumbnail,
        description: selected.description,
        createdBy:   user?.uid ?? "anonymous",
        createdAt:   Date.now(),
        messageCount: 0,
        tags:        selectedTags,
      });
      router.push(`/rooms/${docRef.id}`);
    } catch {
      setError("ルームの作成に失敗しました。");
      setCreating(false);
    }
  };

  // モード切替（リセット込み）
  const switchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setCandidates([]);
    setError("");
    setQuery("");
    setCategoryPath([]);
    setRefinementText("");
    setPersonTab("author");
    setPage(0);
    setTotalItems(0);
    setCurrentSearchQuery("");
  };

  // ページネーション計算
  const totalPages  = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const hasPrev     = page > 0;
  const hasNext     = page < totalPages - 1;
  const showResults = candidates.length > 0 && !selected;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">新しいルームを作成</h1>

      {/* ===== 書籍検索カード ===== */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">

        {/* モード切替タブ */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5 text-sm">
          <button
            onClick={() => switchMode("text")}
            className={`flex-1 py-2 font-medium transition ${searchMode === "text" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            🔍 テキストで検索
          </button>
          <button
            onClick={() => switchMode("category")}
            className={`flex-1 py-2 font-medium transition ${searchMode === "category" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            📂 カテゴリから探す
          </button>
        </div>

        {/* ===== テキスト検索 ===== */}
        {searchMode === "text" && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              書籍タイトルや著者名を入力
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
                placeholder="例：ハリーポッター、嫌われる勇気、松尾豊..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handleTextSearch}
                disabled={searching}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition"
              >
                {searching ? "検索中..." : "検索"}
              </button>
            </div>
          </>
        )}

        {/* ===== カテゴリ検索 ===== */}
        {searchMode === "category" && (
          <>
            {/* パンくずナビ */}
            <div className="flex items-center flex-wrap gap-1 text-sm mb-4 min-h-[24px]">
              <button onClick={() => { setCategoryPath([]); setCandidates([]); setError(""); setRefinementText(""); }} className="text-indigo-500 hover:text-indigo-700 font-medium">
                トップ
              </button>
              {categoryPath.map((node, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-gray-400">›</span>
                  {i < categoryPath.length - 1 || node.children || node.authors || node.publishers ? (
                    <button onClick={() => handleBreadcrumb(i)} className="text-indigo-500 hover:text-indigo-700 font-medium">
                      {node.label}
                    </button>
                  ) : (
                    <span className="text-gray-700 font-semibold">{node.label}</span>
                  )}
                </span>
              ))}
            </div>

            {/* テキスト絞り込み（著者レベル以外で常に表示） */}
            {!isAuthorLevel && (
              <div className="relative mb-4">
                <input
                  type="text"
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCategoryRefine()}
                  placeholder={
                    categoryPath.length === 0
                      ? "タイトル・著者名で書籍を検索..."
                      : `「${categoryPath[categoryPath.length - 1].label}」内をキーワードで絞り込む...`
                  }
                  className="w-full pl-8 pr-16 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                {refinementText && (
                  <button
                    onClick={() => setRefinementText("")}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={handleCategoryRefine}
                  disabled={searching || !refinementText.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-md disabled:opacity-40 transition"
                >
                  {searching ? "..." : "検索"}
                </button>
              </div>
            )}

            {/* カテゴリボタン or 著者一覧 */}
            {candidates.length === 0 && !searching && (
              <>
                {/* カテゴリボタン（著者レベル到達前） */}
                {currentLevel.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {currentLevel.map((node) => (
                      <button
                        key={node.label}
                        onClick={() => handleCategoryClick(node)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 text-sm font-medium transition text-left"
                      >
                        <span>{node.label}</span>
                        <span className="text-gray-400 text-xs ml-1">
                          {node.children ? "›" : (node.authors && node.publishers) ? "👤" : node.authors ? "👤" : node.publishers ? "🏢" : "🔍"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 著者/出版社一覧（人物選択レベル到達後） */}
                {isPersonLevel && lastCategoryNode && (
                  <div className="mb-4">
                    {/* タブ（両方ある場合のみ） */}
                    {lastCategoryNode.authors && lastCategoryNode.publishers && (
                      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-3 text-xs">
                        <button
                          onClick={() => setPersonTab("author")}
                          className={`flex-1 py-1.5 font-medium transition ${personTab === "author" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          👤 著者で絞り込む
                        </button>
                        <button
                          onClick={() => setPersonTab("publisher")}
                          className={`flex-1 py-1.5 font-medium transition ${personTab === "publisher" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          🏢 出版社で絞り込む
                        </button>
                      </div>
                    )}

                    {/* 著者一覧 */}
                    {lastCategoryNode.authors && (!lastCategoryNode.publishers || personTab === "author") && (
                      <>
                        {!lastCategoryNode.publishers && (
                          <p className="text-xs text-gray-400 mb-2">著者を選んで絞り込む</p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {lastCategoryNode.authors.map((author) => (
                            <button
                              key={author}
                              onClick={() => handleAuthorClick(author)}
                              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 text-sm font-medium transition text-left"
                            >
                              <span>{author}</span>
                              <span className="text-gray-400 text-xs ml-1">🔍</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* 出版社一覧 */}
                    {lastCategoryNode.publishers && (!lastCategoryNode.authors || personTab === "publisher") && (
                      <>
                        {!lastCategoryNode.authors && (
                          <p className="text-xs text-gray-400 mb-2">出版社を選んで絞り込む</p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {lastCategoryNode.publishers.map((publisher) => (
                            <button
                              key={publisher}
                              onClick={() => handlePublisherClick(publisher)}
                              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-700 text-sm font-medium transition text-left"
                            >
                              <span>{publisher}</span>
                              <span className="text-gray-400 text-xs ml-1">🔍</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {lastCategoryNode.searchQuery && (
                      <button
                        onClick={() => {
                          setCandidates([]);
                          searchByQuery(lastCategoryNode.searchQuery!, 0);
                        }}
                        className="mt-3 text-sm text-indigo-500 hover:text-indigo-700 underline"
                      >
                        📚 指定せずにすべて表示
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {searching && (
              <p className="text-center text-gray-400 py-6 text-sm">書籍を検索中...</p>
            )}
          </>
        )}

        {/* エラー */}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        {/* ===== 検索結果 ===== */}
        {showResults && (
          <>
            {/* 件数 ＋ ソート選択 */}
            <div className="flex items-center justify-between mt-4 mb-2">
              <p className="text-xs text-gray-400">
                {totalItems.toLocaleString()} 件中{" "}
                {page * ITEMS_PER_PAGE + 1}〜
                {Math.min((page + 1) * ITEMS_PER_PAGE, totalItems)} 件を表示
              </p>
              <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
                <button
                  onClick={() => handleSortChange("relevance")}
                  className={`px-3 py-1.5 transition ${sortMode === "relevance" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  関連度順
                </button>
                <button
                  onClick={() => handleSortChange("popular")}
                  className={`px-3 py-1.5 transition ${sortMode === "popular" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  🔥 人気順
                </button>
              </div>
            </div>

            {/* 書籍リスト */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {candidates.map((book, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(book)}
                  className="w-full text-left flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition relative"
                >
                  {/* 人気バッジ */}
                  {book.roomMessageCount >= 0 && (
                    <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      🔥 ルームあり
                    </span>
                  )}
                  {book.thumbnail ? (
                    <div className="flex-shrink-0 w-12 h-16 relative">
                      <Image src={book.thumbnail} alt={book.title} fill className="object-cover rounded" sizes="48px" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-16 bg-indigo-100 rounded flex items-center justify-center text-indigo-300 text-2xl">📚</div>
                  )}
                  <div className="min-w-0 pr-16">
                    <p className="text-sm font-semibold text-gray-800 truncate">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                    {book.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{book.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={!hasPrev || searching}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← 前の12件
                </button>
                <span className="text-sm text-gray-500">
                  {page + 1} / {totalPages} ページ
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!hasNext || searching}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  次の12件 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== 選択中の書籍 ===== */}
      {selected && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">選択した書籍</h2>
            <button onClick={() => { setSelected(null); }} className="text-xs text-gray-400 hover:text-gray-600">
              選び直す
            </button>
          </div>
          <div className="flex gap-4">
            {selected.thumbnail ? (
              <div className="flex-shrink-0 w-16 h-20 relative">
                <Image src={selected.thumbnail} alt={selected.title} fill className="object-cover rounded" sizes="64px" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-20 bg-indigo-100 rounded flex items-center justify-center text-indigo-300 text-3xl">📚</div>
            )}
            <div>
              <p className="font-semibold text-gray-800">{selected.title}</p>
              <p className="text-sm text-gray-500">{selected.author}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== タグ選択 ===== */}
      <div className={`bg-white rounded-xl shadow p-6 mb-6 ${selected && selectedTags.length === 0 ? "ring-2 ring-red-300" : ""}`}>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          カテゴリタグ
          <span className="ml-2 text-xs font-normal text-red-500">（必須・1つ以上選択）</span>
        </label>
        <p className="text-xs text-gray-400 mb-3">ルームが属するカテゴリを選んでください。複数選択できます。</p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                selectedTags.includes(tag)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {selected && selectedTags.length === 0 && (
          <p className="text-xs text-red-500 mt-3">⚠️ カテゴリを1つ以上選択してください</p>
        )}
      </div>

      {/* ===== 作成ボタン ===== */}
      <button
        onClick={createRoom}
        disabled={!selected || creating || selectedTags.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40 transition"
      >
        {creating ? "作成中..." : "ルームを作成する"}
      </button>
    </div>
  );
}
