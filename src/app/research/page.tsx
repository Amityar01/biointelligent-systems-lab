import { getHomepageSettings } from '@/lib/content';
import ResearchPageClient from './ResearchPageClient';

interface BilingualText {
  en: string;
  ja: string;
}

interface Finding {
  title: BilingualText;
  desc: BilingualText;
  paper: string;
}

interface ResearchArea {
  id: string;
  scale: BilingualText;
  color: string;
  title: BilingualText;
  question: BilingualText;
  image: string;
  description: BilingualText;
  findings: Finding[];
  topics: BilingualText[];
}

interface Methodology {
  title: BilingualText;
  desc: BilingualText;
  detail: BilingualText;
}

function getResearchAreas(settings: ReturnType<typeof getHomepageSettings>): ResearchArea[] {
  const researchImages = settings?.research_images || {
    cultures: { main: '/uploads/scraped/neuronal-culture.jpg', secondary: '/uploads/scraped/cmos-array.jpg' },
    auditory: { main: '/uploads/scraped/lab-visualization.jpg', secondary: '/uploads/scraped/waveform.jpg' },
    clinical: { main: '/uploads/scraped/ecog-electrode.jpg', secondary: '/uploads/scraped/microelectrode-arrays.jpg' },
  };

  return [
    {
      id: 'emergence',
      scale: { en: 'In Vitro', ja: '培養（in vitro）' },
      color: 'var(--accent)',
      title: { en: 'Emergent Computing', ja: '創発計算' },
      question: {
        en: 'How does intelligence emerge from self-organizing neurons?',
        ja: '自己組織化する神経回路から知能はどのように創発するのか？',
      },
      image: researchImages.cultures.main,
      description: {
        en: 'We study how living neuronal cultures perform computation. Using high-density CMOS arrays with 10,000+ recording sites, we observe how networks self-organize to the edge of criticality and implement reservoir computing.',
        ja: '生きた培養神経回路がどのように計算を行うのかを研究します。10,000点以上の記録サイトを備えた高密度CMOSアレイを用い、ネットワークが臨界点の縁へ自己組織化し、リザバー計算を実装する過程を観測します。',
      },
      findings: [
        {
          title: { en: 'Physical Reservoir Computing', ja: '物理リザバー計算' },
          desc: {
            en: 'Implemented FORCE learning in living neuronal cultures, demonstrating that biological neural networks can be trained as computational reservoirs.',
            ja: '生きた培養神経回路にFORCE学習を実装し、生物神経ネットワークが計算リザバーとして訓練可能であることを示しました。',
          },
          paper: 'Applied Physics Letters, 2021',
        },
        {
          title: { en: 'Self-Organized Criticality', ja: '自己組織化臨界性' },
          desc: {
            en: 'Discovered that noise combined with spike-timing plasticity is sufficient for neural networks to reach criticality and E/I balance.',
            ja: 'ノイズとスパイクタイミング依存可塑性（STDP）の組み合わせだけで、ネットワークが臨界性と興奮/抑制バランスに到達することを明らかにしました。',
          },
          paper: 'Applied Physics Letters, 2023',
        },
        {
          title: { en: 'Deviance Detection in Cultures', ja: '培養回路での逸脱検出' },
          desc: {
            en: 'Found that even simple cultures show complex temporal processing—challenging the view that hierarchical networks are required.',
            ja: '単純な培養回路でも複雑な時間情報処理（逸脱検出）を示すことを発見し、階層ネットワークが必須という見方に一石を投じました。',
          },
          paper: 'Frontiers in Neuroscience, 2025',
        },
      ],
      topics: [
        { en: 'Reservoir computing with living neurons', ja: '生きた神経回路によるリザバー計算' },
        { en: 'Self-organized criticality', ja: '自己組織化臨界性' },
        { en: 'Information processing capacity', ja: '情報処理容量' },
        { en: 'Bio-silicon hybrid sensors', ja: 'バイオ・シリコンハイブリッドセンサー' },
      ],
    },
    {
      id: 'auditory',
      scale: { en: 'In Vivo', ja: '生体（in vivo）' },
      color: 'var(--accent)',
      title: { en: 'Auditory Processing', ja: '聴覚情報処理' },
      question: {
        en: 'How does the brain represent sound, music, and prediction?',
        ja: '脳は音・音楽・予測をどのように表現するのか？',
      },
      image: researchImages.auditory.main,
      description: {
        en: 'We investigate neural coding in the rodent thalamo-cortical auditory system—from basic tonotopy to complex phenomena like beat synchronization and predictive coding through mismatch negativity.',
        ja: 'げっ歯類の視床—皮質聴覚系における神経符号化を研究します。基本的な音のトノトピーから、ビート同期やミスマッチ陰性電位（MMN）による予測符号化までを扱います。',
      },
      findings: [
        {
          title: { en: 'Beat Synchronization in Rats', ja: 'ラットのビート同期' },
          desc: {
            en: 'First evidence of innate beat synchronization in animals. Rats bob their heads to music at 120-140 BPM—the same tempo humans prefer.',
            ja: '動物における生得的ビート同期の初めての証拠。ラットは人が好む120〜140 BPMのテンポで音楽に合わせて頭を振ります。',
          },
          paper: 'Science Advances, 2022',
        },
        {
          title: { en: 'Negative Prediction Error Neurons', ja: '負の予測誤差ニューロン' },
          desc: {
            en: 'Identified neurons that encode prediction errors when expected sounds are omitted, revealing the neural basis of predictive coding.',
            ja: '予測された音が欠落したときの予測誤差を符号化するニューロンを同定し、予測符号化の神経基盤を明らかにしました。',
          },
          paper: 'PLOS Biology, 2025',
        },
        {
          title: { en: 'Brain as Physical Reservoir', ja: '脳を物理リザバーとして捉える' },
          desc: {
            en: 'Quantified the information processing capacity of living auditory cortex, finding optimal computation at 10-18ms timescales.',
            ja: '生きた聴覚皮質の情報処理容量を定量化し、10〜18 msの時間スケールで計算が最適になることを示しました。',
          },
          paper: 'Applied Physics Letters, 2023',
        },
      ],
      topics: [
        { en: 'Mismatch negativity & predictive coding', ja: 'ミスマッチ陰性電位と予測符号化' },
        { en: 'Beat synchronization & rhythm', ja: 'ビート同期とリズム' },
        { en: 'Tonotopic organization', ja: 'トノトピー構造' },
        { en: 'Auditory cortex plasticity', ja: '聴覚皮質の可塑性' },
      ],
    },
    {
      id: 'clinical',
      scale: { en: 'Clinical', ja: '臨床' },
      color: 'var(--accent)',
      title: { en: 'Neuromodulation', ja: '神経変調' },
      question: {
        en: 'Can we modulate brain function to treat disease?',
        ja: '脳機能を変調して疾患を治療できるか？',
      },
      image: researchImages.clinical.main,
      description: {
        en: 'We develop vagus nerve stimulation (VNS) approaches and study neural dynamics in epilepsy. Our work reveals how neuromodulation affects the balance between feedforward and feedback processing in the brain.',
        ja: '迷走神経刺激（VNS）の手法を開発し、てんかんにおける神経ダイナミクスを研究します。神経変調が前向き（feedforward）/後向き（feedback）処理のバランスにどう影響するかを明らかにします。',
      },
      findings: [
        {
          title: { en: 'VNS Frequency Effects', ja: 'VNS周波数の効果' },
          desc: {
            en: 'VNS increases gamma/beta (feedforward) via cholinergic pathways and decreases theta (feedback) via noradrenergic pathways.',
            ja: 'VNSはコリン作動性経路を介してγ/β（前向き）成分を増加させ、ノルアドレナリン作動性経路を介してθ（後向き）成分を減少させます。',
          },
          paper: 'Brain Stimulation, 2023',
        },
        {
          title: { en: 'Stochastic Resonance', ja: '確率共鳴' },
          desc: {
            en: 'Explained the paradox of why awake cortex has more noise but better weak signal detection through stochastic resonance.',
            ja: '覚醒状態の皮質はノイズが多いにもかかわらず弱い信号検出が優れるという逆説を、確率共鳴により説明しました。',
          },
          paper: 'Cerebral Cortex, 2024',
        },
      ],
      topics: [
        { en: 'Vagus nerve stimulation', ja: '迷走神経刺激（VNS）' },
        { en: 'Epilepsy dynamics & prediction', ja: 'てんかんダイナミクスと予測' },
        { en: 'Feedforward vs feedback processing', ja: '前向き/後向き処理のバランス' },
        { en: 'Clinical neural interfaces', ja: '臨床神経インタフェース' },
      ],
    },
    {
      id: 'theory',
      scale: { en: 'Theoretical', ja: '理論' },
      color: 'var(--accent)',
      title: { en: 'Neural Computation Theory', ja: '神経計算理論' },
      question: {
        en: 'What are the mathematical principles of brain function?',
        ja: '脳機能の数理原理とは何か？',
      },
      image: '/uploads/scraped/research-diagram.png',
      description: {
        en: 'We develop theoretical frameworks to understand how physical neural dynamics translate into information processing. Our work bridges the gap between biological reality and computational theory.',
        ja: '物理的な神経ダイナミクスが情報処理へ変換される仕組みを理解するための理論枠組みを構築します。生物学的実在と計算理論のギャップを橋渡しします。',
      },
      findings: [
        {
          title: { en: 'Information Processing Capacity (IPC)', ja: '情報処理容量（IPC）' },
          desc: {
            en: 'Quantified the "memory" and "computation" capacity of living neuronal networks, finding they operate at an optimal edge of chaos.',
            ja: '生きた神経ネットワークの「記憶」と「計算」容量を定量化し、カオスの縁で最適に動作することを示しました。',
          },
          paper: 'Applied Physics Letters, 2023',
        },
        {
          title: { en: 'Stochastic Resonance', ja: '確率共鳴' },
          desc: {
            en: 'Demonstrated how noise in the brain paradoxically improves the detection of weak signals, suggesting a functional role for spontaneous activity.',
            ja: '脳内ノイズが弱い信号の検出を逆説的に改善することを示し、自発活動の機能的役割を示唆しました。',
          },
          paper: 'Cerebral Cortex, 2024',
        },
        {
          title: { en: 'Free Energy Principle & Autopoiesis', ja: '自由エネルギー原理とオートポイエーシス' },
          desc: {
            en: 'Exploring how neural networks maintain their own organization (autopoiesis) and minimize prediction error (free energy) to survive.',
            ja: '神経ネットワークが自己組織性（オートポイエーシス）を保ち、予測誤差（自由エネルギー）を最小化しながら生存する仕組みを探究しています。',
          },
          paper: 'Artificial Life, 2020',
        },
      ],
      topics: [
        { en: 'Reservoir Computing Theory', ja: 'リザバー計算理論' },
        { en: 'Information Processing Capacity', ja: '情報処理容量' },
        { en: 'Stochastic Resonance', ja: '確率共鳴' },
        { en: 'Free Energy Principle', ja: '自由エネルギー原理' },
      ],
    },
  ];
}

