export const PREDEFINED_TAGS = [
  "小説・文学", "ビジネス・経済", "自己啓発", "科学・技術",
  "プログラミング", "歴史・社会", "哲学・思想", "趣味・実用",
  "マンガ", "学習・参考書", "その他",
];

export const REACTION_EMOJIS = [
  { emoji: "👍", label: "わかった" },
  { emoji: "💡", label: "参考になった" },
  { emoji: "❓", label: "わからない" },
  { emoji: "🎉", label: "ありがとう" },
  { emoji: "❤️", label: "好き" },
];

export interface Room {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  thumbnail: string;
  description: string;
  createdBy: string;
  createdAt: number;
  messageCount?: number;
  tags?: string[];
}

export interface MiniRoom {
  id: string;
  title: string;
  createdBy: string;
  createdAt: number;
  messageCount?: number;
  solved?: boolean;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  displayName: string;
  createdAt: number;
  reactions?: { [emoji: string]: string[] };
  imageUrl?: string;       // 添付画像
  roomId?: string;         // プロフィール用
  miniRoomId?: string;
  roomTitle?: string;
  miniRoomTitle?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  isAdmin: boolean;
  favorites?: string[];
  affiliation?: string;
  streakCount?: number;
  lastActiveDate?: string;
  messagesSent?: number;
  bookmarkIds?: string[];
  savedTopicIds?: string[];
  savedCategories?: { label: string; query: string }[];
  badges?: string[];
}

export interface ViewedTopic {
  id: string;          // miniRoomId
  roomId: string;
  roomTitle: string;
  title: string;
  createdBy: string;
  createdAt: number;
  viewedAt: number;    // 最終閲覧日時
}

export interface SavedTopic {
  id: string;          // miniRoomId
  roomId: string;
  roomTitle: string;
  title: string;
  createdBy: string;
  createdAt: number;
  savedAt: number;
  solved?: boolean;
}

export interface BookmarkedMessage {
  id: string;
  text: string;
  imageUrl?: string;
  displayName: string;
  createdAt: number;
  roomId: string;
  miniRoomId: string;
  roomTitle: string;
  miniRoomTitle: string;
  savedAt: number;
}

export const RANK_LEVELS = [
  { label: "ビギナー", emoji: "🌱", color: "text-gray-500", bg: "bg-gray-100", minPosts: 0 },
  { label: "アクティブ", emoji: "💬", color: "text-blue-600", bg: "bg-blue-50", minPosts: 10 },
  { label: "コントリビューター", emoji: "⭐", color: "text-yellow-600", bg: "bg-yellow-50", minPosts: 30 },
  { label: "メンター", emoji: "🎓", color: "text-purple-600", bg: "bg-purple-50", minPosts: 100 },
  { label: "マスター", emoji: "🏆", color: "text-red-500", bg: "bg-red-50", minPosts: 300 },
];

export function getRank(messagesSent: number): {
  current: typeof RANK_LEVELS[number];
  next: typeof RANK_LEVELS[number] | null;
} {
  let current = RANK_LEVELS[0];
  for (const rank of RANK_LEVELS) {
    if (messagesSent >= rank.minPosts) {
      current = rank;
    }
  }
  const currentIndex = RANK_LEVELS.indexOf(current);
  const next = currentIndex < RANK_LEVELS.length - 1 ? RANK_LEVELS[currentIndex + 1] : null;
  return { current, next };
}

export const ALL_BADGES = [
  { id: "first_post", emoji: "🌱", label: "はじめの一歩", description: "初めての投稿" },
  { id: "posts_10", emoji: "💬", label: "アクティブ", description: "10件の投稿" },
  { id: "posts_30", emoji: "⭐", label: "探究者", description: "30件の投稿" },
  { id: "posts_100", emoji: "🏆", label: "マスター達成", description: "100件の投稿" },
  { id: "fav_3", emoji: "📚", label: "コレクター", description: "3冊お気に入り登録" },
  { id: "streak_3", emoji: "🔥", label: "3日継続", description: "3日間連続利用" },
  { id: "streak_7", emoji: "🌊", label: "7日継続", description: "7日間連続利用" },
  { id: "bookmark_1", emoji: "🔖", label: "ストック開始", description: "初めてのブックマーク" },
];

export function computeEarnedBadges(profile: UserProfile, bookmarkCount: number): string[] {
  const earned: string[] = [];
  const posts = profile.messagesSent ?? 0;
  const streak = profile.streakCount ?? 0;
  const favCount = profile.favorites?.length ?? 0;

  if (posts >= 1) earned.push("first_post");
  if (posts >= 10) earned.push("posts_10");
  if (posts >= 30) earned.push("posts_30");
  if (posts >= 100) earned.push("posts_100");
  if (favCount >= 3) earned.push("fav_3");
  if (streak >= 3) earned.push("streak_3");
  if (streak >= 7) earned.push("streak_7");
  if (bookmarkCount >= 1) earned.push("bookmark_1");

  return earned;
}
