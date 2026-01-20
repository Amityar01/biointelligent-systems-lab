export interface Book {
  id: string;
  title: string;
  titleJa: string;
  publisher: string;
  publisherJa: string;
  year: number;
  description: string;
  descriptionJa: string;
  amazon?: string;
  publisher_url?: string;
  image?: string;
}

export interface MediaAppearance {
  id: string;
  title: string;
  titleJa: string;
  outlet: string;
  date: string;
  type: 'tv' | 'radio' | 'newspaper' | 'magazine' | 'online' | 'international';
  description: string;
  descriptionJa: string;
  link?: string;
}

export const books: Book[] = [
  {
    id: 'life-intelligence-ai',
    title: 'Life Intelligence and Artificial Intelligence: How to Use and Develop Your Brain in the AI Era',
    titleJa: '生命知能と人工知能 AI時代の脳の使い方・育て方',
    publisher: 'Kodansha',
    publisherJa: '講談社',
    year: 2022,
    description: 'A book exploring the differences between biological intelligence and AI, offering insights on how to leverage our brains in the age of artificial intelligence. Praised by neuroscientist Yuji Ikegaya as "an extraordinary book that sharply dissects the essence of intelligence and the brain."',
    descriptionJa: '生命知能（脳）とAIの違いを知り、AI時代に豊かで幸せな生活を送るためのヒントを提示。池谷裕二氏も「知能の本質、脳の本質を鋭く抉る異次元の一冊」と評価。',
    amazon: 'https://www.amazon.co.jp/dp/B09P88FBLQ',
    publisher_url: 'https://bookclub.kodansha.co.jp/product?item=0000350502',
  },
  {
    id: 'brain-science-for-engineers-2',
    title: 'Brain Science for Mechanical Engineers Vol. 2: Memory, Learning, and Consciousness',
    titleJa: '続 メカ屋のための脳科学入門 記憶・学習/意識編',
    publisher: 'Nikkan Kogyo Shimbun',
    publisherJa: '日刊工業新聞社',
    year: 2017,
    description: 'The sequel covering memory, learning, and consciousness from an engineering perspective. Continues the approach of reverse engineering the brain for engineers.',
    descriptionJa: '記憶・学習・意識を工学的視点から解説した続編。エンジニアのための脳のリバースエンジニアリングを継続。',
    amazon: 'https://www.amazon.co.jp/dp/4526077712',
  },
  {
    id: 'brain-science-for-engineers-1',
    title: 'Brain Science for Mechanical Engineers: Reverse Engineering the Brain',
    titleJa: 'メカ屋のための脳科学入門 脳をリバースエンジニアリングする',
    publisher: 'Nikkan Kogyo Shimbun',
    publisherJa: '日刊工業新聞社',
    year: 2016,
    description: 'An introduction to neuroscience for engineers, approaching the brain as a system to be reverse engineered. Based on the popular serialization in Machine Design magazine.',
    descriptionJa: 'エンジニアのための脳科学入門書。脳をリバースエンジニアリングするシステムとしてアプローチ。機械設計誌の人気連載を書籍化。',
    amazon: 'https://www.amazon.co.jp/dp/4526076058',
  },
  {
    id: 'animal-songs-human-songs',
    title: 'Animal Songs, Human Songs',
    titleJa: '動物の歌、ヒトの歌',
    publisher: 'Asakura Publishing',
    publisherJa: '朝倉書店',
    year: 2019,
    description: 'A collaborative work exploring music and vocalization across species. Co-authored with Tomoyo Shiramatsu.',
    descriptionJa: '種を超えた音楽と発声を探求する共著書。白松知世准教授との分担執筆。',
  },
  {
    id: 'practical-design',
    title: 'Practical Design (Revised Edition): Knowledge and Models for Machine Design',
    titleJa: '続・実際の設計 改訂新版 機械設計に必要な知識とモデル',
    publisher: 'Nikkan Kogyo Shimbun',
    publisherJa: '日刊工業新聞社',
    year: 2017,
    description: 'A comprehensive guide to machine design, co-edited with Prof. Yotaro Hatamura.',
    descriptionJa: '機械設計の包括的ガイド。畑村洋太郎教授との共編。',
  },
];

