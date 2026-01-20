export interface Member {
  id: string;
  name: string;
  nameJa: string;
  role: string;
  roleJa: string;
  image?: string;
  email?: string;
  bio: string;
  bioJa: string;
  links?: {
    researchmap?: string;
    googleScholar?: string;
    orcid?: string;
    website?: string;
    loop?: string;
  };
  research?: string[];
  education?: string[];
  awards?: string[];
}

export const members: Member[] = [
  {
    id: 'takahashi',
    name: 'Hirokazu Takahashi',
    nameJa: '高橋 宏知',
    role: 'Professor (Principal Investigator)',
    roleJa: '教授（研究室主宰者）',
    image: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_takahashi_t-qkjq5n5l2xpr4rmajni215jz7tvzbkr4ffnd7lr8sw.jpg',
    email: 'takahashi@i.u-tokyo.ac.jp',
    bio: 'Professor at the Research Center for Advanced Science and Technology (RCAST) and Department of Mechano-Informatics, Graduate School of Information Science and Technology. His research aims to "reverse engineer" the brain, focusing on neural computation in the cerebral cortex using high-density microelectrode arrays. His approach spans multiple scales: dissociated neuronal cultures in petri dishes (in vitro), thalamo-cortical auditory systems in rodents (in vivo), and cerebral cortex in humans (clinical studies). His notable research revealed that rats can move their heads to the beat of music, demonstrating innate beat synchronization in animals.',
    bioJa: '東京大学先端科学技術研究センター・情報理工学系研究科機械情報学専攻 教授。脳を「逆行設計」することを目指し、高密度マイクロ電極アレイを用いて大脳皮質の神経計算を研究。培養神経回路（in vitro）、げっ歯類の視床-皮質聴覚系（in vivo）、ヒトの大脳皮質（臨床研究）の複数スケールで研究を展開。ラットが音楽のビートに合わせて頭を動かせることを発見し、動物における生得的なビート同期能力を実証した研究で知られる。',
    links: {
      researchmap: 'https://researchmap.jp/hirokazu_takahashi',
      loop: 'https://loop.frontiersin.org/people/336440/overview',
    },
    research: [
      'Neural computation in cerebral cortex',
      'High-density microelectrode arrays',
      'Brain-computer interfaces',
      'Auditory neuroscience',
      'Reservoir computing with neural cultures',
      'Self-organized criticality',
      'Beat synchronization',
    ],
  },
  {
    id: 'shiramatsu',
    name: 'Tomoyo Isoguchi Shiramatsu',
    nameJa: '白松（磯口）知世',
    role: 'Associate Professor',
    roleJa: '准教授',
    image: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_shiramatsu_t-qkjq5m7qw3ogt5nnp53fgnsimg0m3vne3azvqbsmz4.jpg',
    email: 't.shiramatsu@i.u-tokyo.ac.jp',
    bio: 'Associate Professor at the Department of Mechano-Informatics. Her research focuses on how sensory information is represented in the brain, with particular interest in auditory neuroscience, music perception, rhythm processing, and critical periods in neural development. She investigates whether information processing mechanisms for chords and rhythms are innate or developmentally acquired, exploring brain properties as they relate to acoustic perception and social bonding through synchronized movement.',
    bioJa: '機械情報学専攻 准教授。感覚情報が脳でどのように表現されるかを研究。特に聴覚神経科学、音楽知覚、リズム処理、神経発達における臨界期に興味を持つ。和音やリズムの情報処理メカニズムが生得的か発達的に獲得されるかを調査し、音響知覚や同期運動による社会的絆に関連する脳の特性を探求している。',
    links: {
      researchmap: 'https://researchmap.jp/Tomoyo-I-Shiramatsu',
    },
    research: [
      'Auditory neuroscience',
      'Music and rhythm perception',
      'Critical periods in development',
      'Sensory information processing',
      'Sound perception',
      'Social bonding through synchronized movement',
    ],
    education: [
      'Ph.D. in Mechano-Informatics, University of Tokyo (2014)',
      'M.S. in Mechano-Informatics, University of Tokyo (2011)',
      'B.S. in Mechano-Informatics, University of Tokyo (2009)',
    ],
    awards: [
      'Funai Research Encouragement Prize (2017)',
    ],
  },
];

