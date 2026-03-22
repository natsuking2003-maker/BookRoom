export interface CategoryNode {
  label: string;
  searchQuery?: string; // 末端ノードのみ（Google Books クエリ）
  children?: CategoryNode[];
  authors?: string[];    // 著者一覧（最終レベル）
  publishers?: string[]; // 出版社一覧（最終レベル）
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    label: "小説・文学",
    children: [
      {
        label: "日本文学",
        children: [
          {
            label: "現代小説",
            searchQuery: "日本 現代小説",
            authors:    ["東野圭吾", "宮部みゆき", "池井戸潤", "百田尚樹", "辻村深月", "伊坂幸太郎", "湊かなえ", "有川浩"],
            publishers: ["講談社", "新潮社", "文藝春秋", "集英社", "幻冬舎", "角川書店"],
          },
          {
            label: "純文学",
            searchQuery: "日本 純文学",
            authors:    ["村上春樹", "川端康成", "太宰治", "三島由紀夫", "芥川龍之介", "夏目漱石", "遠藤周作", "松本清張"],
            publishers: ["新潮社", "文藝春秋", "岩波書店", "講談社", "河出書房新社"],
          },
          {
            label: "時代小説・歴史",
            searchQuery: "日本 時代小説 歴史小説",
            authors:    ["池波正太郎", "藤沢周平", "司馬遼太郎", "吉川英治", "山本一力", "宮城谷昌光"],
            publishers: ["新潮社", "文藝春秋", "講談社", "光文社", "双葉社"],
          },
          {
            label: "ミステリー・推理",
            searchQuery: "日本 ミステリー 推理小説",
            authors:    ["東野圭吾", "綾辻行人", "米澤穂信", "有栖川有栖", "京極夏彦", "島田荘司", "道尾秀介"],
            publishers: ["講談社", "文藝春秋", "角川書店", "光文社", "東京創元社"],
          },
          {
            label: "SF・ファンタジー",
            searchQuery: "日本 SF ファンタジー 小説",
            authors:    ["小川一水", "冲方丁", "菅浩江", "神林長平", "谷川流", "上橋菜穂子"],
            publishers: ["早川書房", "東京創元社", "角川書店", "集英社"],
          },
          {
            label: "ホラー",
            searchQuery: "日本 ホラー 小説",
            authors:    ["貴志祐介", "小野不由美", "道尾秀介", "恩田陸", "三津田信三"],
            publishers: ["角川書店", "新潮社", "光文社", "講談社"],
          },
          {
            label: "恋愛小説",
            searchQuery: "日本 恋愛小説",
            authors:    ["辻仁成", "山本文緒", "角田光代", "唯川恵", "桜木紫乃"],
            publishers: ["集英社", "角川書店", "幻冬舎", "小学館"],
          },
          {
            label: "青春・学園",
            searchQuery: "日本 青春 学園小説",
            authors:    ["住野よる", "朝井リョウ", "辻村深月", "加藤シゲアキ", "瀬尾まいこ"],
            publishers: ["集英社", "角川書店", "講談社", "小学館"],
          },
        ],
      },
      {
        label: "海外文学",
        children: [
          {
            label: "英米文学",
            searchQuery: "英米文学 翻訳小説",
            authors:    ["スティーブン・キング", "J.K.ローリング", "ヘミングウェイ", "フィッツジェラルド", "ジョン・スタインベック", "チャールズ・ディケンズ"],
            publishers: ["早川書房", "新潮社", "集英社", "角川書店"],
          },
          {
            label: "ヨーロッパ文学",
            searchQuery: "ヨーロッパ文学 翻訳",
            authors:    ["カフカ", "ドストエフスキー", "トルストイ", "ガルシア・マルケス", "カミュ", "ゲーテ"],
            publishers: ["早川書房", "岩波書店", "河出書房新社", "新潮社"],
          },
          {
            label: "海外ミステリー",
            searchQuery: "海外ミステリー 翻訳",
            authors:    ["アガサ・クリスティ", "コナン・ドイル", "レイモンド・チャンドラー", "ジョン・グリシャム", "ハーラン・コーベン"],
            publishers: ["早川書房", "東京創元社", "講談社", "角川書店"],
          },
          {
            label: "海外SF",
            searchQuery: "海外SF 翻訳小説",
            authors:    ["アシモフ", "フィリップ・K・ディック", "アーサー・C・クラーク", "ル=グウィン", "ハインライン", "テッド・チャン"],
            publishers: ["早川書房", "東京創元社"],
          },
          {
            label: "世界の古典",
            searchQuery: "世界文学 古典 名作",
            authors:    ["シェイクスピア", "ダンテ", "セルバンテス", "ゲーテ", "ホメロス", "プルースト"],
            publishers: ["岩波書店", "新潮社", "河出書房新社", "光文社"],
          },
        ],
      },
      {
        label: "ライトノベル",
        children: [
          {
            label: "ファンタジー系",
            searchQuery: "ライトノベル ファンタジー",
            authors:    ["川原礫", "鎌池和馬", "西尾維新", "支倉凍砂", "田中芳樹"],
            publishers: ["電撃文庫", "富士見ファンタジア文庫", "ガガガ文庫", "スニーカー文庫"],
          },
          {
            label: "ラブコメ系",
            searchQuery: "ライトノベル ラブコメ",
            authors:    ["渡航", "平坂読", "陰山琢磨", "雨森たきび"],
            publishers: ["電撃文庫", "MF文庫J", "ガガガ文庫", "富士見ファンタジア文庫"],
          },
          {
            label: "異世界転生",
            searchQuery: "ライトノベル 異世界転生",
            authors:    ["丸山くがね", "伏瀬", "川原礫", "理不尽な孫の手"],
            publishers: ["電撃文庫", "富士見ファンタジア文庫", "MF文庫J", "オーバーラップ文庫"],
          },
        ],
      },
    ],
  },
  {
    label: "ビジネス・経済",
    children: [
      {
        label: "マネジメント・リーダーシップ",
        children: [
          {
            label: "マネジメント",
            searchQuery: "マネジメント ビジネス書",
            authors:    ["ピーター・ドラッカー", "松下幸之助", "稲盛和夫", "ジム・コリンズ", "ベン・ホロウィッツ"],
            publishers: ["ダイヤモンド社", "東洋経済新報社", "日経BP", "PHP研究所"],
          },
          {
            label: "リーダーシップ",
            searchQuery: "リーダーシップ ビジネス書",
            authors:    ["スティーブン・コヴィー", "サイモン・シネック", "野中郁次郎", "ジョン・コッター"],
            publishers: ["ダイヤモンド社", "日経BP", "PHP研究所", "日本経済新聞出版"],
          },
          {
            label: "組織論・人事",
            searchQuery: "組織論 人事 ビジネス",
            authors:    ["野中郁次郎", "フレデリック・ラルー", "金井壽宏", "パトリック・レンシオーニ"],
            publishers: ["ダイヤモンド社", "東洋経済新報社", "日経BP"],
          },
        ],
      },
      {
        label: "マーケティング・起業",
        children: [
          {
            label: "マーケティング",
            searchQuery: "マーケティング ビジネス書",
            authors:    ["フィリップ・コトラー", "神田昌典", "西口一希", "セス・ゴーディン"],
            publishers: ["ダイヤモンド社", "翔泳社", "日経BP", "東洋経済新報社"],
          },
          {
            label: "起業・スタートアップ",
            searchQuery: "起業 スタートアップ ビジネス書",
            authors:    ["エリック・リース", "ピーター・ティール", "ベン・ホロウィッツ", "ポール・グレアム"],
            publishers: ["日経BP", "ダイヤモンド社", "NewsPicksパブリッシング"],
          },
          {
            label: "イノベーション",
            searchQuery: "イノベーション ビジネス書",
            authors:    ["クレイトン・クリステンセン", "エリック・リース", "浜口隆則"],
            publishers: ["翔泳社", "ダイヤモンド社", "日経BP"],
          },
        ],
      },
      {
        label: "経済・金融",
        children: [
          {
            label: "経済学入門",
            searchQuery: "経済学 入門書",
            authors:    ["ポール・クルーグマン", "グレゴリー・マンキュー", "スティーブン・レヴィット", "大竹文雄"],
            publishers: ["日本経済新聞出版", "岩波書店", "東洋経済新報社", "ダイヤモンド社"],
          },
          {
            label: "投資・株式",
            searchQuery: "投資 株式 ビジネス書",
            authors:    ["ウォーレン・バフェット", "バートン・マルキール", "ロバート・キヨサキ", "山崎元"],
            publishers: ["日経BP", "ダイヤモンド社", "東洋経済新報社", "パンローリング"],
          },
          {
            label: "経営戦略",
            searchQuery: "経営戦略 ビジネス書",
            authors:    ["マイケル・ポーター", "楠木建", "三谷宏治", "ヘンリー・ミンツバーグ"],
            publishers: ["ダイヤモンド社", "東洋経済新報社", "日経BP"],
          },
        ],
      },
    ],
  },
  {
    label: "自己啓発・生き方",
    children: [
      {
        label: "習慣・生産性",
        searchQuery: "習慣 生産性 自己啓発",
        authors:    ["スティーブン・コヴィー", "チャールズ・デュヒッグ", "ジェームズ・クリアー", "堀江貴文", "メンタリストDaiGo"],
        publishers: ["サンマーク出版", "ダイヤモンド社", "フォレスト出版", "ディスカヴァー・トゥエンティワン"],
      },
      {
        label: "思考法・問題解決",
        searchQuery: "思考法 問題解決 自己啓発",
        authors:    ["バーバラ・ミントー", "細谷功", "照屋華子", "渡辺健介"],
        publishers: ["ダイヤモンド社", "東洋経済新報社", "翔泳社"],
      },
      {
        label: "コミュニケーション",
        searchQuery: "コミュニケーション 自己啓発",
        authors:    ["デール・カーネギー", "斎藤孝", "佐藤優", "鴻上尚史"],
        publishers: ["三笠書房", "サンマーク出版", "ディスカヴァー・トゥエンティワン", "大和書房"],
      },
      {
        label: "メンタル・心理",
        searchQuery: "メンタル 心理 自己啓発",
        authors:    ["岸見一郎", "ヴィクトール・フランクル", "マーティン・セリグマン", "アドラー"],
        publishers: ["サンマーク出版", "大和書房", "ダイヤモンド社", "飛鳥新社"],
      },
      {
        label: "お金・節約",
        searchQuery: "お金 節約 自己啓発",
        authors:    ["ロバート・キヨサキ", "山崎元", "本多静六", "橘玲", "両学長"],
        publishers: ["ダイヤモンド社", "朝日新聞出版", "KADOKAWA", "日経BP"],
      },
      {
        label: "人生哲学・生き方",
        searchQuery: "人生哲学 生き方 自己啓発",
        authors:    ["松下幸之助", "稲盛和夫", "五木寛之", "瀬戸内寂聴", "バートランド・ラッセル"],
        publishers: ["PHP研究所", "サンマーク出版", "大和書房", "幻冬舎"],
      },
    ],
  },
  {
    label: "科学・テクノロジー",
    children: [
      {
        label: "物理・宇宙",
        searchQuery: "物理 宇宙 科学 一般書",
        authors:    ["スティーブン・ホーキング", "カール・セーガン", "ブライアン・グリーン", "佐藤勝彦", "竹内薫"],
        publishers: ["ブルーバックス（講談社）", "岩波書店", "早川書房", "SBクリエイティブ"],
      },
      {
        label: "生物・進化",
        searchQuery: "生物 進化 科学 一般書",
        authors:    ["リチャード・ドーキンス", "福岡伸一", "更科功", "チャールズ・ダーウィン"],
        publishers: ["岩波書店", "講談社", "早川書房", "光文社"],
      },
      {
        label: "脳科学・認知",
        searchQuery: "脳科学 認知科学 一般書",
        authors:    ["池谷裕二", "茂木健一郎", "ダニエル・カーネマン", "アントニオ・ダマシオ"],
        publishers: ["ダイヤモンド社", "NHK出版", "岩波書店", "講談社"],
      },
      {
        label: "数学・統計",
        searchQuery: "数学 統計 一般書",
        authors:    ["サイモン・シン", "マーカス・デュ・ソートイ", "竹内薫", "神永正博"],
        publishers: ["岩波書店", "ブルーバックス（講談社）", "日本評論社", "SBクリエイティブ"],
      },
      {
        label: "AI・テクノロジー",
        searchQuery: "AI 人工知能 テクノロジー 一般書",
        authors:    ["レイ・カーツワイル", "松尾豊", "新井紀子", "ニック・ボストロム", "西垣通"],
        publishers: ["日経BP", "KADOKAWA", "角川書店", "SBクリエイティブ"],
      },
      {
        label: "環境・地球科学",
        searchQuery: "環境 地球科学 一般書",
        authors:    ["ジャレド・ダイアモンド", "江守正多", "田中優", "枝廣淳子"],
        publishers: ["岩波書店", "日経BP", "講談社", "NHK出版"],
      },
    ],
  },
  {
    label: "プログラミング・IT",
    children: [
      {
        label: "Python",
        searchQuery: "Python プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社", "SBクリエイティブ"],
      },
      {
        label: "JavaScript / TypeScript",
        searchQuery: "JavaScript TypeScript プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社", "SBクリエイティブ"],
      },
      {
        label: "Java",
        searchQuery: "Java プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社", "SBクリエイティブ"],
      },
      {
        label: "C / C++",
        searchQuery: "C言語 C++ プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社"],
      },
      {
        label: "Go",
        searchQuery: "Go言語 プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "C&R研究所"],
      },
      {
        label: "Rust",
        searchQuery: "Rust プログラミング",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社"],
      },
      {
        label: "Web開発",
        searchQuery: "Web開発 フロントエンド バックエンド",
        publishers: ["オライリー・ジャパン", "翔泳社", "技術評論社", "マイナビ出版"],
      },
      {
        label: "データサイエンス・機械学習",
        searchQuery: "データサイエンス 機械学習 Python",
        publishers: ["オライリー・ジャパン", "翔泳社", "技術評論社", "マイナビ出版"],
      },
      {
        label: "競技プログラミング",
        searchQuery: "競技プログラミング アルゴリズム",
        publishers: ["マイナビ出版", "技術評論社", "翔泳社"],
      },
      {
        label: "クラウド・インフラ",
        searchQuery: "クラウド インフラ DevOps",
        publishers: ["オライリー・ジャパン", "技術評論社", "翔泳社", "SBクリエイティブ"],
      },
    ],
  },
  {
    label: "歴史・社会",
    children: [
      {
        label: "歴史",
        children: [
          {
            label: "日本史",
            searchQuery: "日本史 一般書",
            authors:    ["司馬遼太郎", "磯田道史", "本郷和人", "半藤一利", "山本博文"],
            publishers: ["新潮社", "文藝春秋", "岩波書店", "角川書店", "PHP研究所"],
          },
          {
            label: "世界史",
            searchQuery: "世界史 一般書",
            authors:    ["ユヴァル・ノア・ハラリ", "岡本隆司", "出口治明", "宮崎市定"],
            publishers: ["岩波書店", "新潮社", "講談社", "中央公論新社"],
          },
          {
            label: "戦争・近現代史",
            searchQuery: "戦争 近現代史 一般書",
            authors:    ["半藤一利", "保阪正康", "加藤陽子", "NHKスペシャル取材班"],
            publishers: ["新潮社", "文藝春秋", "岩波書店", "講談社"],
          },
        ],
      },
      {
        label: "社会・政治",
        children: [
          {
            label: "政治・国際関係",
            searchQuery: "政治 国際関係 一般書",
            authors:    ["池上彰", "手嶋龍一", "佐藤優", "藤原帰一"],
            publishers: ["岩波書店", "中央公論新社", "新潮社", "文藝春秋"],
          },
          {
            label: "社会問題",
            searchQuery: "社会問題 一般書",
            authors:    ["斎藤幸平", "松岡亮二", "橘木俊詔", "山田昌弘"],
            publishers: ["岩波書店", "朝日新聞出版", "筑摩書房"],
          },
          {
            label: "ジャーナリズム・ノンフィクション",
            searchQuery: "ジャーナリズム ノンフィクション",
            authors:    ["沢木耕太郎", "池上彰", "佐野眞一", "柳田邦男"],
            publishers: ["文藝春秋", "新潮社", "朝日新聞出版", "講談社"],
          },
        ],
      },
    ],
  },
  {
    label: "哲学・思想・宗教",
    children: [
      {
        label: "西洋哲学",
        searchQuery: "西洋哲学 入門書",
        authors:    ["プラトン", "アリストテレス", "カント", "ニーチェ", "サルトル", "小川仁志"],
        publishers: ["岩波書店", "筑摩書房", "中央公論新社", "光文社"],
      },
      {
        label: "東洋思想",
        searchQuery: "東洋思想 哲学 入門書",
        authors:    ["孔子", "老子", "鈴木大拙", "中村元", "釈迦"],
        publishers: ["岩波書店", "中央公論新社", "筑摩書房", "講談社"],
      },
      {
        label: "倫理学",
        searchQuery: "倫理学 一般書",
        authors:    ["マイケル・サンデル", "ピーター・シンガー", "宮野公樹"],
        publishers: ["早川書房", "岩波書店", "NHK出版"],
      },
      {
        label: "宗教・スピリチュアル",
        searchQuery: "宗教 スピリチュアル 一般書",
        authors:    ["ダライ・ラマ", "瀬戸内寂聴", "五木寛之", "阿満利麿"],
        publishers: ["PHP研究所", "サンマーク出版", "幻冬舎", "朝日新聞出版"],
      },
    ],
  },
  {
    label: "趣味・実用",
    children: [
      {
        label: "料理・レシピ",
        searchQuery: "料理 レシピ 料理本",
        publishers: ["小学館", "講談社", "KADOKAWA", "主婦の友社"],
      },
      {
        label: "健康・ダイエット",
        searchQuery: "健康 ダイエット 実用書",
        publishers: ["主婦の友社", "小学館", "講談社", "ダイヤモンド社"],
      },
      {
        label: "スポーツ・アウトドア",
        searchQuery: "スポーツ アウトドア 実用書",
        publishers: ["ベースボール・マガジン社", "東京書籍", "山と溪谷社"],
      },
      {
        label: "旅行・地理",
        searchQuery: "旅行 ガイドブック",
        publishers: ["昭文社", "JTBパブリッシング", "小学館"],
      },
      {
        label: "芸術・音楽・映画",
        searchQuery: "芸術 音楽 映画 一般書",
        publishers: ["小学館", "講談社", "KADOKAWA"],
      },
      {
        label: "語学・外国語",
        searchQuery: "語学 外国語 学習書",
        publishers: ["三修社", "アルク", "DHC", "KADOKAWA"],
      },
    ],
  },
  {
    label: "マンガ・グラフィック",
    children: [
      {
        label: "少年マンガ",
        searchQuery: "少年マンガ コミック",
        authors:    ["尾田栄一郎", "鳥山明", "岸本斉史", "久保帯人", "堀越耕平", "諫山創", "吾峠呼世晴"],
        publishers: ["集英社", "講談社", "小学館", "KADOKAWA", "秋田書店"],
      },
      {
        label: "少女マンガ",
        searchQuery: "少女マンガ コミック",
        authors:    ["高屋奈月", "矢沢あい", "水城せとな", "萩尾望都", "竹宮惠子"],
        publishers: ["集英社", "小学館", "白泉社", "講談社"],
      },
      {
        label: "青年マンガ",
        searchQuery: "青年マンガ コミック",
        authors:    ["浦沢直樹", "井上雄彦", "三田紀房", "藤本タツキ", "岩明均"],
        publishers: ["小学館", "講談社", "集英社", "白泉社", "スクウェア・エニックス"],
      },
      {
        label: "ノンフィクションマンガ",
        searchQuery: "ノンフィクション 漫画",
        authors:    ["西原理恵子", "吉田戦車", "ちばてつや"],
        publishers: ["小学館", "講談社", "朝日新聞出版"],
      },
      {
        label: "学習マンガ",
        searchQuery: "学習まんが 学習漫画",
        publishers: ["小学館", "学研プラス", "集英社"],
      },
    ],
  },
  {
    label: "学習・参考書",
    children: [
      {
        label: "大学",
        children: [
          {
            label: "数学",
            children: [
              {
                label: "線形代数",
                searchQuery: "線形代数 大学 教科書",
                publishers: ["裳華房", "岩波書店", "サイエンス社", "東京大学出版会"],
              },
              {
                label: "微分積分",
                searchQuery: "微分積分学 大学 教科書",
                publishers: ["裳華房", "岩波書店", "サイエンス社"],
              },
              {
                label: "統計学",
                searchQuery: "統計学 大学 教科書",
                publishers: ["東京大学出版会", "岩波書店", "サイエンス社", "培風館"],
              },
            ],
          },
          {
            label: "理工系",
            children: [
              {
                label: "物理学",
                searchQuery: "物理学 大学 教科書",
                publishers: ["裳華房", "岩波書店", "サイエンス社", "東京大学出版会"],
              },
              {
                label: "化学",
                searchQuery: "化学 大学 教科書",
                publishers: ["裳華房", "岩波書店", "東京化学同人", "サイエンス社"],
              },
              {
                label: "生命科学・生物学",
                searchQuery: "生命科学 生物学 大学 教科書",
                publishers: ["東京化学同人", "化学同人", "岩波書店", "丸善出版"],
              },
              {
                label: "情報工学",
                searchQuery: "情報工学 大学 教科書",
                publishers: ["オーム社", "サイエンス社", "共立出版", "近代科学社"],
              },
            ],
          },
          {
            label: "文系",
            children: [
              {
                label: "経済学",
                searchQuery: "経済学 大学 教科書",
                publishers: ["東洋経済新報社", "岩波書店", "有斐閣", "日本経済新聞出版"],
              },
              {
                label: "法学",
                searchQuery: "法学 大学 教科書",
                publishers: ["有斐閣", "岩波書店", "弘文堂", "法律文化社"],
              },
              {
                label: "心理学",
                searchQuery: "心理学 大学 教科書",
                publishers: ["有斐閣", "培風館", "ナカニシヤ出版", "北大路書房"],
              },
              {
                label: "社会学",
                searchQuery: "社会学 大学 教科書",
                publishers: ["有斐閣", "岩波書店", "ミネルヴァ書房", "新曜社"],
              },
            ],
          },
          {
            label: "医学・薬学・看護",
            children: [
              {
                label: "医学",
                searchQuery: "医学 大学 教科書",
                publishers: ["医学書院", "南江堂", "文光堂", "中外医学社"],
              },
              {
                label: "薬学",
                searchQuery: "薬学 大学 教科書",
                publishers: ["南江堂", "廣川書店", "医学書院", "東京化学同人"],
              },
              {
                label: "看護学",
                searchQuery: "看護学 大学 教科書",
                publishers: ["医学書院", "メディカ出版", "南江堂", "照林社"],
              },
            ],
          },
        ],
      },
      {
        label: "高校",
        children: [
          {
            label: "数学",
            children: [
              {
                label: "数学Ⅰ+A",
                searchQuery: "高校数学 数学I A",
                publishers: ["数研出版", "東京書籍", "Z会", "旺文社"],
              },
              {
                label: "数学Ⅱ+B",
                searchQuery: "高校数学 数学II B",
                publishers: ["数研出版", "東京書籍", "Z会", "旺文社"],
              },
              {
                label: "数学Ⅲ+C",
                searchQuery: "高校数学 数学III C",
                publishers: ["数研出版", "東京書籍", "Z会", "旺文社"],
              },
            ],
          },
          {
            label: "英語",
            children: [
              {
                label: "英文法・読解",
                searchQuery: "高校英語 英文法 参考書",
                publishers: ["旺文社", "Z会", "研究社", "三修社"],
              },
              {
                label: "英単語",
                searchQuery: "英単語 参考書",
                publishers: ["旺文社", "Z会", "研究社", "アルク"],
              },
              {
                label: "英語長文・リスニング",
                searchQuery: "高校英語 長文 リスニング 参考書",
                publishers: ["旺文社", "Z会", "数研出版", "河合出版"],
              },
            ],
          },
          {
            label: "理科",
            children: [
              {
                label: "物理",
                searchQuery: "高校 物理 参考書",
                publishers: ["数研出版", "旺文社", "Z会", "啓林館"],
              },
              {
                label: "化学",
                searchQuery: "高校 化学 参考書",
                publishers: ["数研出版", "旺文社", "Z会", "啓林館"],
              },
              {
                label: "生物",
                searchQuery: "高校 生物 参考書",
                publishers: ["数研出版", "旺文社", "Z会", "啓林館"],
              },
              {
                label: "地学",
                searchQuery: "高校 地学 参考書",
                publishers: ["数研出版", "旺文社", "Z会"],
              },
            ],
          },
          {
            label: "国語・古文",
            children: [
              {
                label: "現代文",
                searchQuery: "高校 現代文 参考書",
                publishers: ["旺文社", "Z会", "数研出版", "河合出版"],
              },
              {
                label: "古文・漢文",
                searchQuery: "高校 古文 漢文 参考書",
                publishers: ["旺文社", "Z会", "三省堂", "河合出版"],
              },
            ],
          },
          {
            label: "社会・地理歴史",
            children: [
              {
                label: "日本史",
                searchQuery: "高校 日本史 参考書",
                publishers: ["山川出版社", "東京書籍", "Z会", "旺文社"],
              },
              {
                label: "世界史",
                searchQuery: "高校 世界史 参考書",
                publishers: ["山川出版社", "東京書籍", "Z会", "旺文社"],
              },
              {
                label: "地理",
                searchQuery: "高校 地理 参考書",
                publishers: ["山川出版社", "東京書籍", "Z会", "旺文社"],
              },
              {
                label: "公民・政治経済",
                searchQuery: "高校 公民 政治経済 参考書",
                publishers: ["山川出版社", "旺文社", "Z会", "清水書院"],
              },
            ],
          },
        ],
      },
      {
        label: "中学",
        children: [
          {
            label: "数学",
            children: [
              {
                label: "数学（1年）",
                searchQuery: "中学1年 数学 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
              {
                label: "数学（2年）",
                searchQuery: "中学2年 数学 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
              {
                label: "数学（3年）",
                searchQuery: "中学3年 数学 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
            ],
          },
          {
            label: "英語",
            children: [
              {
                label: "英文法・英単語",
                searchQuery: "中学 英語 英文法 英単語 参考書",
                publishers: ["旺文社", "学研プラス", "Z会", "くもん出版"],
              },
              {
                label: "英語長文・リスニング",
                searchQuery: "中学 英語長文 リスニング 参考書",
                publishers: ["旺文社", "Z会", "学研プラス", "文理"],
              },
            ],
          },
          {
            label: "理科",
            children: [
              {
                label: "物理・化学",
                searchQuery: "中学 物理 化学 理科 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
              {
                label: "生物・地学",
                searchQuery: "中学 生物 地学 理科 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
            ],
          },
          {
            label: "社会",
            children: [
              {
                label: "歴史",
                searchQuery: "中学 歴史 社会 参考書",
                publishers: ["山川出版社", "学研プラス", "Z会", "旺文社"],
              },
              {
                label: "地理",
                searchQuery: "中学 地理 社会 参考書",
                publishers: ["帝国書院", "学研プラス", "Z会", "旺文社"],
              },
              {
                label: "公民",
                searchQuery: "中学 公民 社会 参考書",
                publishers: ["学研プラス", "文理", "Z会", "旺文社"],
              },
            ],
          },
          {
            label: "国語",
            children: [
              {
                label: "現代文・読解",
                searchQuery: "中学 国語 現代文 読解 参考書",
                publishers: ["学研プラス", "旺文社", "Z会", "文理"],
              },
              {
                label: "古文・漢文",
                searchQuery: "中学 古文 漢文 参考書",
                publishers: ["学研プラス", "旺文社", "Z会", "文理"],
              },
            ],
          },
          {
            label: "高校受験",
            children: [
              {
                label: "過去問・模擬テスト",
                searchQuery: "高校受験 過去問 模擬テスト",
                publishers: ["声の教育社", "東京学参", "旺文社", "Z会"],
              },
              {
                label: "総合・5科対策",
                searchQuery: "高校受験 5科 総合対策 参考書",
                publishers: ["学研プラス", "旺文社", "Z会", "文理"],
              },
            ],
          },
        ],
      },
      {
        label: "資格",
        children: [
          {
            label: "ITパスポート・情報処理",
            searchQuery: "ITパスポート 基本情報技術者 参考書",
            publishers: ["TAC出版", "技術評論社", "翔泳社", "成美堂出版"],
          },
          {
            label: "簿記",
            searchQuery: "日商簿記 参考書",
            publishers: ["TAC出版", "中央経済社", "成美堂出版", "ネットスクール"],
          },
          {
            label: "宅建・行政書士",
            searchQuery: "宅建 行政書士 参考書",
            publishers: ["TAC出版", "LEC東京リーガルマインド", "成美堂出版", "ユーキャン"],
          },
          {
            label: "看護・医療国家試験",
            searchQuery: "看護師 国家試験 参考書",
            publishers: ["医学書院", "メディックメディア", "照林社", "学研メディカル秀潤社"],
          },
          {
            label: "公務員試験",
            searchQuery: "公務員試験 参考書",
            publishers: ["TAC出版", "実務教育出版", "LEC東京リーガルマインド", "東京リーガルマインド"],
          },
          {
            label: "語学・TOEIC",
            searchQuery: "TOEIC TOEFL 英検 資格 参考書",
            publishers: ["旺文社", "アルク", "KADOKAWA", "スリーエーネットワーク"],
          },
        ],
      },
      {
        label: "その他",
        children: [
          {
            label: "小学校",
            children: [
              {
                label: "算数",
                searchQuery: "小学校 算数 参考書 ドリル",
                publishers: ["学研プラス", "くもん出版", "旺文社", "文理"],
              },
              {
                label: "国語",
                searchQuery: "小学校 国語 参考書 ドリル",
                publishers: ["学研プラス", "くもん出版", "旺文社", "文理"],
              },
              {
                label: "理科・社会",
                searchQuery: "小学校 理科 社会 参考書",
                publishers: ["学研プラス", "くもん出版", "旺文社", "文理"],
              },
              {
                label: "中学受験",
                searchQuery: "中学受験 参考書",
                publishers: ["四谷大塚", "日能研", "サピックス", "旺文社"],
              },
            ],
          },
          {
            label: "大学受験",
            children: [
              {
                label: "共通テスト対策",
                searchQuery: "共通テスト 対策 参考書",
                publishers: ["Z会", "旺文社", "河合出版", "駿台文庫"],
              },
              {
                label: "二次試験・個別試験",
                searchQuery: "大学受験 二次試験 参考書",
                publishers: ["Z会", "旺文社", "駿台文庫", "河合出版"],
              },
            ],
          },
          {
            label: "教育・指導法",
            searchQuery: "教育 指導法 教員採用試験",
            publishers: ["東洋館出版社", "明治図書", "学研プラス", "協同出版"],
          },
        ],
      },
    ],
  },
];