const methodologies: Methodology[] = [
  {
    title: { en: 'CMOS Arrays', ja: 'CMOSアレイ' },
    desc: { en: 'High-density recording with 10,000+ sites in 2×2mm²', ja: '2×2mm²に10,000点以上の高密度記録' },
    detail: { en: 'Collaboration with ETH Zurich & Maxwell Biosystems', ja: 'ETH Zurich・Maxwell Biosystemsとの共同開発' },
  },
  {
    title: { en: 'Information Theory', ja: '情報理論' },
    desc: { en: 'Transfer entropy, IPC, and neural coding analysis', ja: '転送エントロピー、IPC、神経符号化解析' },
    detail: { en: 'Quantifying computation in neural systems', ja: '神経系の計算を定量化' },
  },
  {
    title: { en: 'Machine Learning', ja: '機械学習' },
    desc: { en: 'Deep learning for seizure prediction and neural decoding', ja: 'てんかん予測・神経復号のための深層学習' },
    detail: { en: 'From neural data to clinical applications', ja: '神経データから臨床応用へ' },
  },
  {
    title: { en: 'Mathematical Modeling', ja: '数理モデル' },
    desc: { en: 'Dynamical systems and network models', ja: '力学系・ネットワークモデル' },
    detail: { en: 'Understanding neural computation theoretically', ja: '神経計算を理論的に理解する' },
  },
];

export default function ResearchPage() {
  const settings = getHomepageSettings();
  const researchAreas = getResearchAreas(settings);

  return <ResearchPageClient researchAreas={researchAreas} methodologies={methodologies} />;
}

