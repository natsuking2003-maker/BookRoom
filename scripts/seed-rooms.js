const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// .env.local から Google Books API キーを読み込む
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});
const GOOGLE_BOOKS_API_KEY = env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

// Firebase Admin 初期化
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ==================== 書籍リスト ====================
const BOOKS = [
  // 小説・文学
  { title: "ノルウェイの森", author: "村上春樹", tags: ["小説・文学"] },
  { title: "容疑者Xの献身", author: "東野圭吾", tags: ["小説・文学"] },
  { title: "人間失格", author: "太宰治", tags: ["小説・文学"] },
  { title: "こころ", author: "夏目漱石", tags: ["小説・文学"] },
  { title: "火花", author: "又吉直樹", tags: ["小説・文学"] },
  { title: "流浪の月", author: "凪良ゆう", tags: ["小説・文学"] },
  { title: "蜜蜂と遠雷", author: "恩田陸", tags: ["小説・文学"] },
  { title: "罪と罰", author: "ドストエフスキー", tags: ["小説・文学"] },

  // ビジネス・経済
  { title: "マネジメント", author: "ピーター・ドラッカー", tags: ["ビジネス・経済"] },
  { title: "影響力の武器", author: "ロバート・B・チャルディーニ", tags: ["ビジネス・経済"] },
  { title: "ゼロ・トゥ・ワン", author: "ピーター・ティール", tags: ["ビジネス・経済"] },
  { title: "ビジョナリー・カンパニー", author: "ジム・コリンズ", tags: ["ビジネス・経済"] },
  { title: "the four GAFA 四騎士が創り変えた世界", author: "スコット・ギャロウェイ", tags: ["ビジネス・経済"] },
  { title: "ハーバード流交渉術", author: "ロジャー・フィッシャー", tags: ["ビジネス・経済"] },

  // 自己啓発
  { title: "7つの習慣", author: "スティーブン・R・コヴィー", tags: ["自己啓発"] },
  { title: "嫌われる勇気", author: "岸見一郎", tags: ["自己啓発"] },
  { title: "人を動かす", author: "デール・カーネギー", tags: ["自己啓発"] },
  { title: "アトミック・ハビット", author: "ジェームズ・クリアー", tags: ["自己啓発"] },
  { title: "思考は現実化する", author: "ナポレオン・ヒル", tags: ["自己啓発"] },
  { title: "多動力", author: "堀江貴文", tags: ["自己啓発"] },

  // 科学・技術
  { title: "サピエンス全史", author: "ユヴァル・ノア・ハラリ", tags: ["科学・技術"] },
  { title: "ホーキング宇宙を語る", author: "スティーブン・ホーキング", tags: ["科学・技術"] },
  { title: "利己的な遺伝子", author: "リチャード・ドーキンス", tags: ["科学・技術"] },
  { title: "生物と無生物のあいだ", author: "福岡伸一", tags: ["科学・技術"] },
  { title: "ファスト＆スロー", author: "ダニエル・カーネマン", tags: ["科学・技術"] },
  { title: "宇宙は何でできているのか", author: "村山斉", tags: ["科学・技術"] },

  // プログラミング
  { title: "リーダブルコード", author: "ダスティン・ボズウェル", tags: ["プログラミング"] },
  { title: "Clean Code", author: "ロバート・C・マーティン", tags: ["プログラミング"] },
  { title: "達人プログラマー", author: "デビッド・トーマス", tags: ["プログラミング"] },
  { title: "オブジェクト指向でなぜつくるのか", author: "平澤章", tags: ["プログラミング"] },
  { title: "プログラマが知るべき97のこと", author: "ケブリン・ヘニー", tags: ["プログラミング"] },
  { title: "ゼロから作るDeep Learning", author: "斎藤康毅", tags: ["プログラミング"] },

  // 歴史・社会
  { title: "ホモ・デウス", author: "ユヴァル・ノア・ハラリ", tags: ["歴史・社会"] },
  { title: "昭和史", author: "半藤一利", tags: ["歴史・社会"] },
  { title: "銃・病原菌・鉄", author: "ジャレド・ダイアモンド", tags: ["歴史・社会"] },
  { title: "国家はなぜ衰退するのか", author: "ダロン・アセモグル", tags: ["歴史・社会"] },
  { title: "日本人の勝算", author: "デービッド・アトキンソン", tags: ["歴史・社会"] },

  // 哲学・思想
  { title: "君たちはどう生きるか", author: "吉野源三郎", tags: ["哲学・思想"] },
  { title: "ソフィーの世界", author: "ヨースタイン・ゴルデル", tags: ["哲学・思想"] },
  { title: "これからの「正義」の話をしよう", author: "マイケル・サンデル", tags: ["哲学・思想"] },
  { title: "ツァラトゥストラはこう言った", author: "ニーチェ", tags: ["哲学・思想"] },
  { title: "哲学と宗教全史", author: "出口治明", tags: ["哲学・思想"] },

  // 趣味・実用
  { title: "筋トレが最強のソリューションである", author: "Testosterone", tags: ["趣味・実用"] },
  { title: "世界一美味しい手抜きごはん", author: "はらぺこグリズリー", tags: ["趣味・実用"] },
  { title: "スタンフォード式最高の睡眠", author: "西野精治", tags: ["趣味・実用"] },
  { title: "最高の体調", author: "鈴木祐", tags: ["趣味・実用"] },
  { title: "ズボラ瞑想", author: "田幡恵子", tags: ["趣味・実用"] },

  // マンガ
  { title: "ONE PIECE", author: "尾田栄一郎", tags: ["マンガ"] },
  { title: "鬼滅の刃", author: "吾峠呼世晴", tags: ["マンガ"] },
  { title: "進撃の巨人", author: "諫山創", tags: ["マンガ"] },
  { title: "スラムダンク", author: "井上雄彦", tags: ["マンガ"] },
  { title: "ドラゴンボール", author: "鳥山明", tags: ["マンガ"] },
  { title: "ハイキュー!!", author: "古舘春一", tags: ["マンガ"] },
  { title: "チェンソーマン", author: "藤本タツキ", tags: ["マンガ"] },
];