export const staff: Member[] = [
  {
    id: 'akita',
    name: 'Dai Akita',
    nameJa: '秋田 大',
    role: 'Assistant Professor',
    roleJa: '助教',
    email: 'd.akita@i.u-tokyo.ac.jp',
    bio: 'Assistant Professor focusing on neural engineering and brain-computer interface research.',
    bioJa: '神経工学とブレイン・コンピュータ・インタフェースの研究に従事する助教。',
  },
  {
    id: 'fukayama',
    name: 'Osamu Fukayama',
    nameJa: '深山 理',
    role: 'Technical Specialist',
    roleJa: '技術専門職員',
    email: 'o.fukayama@i.u-tokyo.ac.jp',
    bio: 'Technical specialist supporting laboratory equipment and experimental setups.',
    bioJa: '実験装置と実験セットアップを支援する技術専門職員。',
  },
  {
    id: 'yaron',
    name: 'Amit Yaron',
    nameJa: 'アミット・ヤロン',
    role: 'Postdoctoral Fellow',
    roleJa: '特任研究員',
    email: 'a.yaron@i.u-tokyo.ac.jp',
    bio: 'Postdoctoral researcher contributing to neural computation and brain-computer interface projects.',
    bioJa: '神経計算とブレイン・コンピュータ・インタフェースプロジェクトに貢献する特任研究員。',
  },
  {
    id: 'honda',
    name: 'Natsue Honda',
    nameJa: '本田 夏江',
    role: 'Technical Assistant',
    roleJa: '技術補佐員',
    email: 'n.honda@i.u-tokyo.ac.jp',
    bio: 'Technical assistant supporting daily laboratory operations.',
    bioJa: '日常の研究室運営を支援する技術補佐員。',
  },
  {
    id: 'tominaga',
    name: 'Mariko Tominaga',
    nameJa: '富永 真理子',
    role: 'Secretary',
    roleJa: '秘書',
    email: 'secretary@i.u-tokyo.ac.jp',
    bio: 'Laboratory secretary handling administrative tasks and coordination.',
    bioJa: '事務作業と調整を担当する研究室秘書。',
  },
];

export const students: Member[] = [
  // D3 (Doctoral 3rd year)
  {
    id: 'khan',
    name: 'Usman Abid Khan',
    nameJa: 'ウスマン・アビド・カーン',
    role: 'Ph.D. Student (D3)',
    roleJa: '博士課程3年',
    bio: 'Doctoral student researching neural signal processing.',
    bioJa: '神経信号処理を研究する博士課程学生。',
  },
  {
    id: 'kabe',
    name: 'Yasuo Kabe',
    nameJa: '加部 泰生',
    role: 'Ph.D. Student (D3)',
    roleJa: '博士課程3年',
    bio: 'Doctoral student working on brain-computer interfaces.',
    bioJa: 'ブレイン・コンピュータ・インタフェースに取り組む博士課程学生。',
  },
  {
    id: 'zhang-z',
    name: 'Zhuo Zhang',
    nameJa: '張 倬',
    role: 'Ph.D. Student (D3)',
    roleJa: '博士課程3年',
    bio: 'Doctoral student researching deviance detection and regularity sensitivity in dissociated neuronal cultures. His work explores predictive coding mechanisms in primitive neural networks.',
    bioJa: '培養神経回路における逸脱検出と規則性感度を研究する博士課程学生。原始的な神経ネットワークにおける予測符号化メカニズムを探求している。',
  },
  // D2 (Doctoral 2nd year)
  {
    id: 'oshima',
    name: 'Karin Oshima',
    nameJa: '大島 果林',
    role: 'Ph.D. Student (D2)',
    roleJa: '博士課程2年',
    bio: 'Doctoral student researching music perception, social behavior, and fear conditioning. Her work includes studying the effect of music on social bonding between rats.',
    bioJa: '音楽知覚、社会行動、恐怖条件付けを研究する博士課程学生。ラット間の社会的絆に対する音楽の影響についても研究している。',
  },
  {
    id: 'iizuka',
    name: 'Riko Iizuka',
    nameJa: '飯塚 理子',
    role: 'Ph.D. Student (D2)',
    roleJa: '博士課程2年',
    bio: 'Doctoral student focusing on neural plasticity.',
    bioJa: '神経可塑性に焦点を当てる博士課程学生。',
  },
  // D1 (Doctoral 1st year)
  {
    id: 'zhang-h',
    name: 'He Zhang',
    nameJa: '張 赫',
    role: 'Ph.D. Student (D1)',
    roleJa: '博士課程1年',
    bio: 'Doctoral student working on neural network analysis.',
    bioJa: 'ニューラルネットワーク解析に取り組む博士課程学生。',
  },
  {
    id: 'xu',
    name: 'Hexin Xu',
    nameJa: '徐 和馨',
    role: 'Ph.D. Student (D1)',
    roleJa: '博士課程1年',
    bio: 'Doctoral student researching reservoir computing.',
    bioJa: 'リザバーコンピューティングを研究する博士課程学生。',
  },
  {
    id: 'yamaki',
    name: 'Ryota Yamaki',
    nameJa: '山木 亮太',
    role: 'Ph.D. Student (D1)',
    roleJa: '博士課程1年',
    bio: 'Doctoral student studying cortical dynamics.',
    bioJa: '皮質ダイナミクスを研究する博士課程学生。',
  },
  // M2 (Master's 2nd year)
  {
    id: 'onuma',
    name: 'Yosuke Onuma',
    nameJa: '大沼 洋介',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student researching neural interfaces.',
    bioJa: '神経インタフェースを研究する修士課程学生。',
  },
  {
    id: 'kawakami',
    name: 'Kou Kawakami',
    nameJa: '川上 航',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student working on auditory cortex mapping.',
    bioJa: '聴覚皮質マッピングに取り組む修士課程学生。',
  },
  {
    id: 'kawahara',
    name: 'Yuta Kawahara',
    nameJa: '川原 雄太',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student studying neural signal processing.',
    bioJa: '神経信号処理を研究する修士課程学生。',
  },
  {
    id: 'shimizu',
    name: 'Sota Shimizu',
    nameJa: '清水 颯太',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student researching brain-machine interfaces.',
    bioJa: 'ブレイン・マシン・インタフェースを研究する修士課程学生。',
  },
  {
    id: 'takehana',
    name: 'Kazushi Takehana',
    nameJa: '竹花 一志',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student working on neural computation.',
    bioJa: '神経計算に取り組む修士課程学生。',
  },
  {
    id: 'hoshino',
    name: 'Arisa Hoshino',
    nameJa: '星野 有紗',
    role: "Master's Student (M2)",
    roleJa: '修士課程2年',
    bio: 'Master\'s student studying auditory neuroscience.',
    bioJa: '聴覚神経科学を研究する修士課程学生。',
  },
  // M1 (Master's 1st year)
  {
    id: 'iketani',
    name: 'Kento Iketani',
    nameJa: '池谷 健人',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student beginning research in neural engineering.',
    bioJa: '神経工学の研究を始める修士課程学生。',
  },
  {
    id: 'kaneko',
    name: 'Shunichiro Kaneko',
    nameJa: '金子 駿一郎',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student exploring brain-computer interfaces.',
    bioJa: 'ブレイン・コンピュータ・インタフェースを探求する修士課程学生。',
  },
  {
    id: 'kamatani',
    name: 'Issei Kamatani',
    nameJa: '鎌谷 一誠',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student working on neural data analysis.',
    bioJa: '神経データ解析に取り組む修士課程学生。',
  },
  {
    id: 'mayama',
    name: 'Teruki Mayama',
    nameJa: '間山 輝樹',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student researching cortical processing.',
    bioJa: '皮質処理を研究する修士課程学生。',
  },
  {
    id: 'lim',
    name: 'Chehyeon Lim',
    nameJa: 'リム・チェヒョン',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student studying neural networks.',
    bioJa: 'ニューラルネットワークを研究する修士課程学生。',
  },
  {
    id: 'kim',
    name: 'Junmo Kim',
    nameJa: 'キム・ジュンモ',
    role: "Master's Student (M1)",
    roleJa: '修士課程1年',
    bio: 'Master\'s student exploring auditory processing.',
    bioJa: '聴覚処理を探求する修士課程学生。',
  },
];

