export interface NewsItem {
  id: string;
  title: string;
  titleJa: string;
  date: string;
  category: 'publication' | 'award' | 'event' | 'media' | 'announcement';
  excerpt: string;
  excerptJa: string;
  content?: string;
  contentJa?: string;
  image?: string;
  link?: string;
}

export const news: NewsItem[] = [
  // 2025
  {
    id: 'news-2025-08',
    title: 'Paper published in Frontiers in Neural Circuits on deviance detection',
    titleJa: '逸脱検出に関する論文がFrontiers in Neural Circuitsに掲載',
    date: '2025-08-25',
    category: 'publication',
    excerpt: 'Zhang et al. published research on deviance detection and regularity sensitivity in dissociated neuronal cultures.',
    excerptJa: 'Zhang らによる培養神経回路における逸脱検出と規則性感度に関する研究が掲載されました。',
    link: 'https://doi.org/10.3389/fncir.2025.1584322',
  },
  {
    id: 'news-2025-06-plos',
    title: 'PLOS Biology paper on prediction error neurons',
    titleJa: '予測誤差ニューロンに関する論文がPLOS Biologyに掲載',
    date: '2025-06-18',
    category: 'publication',
    excerpt: 'Yaron et al. identified neurons that encode negative prediction errors responding to omissions in predictable sound sequences.',
    excerptJa: 'Yaronらが予測可能な音列における省略に応答する負の予測誤差をコードするニューロンを同定しました。',
    link: 'https://doi.org/10.1371/journal.pbio.3003242',
  },
  {
    id: 'news-2025-06-frontiers',
    title: 'Review published on neuronal cultures as model systems for prediction',
    titleJa: '予測のモデルシステムとしての神経培養に関するレビューが掲載',
    date: '2025-06-25',
    category: 'publication',
    excerpt: 'Yaron et al. published a review examining how dissociated neuronal cultures exhibit predictive coding capabilities.',
    excerptJa: 'Yaronらが培養神経回路の予測符号化能力に関するレビュー論文を発表しました。',
    link: 'https://doi.org/10.3389/fncir.2025.1568652',
  },
  {
    id: 'news-2025-frontiers-vns',
    title: 'Papers on VNS as predictive coding modulator published',
    titleJa: '予測符号化モジュレーターとしてのVNSに関する論文が掲載',
    date: '2025-05-15',
    category: 'publication',
    excerpt: 'Two papers by Kumagai et al. and Shiramatsu et al. on vagus nerve stimulation effects published in Frontiers in Neural Circuits.',
    excerptJa: '熊谷らと白松らによる迷走神経刺激効果に関する2本の論文がFrontiers in Neural Circuitsに掲載されました。',
    link: 'https://doi.org/10.3389/fncir.2025.1568655',
  },
  // 2024
  {
    id: 'news-2024-12-siggraph',
    title: 'Media art "Online Chat with Living Neuronal Cultures" at SIGGRAPH Asia',
    titleJa: 'SIGGRAPH Asiaでメディアアート「生きた神経培養とのオンラインチャット」を発表',
    date: '2024-12-05',
    category: 'event',
    excerpt: 'Mayama, Akita, Kawakami and Takahashi presented interactive media art connecting audiences with living neuronal cultures at SIGGRAPH ASIA Tokyo 2024.',
    excerptJa: '間山、秋田、川上、高橋がSIGGRAPH ASIA Tokyo 2024で生きた神経培養と観客をつなぐインタラクティブなメディアアートを発表しました。',
  },
  {
    id: 'news-2024-08-newton',
    title: 'Featured in Newton magazine special on intelligence',
    titleJa: 'Newton誌の知能特集で紹介',
    date: '2024-08-01',
    category: 'media',
    excerpt: 'Prof. Takahashi was featured in the August 2024 issue of Newton magazine discussing "What is Intelligence?" from a neuroscience perspective.',
    excerptJa: '高橋教授がNewton 2024年8月号「知能とは何か」特集で神経科学の視点から解説しました。',
  },
  {
    id: 'news-2024-07-embc',
    title: 'Two papers presented at IEEE EMBC 2024',
    titleJa: 'IEEE EMBC 2024で2件の発表',
    date: '2024-07-17',
    category: 'event',
    excerpt: 'Oshima et al. presented on fear conditioning in schizophrenia models, and Shiramatsu et al. on heartbeat-evoked potentials in rats.',
    excerptJa: '大島らが統合失調症モデルの恐怖条件付け、白松らがラットの心拍誘発電位について発表しました。',
  },
  {
    id: 'news-2024-05-ai',
    title: 'Invited talk at UTokyo AI Center Symposium',
    titleJa: '東大AIセンターシンポジウムで招待講演',
    date: '2024-05-26',
    category: 'event',
    excerpt: 'Prof. Takahashi gave an invited talk at the 16th UTokyo AI Center Continuous Symposium.',
    excerptJa: '高橋教授が第16回東京大学AIセンター連続シンポジウムで招待講演を行いました。',
  },
  {
    id: 'news-2024-02-hbm',
    title: 'Invited lecture on AI seizure diagnosis at JHBM',
    titleJa: '日本ヒト脳機能マッピング学会でAI発作診断について招待講演',
    date: '2024-02-23',
    category: 'event',
    excerpt: 'Prof. Takahashi delivered an invited lecture on "Automatic diagnosis of epileptic seizures by AI" at the 26th meeting of the Japan Human Brain Mapping Society.',
    excerptJa: '高橋教授が第26回日本ヒト脳機能マッピング学会で「AIによるてんかん発作の自動診断」について招待講演を行いました。',
  },
  {
    id: 'news-2024-01-frontiers',
    title: 'Paper on map plasticity following noise exposure',
    titleJa: '騒音曝露後のマップ可塑性に関する論文が掲載',
    date: '2024-01-15',
    category: 'publication',
    excerpt: 'Wake et al. published research on auditory cortex map plasticity following noise exposure in Frontiers in Neuroscience.',
    excerptJa: '和氣らによる騒音曝露後の聴覚皮質マップ可塑性に関する研究がFrontiers in Neuroscienceに掲載されました。',
    link: 'https://doi.org/10.3389/fnins.2024.1385942',
  },
  {
    id: 'news-2024-01-cerebral',
    title: 'Paper on stochastic resonance in Cerebral Cortex',
    titleJa: '確率共鳴に関する論文がCerebral Cortexに掲載',
    date: '2024-01-10',
    category: 'publication',
    excerpt: 'Noda & Takahashi published research on stochastic resonance in sparse neuronal networks.',
    excerptJa: '野田・高橋による疎な神経ネットワークにおける確率共鳴に関する研究が掲載されました。',
    link: 'https://doi.org/10.1093/cercor/bhad428',
  },
  // 2023
  {
    id: 'news-2023-11-jcns',
    title: 'Educational lecture and symposium at JSCN Annual Meeting',
    titleJa: '日本臨床神経生理学会で教育講演・シンポジウム',
    date: '2023-11-30',
    category: 'event',
    excerpt: 'Prof. Takahashi gave an educational lecture on "Effects of VNS on thalamo-cortical neural activity" and a symposium talk on VNS and predictive coding.',
    excerptJa: '高橋教授が「視床-大脳皮質の神経活動に対する迷走神経刺激の影響」について教育講演、VNSと予測符号化についてシンポジウム発表を行いました。',
  },
  {
    id: 'news-2023-09-brainstim',
    title: 'Paper on VNS-induced oscillatory modulation in Brain Stimulation',
    titleJa: 'VNS誘発振動変調に関する論文がBrain Stimulationに掲載',
    date: '2023-09-25',
    category: 'publication',
    excerpt: 'Kumagai et al. published research on frequency-specific modulation of oscillatory activity by vagus nerve stimulation.',
    excerptJa: '熊谷らによる迷走神経刺激による周波数特異的な振動活動変調に関する研究が掲載されました。',
    link: 'https://doi.org/10.1016/j.brs.2023.09.019',
  },
  {
    id: 'news-2023-07-embc',
    title: 'Presentations at IEEE EMBC 2023',
    titleJa: 'IEEE EMBC 2023で発表',
    date: '2023-07-25',
    category: 'event',
    excerpt: 'Lab members presented on neural information processing capacity and effects of music on social bonding in rats.',
    excerptJa: '研究室メンバーが神経情報処理能力とラットの社会的絆に対する音楽の影響について発表しました。',
  },
  {
    id: 'news-2023-04-akita',
    title: 'Dr. Dai Akita joins as Assistant Professor',
    titleJa: '秋田大助教が着任',
    date: '2023-04-01',
    category: 'announcement',
    excerpt: 'We welcome Dr. Dai Akita who joins the lab as Assistant Professor.',
    excerptJa: '秋田大助教が研究室に着任しました。',
  },
  // 2022
  {
    id: 'news-2022-11-science',
    title: 'Rats bop to the beat - Science Advances publication goes viral',
    titleJa: 'ラットがビートに合わせて頭を振る - Science Advances論文が世界的に話題に',
    date: '2022-11-11',
    category: 'publication',
    excerpt: 'Our discovery that rats spontaneously synchronize to musical beats was published in Science Advances and covered by major media worldwide including BBC, CNN, The Guardian, and NHK.',
    excerptJa: 'ラットが音楽のビートに自発的に同期するという発見がScience Advancesに掲載され、BBC、CNN、The Guardian、NHKなど世界の主要メディアで報道されました。',
    link: 'https://doi.org/10.1126/sciadv.abo7019',
    image: 'https://www.u-tokyo.ac.jp/focus/ja/press/z0508_00262.html',
  },
  {
    id: 'news-2022-kodansha',
    title: 'Book published: "Life Intelligence and Artificial Intelligence"',
    titleJa: '書籍『生命知能と人工知能』出版',
    date: '2022-03-15',
    category: 'media',
    excerpt: 'Prof. Takahashi published a book on the relationship between biological and artificial intelligence (Kodansha).',
    excerptJa: '高橋教授が生命知能と人工知能の関係についての書籍を講談社から出版しました。',
  },
];

export const newsCategories = ['all', 'publication', 'award', 'event', 'media', 'announcement'] as const;

export const categoryLabels: Record<string, { en: string; ja: string; color: string }> = {
  publication: { en: 'Publication', ja: '論文', color: 'cyan' },
  award: { en: 'Award', ja: '受賞', color: 'magenta' },
  event: { en: 'Event', ja: 'イベント', color: 'purple' },
  media: { en: 'Media', ja: 'メディア', color: 'amber' },
  announcement: { en: 'Announcement', ja: 'お知らせ', color: 'green' },
};