export const mediaAppearances: MediaAppearance[] = [
  // 2024
  {
    id: 'newton-2024',
    title: 'Featured in Newton Magazine: "What is Intelligence?"',
    titleJa: 'Newton誌「知能とは何か」特集で紹介',
    outlet: 'Newton Magazine',
    date: '2024-08',
    type: 'magazine',
    description: 'Featured in the August 2024 special issue exploring the nature of intelligence from a neuroscience perspective.',
    descriptionJa: '2024年8月号の知能特集で神経科学の視点から解説。',
  },
  {
    id: 'siggraph-2024',
    title: 'SIGGRAPH Asia 2024: "Online Chat with Living Neuronal Cultures"',
    titleJa: 'SIGGRAPH Asia 2024「生きた神経培養とのオンラインチャット」',
    outlet: 'SIGGRAPH Asia Tokyo',
    date: '2024-12',
    type: 'international',
    description: 'Interactive media art installation connecting audiences with living neuronal cultures.',
    descriptionJa: '生きた神経培養と観客をつなぐインタラクティブなメディアアート。',
  },
  // 2022
  {
    id: 'rats-bop-international',
    title: 'Rats Bop to the Beat - International Media Coverage',
    titleJa: 'ラットがビートに乗る - 国際メディア報道',
    outlet: 'BBC, CNN, The Guardian, Reuters, AFP, NHK',
    date: '2022-11',
    type: 'international',
    description: 'Discovery of innate beat synchronization in rats covered by major international media including BBC, CNN, The Guardian, USA Today, and others.',
    descriptionJa: 'ラットの生得的ビート同期の発見がBBC、CNN、ガーディアン、USA Today等の国際メディアで報道。',
    link: 'https://www.u-tokyo.ac.jp/focus/en/press/z0508_00262.html',
  },
  {
    id: 'jwave-2022',
    title: 'J-Wave Toppan Innovation World Era',
    titleJa: 'J-Wave トッパン イノベーションワールド エラ',
    outlet: 'J-Wave Radio',
    date: '2022-11',
    type: 'radio',
    description: 'Radio appearance discussing the beat synchronization research.',
    descriptionJa: 'ビート同期研究についてのラジオ出演。',
  },
  {
    id: 'yomiuri-2022',
    title: 'Book Review in Yomiuri Newspaper',
    titleJa: '読売新聞書評',
    outlet: 'Yomiuri Shimbun',
    date: '2022-02',
    type: 'newspaper',
    description: 'Review of "Life Intelligence and Artificial Intelligence" book.',
    descriptionJa: '『生命知能と人工知能』書評掲載。',
    link: 'https://www.yomiuri.co.jp/culture/book/review/20220221-OYT8T50038/',
  },
  {
    id: 'nikkei-2022',
    title: 'Nikkei Newspaper Coverage',
    titleJa: '日経新聞掲載',
    outlet: 'Nikkei',
    date: '2022-02',
    type: 'newspaper',
    description: 'Coverage of the new book on life intelligence and AI.',
    descriptionJa: '生命知能とAIに関する新刊の紹介。',
    link: 'https://www.nikkei.com/article/DGXZQOUD241L40U2A220C2000000/',
  },
  // Earlier
  {
    id: 'tansei-utokyo',
    title: 'UTokyo PR Magazine "Tansei" Column',
    titleJa: '東大広報誌「淡青」コラム',
    outlet: 'University of Tokyo Tansei Magazine',
    date: '2020',
    type: 'magazine',
    description: 'Column "AI vs. Brain" in the University of Tokyo PR magazine.',
    descriptionJa: '「AIと脳」についてのコラム掲載。',
  },
];

export const youtubeChannel = {
  name: 'Takahashi Lab YouTube Channel',
  nameJa: '高橋研究室YouTubeチャンネル',
  url: 'https://www.youtube.com/channel/UCuuuZ4ewKDXA-FvTiO4HqNA',
  description: 'Video explanations of research and book content, including lectures on brain science and AI.',
  descriptionJa: '研究と書籍内容の動画解説。脳科学とAIに関する講義を含む。',
};

export const serializations = [
  {
    title: 'Brain Science for Mechanical Engineers',
    titleJa: 'メカ屋のための脳科学入門',
    publication: 'Machine Design (Nikkan Kogyo)',
    publicationJa: '機械設計（日刊工業新聞社）',
    period: '2014-2017',
    description: 'Long-running serialization covering reverse engineering the brain from an engineering perspective.',
    descriptionJa: '工学的視点から脳のリバースエンジニアリングを解説する長期連載。',
  },
];