export const undergraduates: Member[] = [
  {
    id: 'abe',
    name: 'Hiyuga Abe',
    nameJa: '阿部 日向',
    role: 'Undergraduate (B4)',
    roleJa: '学部4年',
    bio: 'Undergraduate student working on graduation research.',
    bioJa: '卒業研究に取り組む学部生。',
  },
  {
    id: 'ikoma',
    name: 'Hinata Ikoma',
    nameJa: '生駒 陽向',
    role: 'Undergraduate (B4)',
    roleJa: '学部4年',
    bio: 'Undergraduate student conducting research in neural engineering.',
    bioJa: '神経工学の研究を行う学部生。',
  },
  {
    id: 'shinobu',
    name: 'Yukihiko Shinobu',
    nameJa: '忍 幸彦',
    role: 'Undergraduate (B4)',
    roleJa: '学部4年',
    bio: 'Undergraduate student exploring brain-computer interfaces.',
    bioJa: 'ブレイン・コンピュータ・インタフェースを探求する学部生。',
  },
  {
    id: 'shibasaki',
    name: 'Yuta Shibasaki',
    nameJa: '柴崎 雄太',
    role: 'Undergraduate (B4)',
    roleJa: '学部4年',
    bio: 'Undergraduate student researching neural computation.',
    bioJa: '神経計算を研究する学部生。',
  },
  {
    id: 'yaginuma',
    name: 'Taiki Yaginuma',
    nameJa: '柳沼 大樹',
    role: 'Undergraduate (B4)',
    roleJa: '学部4年',
    bio: 'Undergraduate student working on auditory processing.',
    bioJa: '聴覚処理に取り組む学部生。',
  },
];