// ==================== Google Books API 検索 ====================
async function fetchBookInfo(title, author) {
  // APIキーなしで試行（リファラー制限を回避）
  const queries = [
    `intitle:"${title}" inauthor:"${author}"`,
    `intitle:"${title}"`,
    title,
  ];

  for (const query of queries) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.items?.[0]) return extractBookData(data.items[0], author);
    } catch (e) {
      // 次のクエリを試す
    }
  }
  return null;
}

function extractBookData(item, fallbackAuthor) {
  return {
    title: item.volumeInfo.title ?? "不明",
    author: (item.volumeInfo.authors ?? [fallbackAuthor]).join(", "),
    publisher: item.volumeInfo.publisher ?? "",
    thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ?? "",
    description: item.volumeInfo.description?.slice(0, 120) ?? "",
  };
}

// ==================== メイン ====================
async function main() {
  console.log(`📚 ${BOOKS.length}冊のルームを作成します...\n`);
  let created = 0;
  let failed = 0;

  for (const book of BOOKS) {
    try {
      const info = await fetchBookInfo(book.title, book.author);
      if (!info) {
        console.log(`❌ 見つかりません: ${book.title}`);
        failed++;
        continue;
      }
      await db.collection("rooms").add({
        ...info,
        createdBy: "system",
        createdAt: Date.now(),
        messageCount: 0,
        tags: book.tags,
      });
      console.log(`✅ 作成: ${info.title} / ${info.author}`);
      created++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ エラー (${book.title}):`, err.message);
      failed++;
    }
  }

  console.log(`\n完了！ 作成: ${created}件 / 失敗: ${failed}件`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