export const visitors: Member[] = [
  {
    id: 'kumagai',
    name: 'Shinichi Kumagai',
    nameJa: '熊谷 慎一',
    role: 'Visiting Researcher',
    roleJa: '客員研究員',
    bio: 'Visiting researcher from Jichi Medical University, studying vagus nerve stimulation effects on cortical activity.',
    bioJa: '自治医科大学からの客員研究員。迷走神経刺激が皮質活動に与える影響を研究。',
  },
  {
    id: 'cantegrel',
    name: 'Thaïs Cantegrel',
    nameJa: 'タイス・カンテグレル',
    role: 'Exchange Student (CentraleSupélec)',
    roleJa: '交換留学生（CentraleSupélec）',
    bio: 'Exchange student from CentraleSupélec, France (April-September 2025).',
    bioJa: 'フランスCentraleSupélecからの交換留学生（2025年4月-9月）。',
  },
  {
    id: 'flores',
    name: 'Montse Flores Garcia',
    nameJa: 'モンセ・フローレス・ガルシア',
    role: 'Exchange Student (Universitat de Barcelona)',
    roleJa: '交換留学生（バルセロナ大学）',
    bio: 'Exchange student from Universitat de Barcelona, Spain (September-December 2025).',
    bioJa: 'スペイン・バルセロナ大学からの交換留学生（2025年9月-12月）。',
  },
];

export const alumni: Member[] = [
  // 2024 Graduates
  {
    id: 'ishida-n',
    name: 'Naoki Ishida',
    nameJa: '石田 直輝',
    role: 'M.S. 2023',
    roleJa: '修士 2023年修了',
    bio: 'Research on reservoir computing and information processing capacity in the auditory cortex.',
    bioJa: 'リザバーコンピューティングと聴覚皮質における情報処理能力の研究。',
  },
  {
    id: 'suwa',
    name: 'Eisuke Suwa',
    nameJa: '諏訪 瑛介',
    role: 'M.S. 2023',
    roleJa: '修士 2023年修了',
    bio: 'Research on neural activity and information processing capacity of neuronal culture.',
    bioJa: '培養神経回路の神経活動と情報処理能力の研究。',
  },
  // 2022 Graduates
  {
    id: 'ito-y',
    name: 'Yoshiki Ito',
    nameJa: '伊藤 圭基',
    role: 'M.S. 2021',
    roleJa: '修士 2021年修了',
    bio: 'First author of the Science Advances paper on spontaneous beat synchronization in rats.',
    bioJa: 'ラットの自発的ビート同期に関するScience Advances論文の筆頭著者。',
  },
  {
    id: 'kubota',
    name: 'Tomoyuki Kubota',
    nameJa: '窪田 智之',
    role: 'Ph.D. 2021',
    roleJa: '博士 2021年修了',
    bio: 'Research on reservoir computing and information processing theory. Published in Physical Review Research.',
    bioJa: 'リザバーコンピューティングと情報処理理論の研究。Physical Review Researchに論文発表。',
  },
  {
    id: 'mita',
    name: 'Takeshi Mita',
    nameJa: '三田 毅',
    role: 'Ph.D. 2019',
    roleJa: '博士 2019年修了',
    bio: 'Research on network bursts and neural autopoiesis in cultured neuronal networks.',
    bioJa: '培養神経回路におけるネットワークバーストと神経オートポイエーシスの研究。',
  },
  {
    id: 'ishizu',
    name: 'Kotaro Ishizu',
    nameJa: '石津 光太郎',
    role: 'Ph.D. 2019',
    roleJa: '博士 2019年修了',
    bio: 'Research on information flow in the thalamo-cortical system.',
    bioJa: '視床-皮質系における情報フローの研究。',
  },
  {
    id: 'yada',
    name: 'Yuichiro Yada',
    nameJa: '矢田 祐一朗',
    role: 'Ph.D.',
    roleJa: '博士修了',
    bio: 'Pioneer of physical reservoir computing with living neuronal cultures. Multiple publications in Applied Physics Letters.',
    bioJa: '培養神経回路を用いた物理リザバーコンピューティングの先駆者。Applied Physics Lettersに複数の論文発表。',
  },
  {
    id: 'wake',
    name: 'Naoki Wake',
    nameJa: '和氣 直樹',
    role: 'Ph.D.',
    roleJa: '博士修了',
    bio: 'Research on auditory cortex plasticity, tinnitus models, and tonotopic organization.',
    bioJa: '聴覚皮質可塑性、耳鳴りモデル、トノトピック構造の研究。',
  },
  {
    id: 'noda',
    name: 'Takahiro Noda',
    nameJa: '野田 崇啓',
    role: 'Ph.D.',
    roleJa: '博士修了',
    bio: 'Research on auditory stream segregation, stochastic resonance, and cortical oscillations.',
    bioJa: '聴覚ストリーム分離、確率共鳴、皮質振動の研究。',
  },
];
