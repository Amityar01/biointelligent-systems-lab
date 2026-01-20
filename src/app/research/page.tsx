import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getHomepageSettings } from '@/lib/content';

// Research areas organized by scale
function getResearchAreas(settings: ReturnType<typeof getHomepageSettings>) {
  const researchImages = settings?.research_images || {
    cultures: { main: '/uploads/scraped/neuronal-culture.jpg', secondary: '/uploads/scraped/cmos-array.jpg' },
    auditory: { main: '/uploads/scraped/lab-visualization.jpg', secondary: '/uploads/scraped/waveform.jpg' },
    clinical: { main: '/uploads/scraped/ecog-electrode.jpg', secondary: '/uploads/scraped/microelectrode-arrays.jpg' },
  };

  return [
    {
      id: 'emergence',
      scale: 'In Vitro',
      color: 'var(--calcium)',
      title: 'Emergent Computing',
      titleJa: '創発計算',
      question: 'How does intelligence emerge from self-organizing neurons?',
      image: researchImages.cultures.main,
      description:
        'We study how living neuronal cultures perform computation. Using high-density CMOS arrays with 10,000+ recording sites, we observe how networks self-organize to the edge of criticality and implement reservoir computing.',
      findings: [
        {
          title: 'Physical Reservoir Computing',
          desc: 'Implemented FORCE learning in living neuronal cultures, demonstrating that biological neural networks can be trained as computational reservoirs.',
          paper: 'Applied Physics Letters, 2021',
        },
        {
          title: 'Self-Organized Criticality',
          desc: 'Discovered that noise combined with spike-timing plasticity is sufficient for neural networks to reach criticality and E/I balance.',
          paper: 'Applied Physics Letters, 2023',
        },
        {
          title: 'Deviance Detection in Cultures',
          desc: 'Found that even simple cultures show complex temporal processing—challenging the view that hierarchical networks are required.',
          paper: 'Frontiers in Neuroscience, 2025',
        },
      ],
      topics: [
        'Reservoir computing with living neurons',
        'Self-organized criticality',
        'Information processing capacity',
        'Bio-silicon hybrid sensors',
      ],
    },
    {
      id: 'auditory',
      scale: 'In Vivo',
      color: 'var(--voltage)',
      title: 'Auditory Processing',
      titleJa: '聴覚情報処理',
      question: 'How does the brain represent sound, music, and prediction?',
      image: researchImages.auditory.main,
      description:
        'We investigate neural coding in the rodent thalamo-cortical auditory system—from basic tonotopy to complex phenomena like beat synchronization and predictive coding through mismatch negativity.',
      findings: [
        {
          title: 'Beat Synchronization in Rats',
          desc: 'First evidence of innate beat synchronization in animals. Rats bob their heads to music at 120-140 BPM—the same tempo humans prefer.',
          paper: 'Science Advances, 2022',
        },
        {
          title: 'Negative Prediction Error Neurons',
          desc: 'Identified neurons that encode prediction errors when expected sounds are omitted, revealing the neural basis of predictive coding.',
          paper: 'PLOS Biology, 2025',
        },
        {
          title: 'Brain as Physical Reservoir',
          desc: 'Quantified the information processing capacity of living auditory cortex, finding optimal computation at 10-18ms timescales.',
          paper: 'Applied Physics Letters, 2023',
        },
      ],
      topics: [
        'Mismatch negativity & predictive coding',
        'Beat synchronization & rhythm',
        'Tonotopic organization',
        'Auditory cortex plasticity',
      ],
    },
    {
      id: 'clinical',
      scale: 'Clinical',
      color: 'var(--activity)',
      title: 'Neuromodulation',
      titleJa: '神経変調',
      question: 'Can we modulate brain function to treat disease?',
      image: researchImages.clinical.main,
      description:
        'We develop vagus nerve stimulation (VNS) approaches and study neural dynamics in epilepsy. Our work reveals how neuromodulation affects the balance between feedforward and feedback processing in the brain.',
      findings: [
        {
          title: 'VNS Frequency Effects',
          desc: 'VNS increases gamma/beta (feedforward) via cholinergic pathways and decreases theta (feedback) via noradrenergic pathways.',
          paper: 'Brain Stimulation, 2023',
        },
        {
          title: 'Stochastic Resonance',
          desc: 'Explained the paradox of why awake cortex has more noise but better weak signal detection through stochastic resonance.',
          paper: 'Cerebral Cortex, 2024',
        },
      ],
      topics: [
        'Vagus nerve stimulation',
        'Epilepsy dynamics & prediction',
        'Feedforward vs feedback processing',
        'Clinical neural interfaces',
      ],
    },
    {
      id: 'theory',
      scale: 'Theoretical',
      color: 'var(--warm)',
      title: 'Neural Computation Theory',
      titleJa: '神経計算理論',
      question: 'What are the mathematical principles of brain function?',
      image: '/uploads/scraped/research-diagram.png',
      description:
        'We develop theoretical frameworks to understand how physical neural dynamics translate into information processing. Our work bridges the gap between biological reality and computational theory.',
      findings: [
        {
          title: 'Information Processing Capacity (IPC)',
          desc: 'Quantified the "memory" and "computation" capacity of living neuronal networks, finding they operate at an optimal edge of chaos.',
          paper: 'Applied Physics Letters, 2023',
        },
        {
          title: 'Stochastic Resonance',
          desc: 'Demonstrated how noise in the brain paradoxically improves the detection of weak signals, suggesting a functional role for spontaneous activity.',
          paper: 'Cerebral Cortex, 2024',
        },
        {
          title: 'Free Energy Principle & Autopoiesis',
          desc: 'Exploring how neural networks maintain their own organization (autopoiesis) and minimize prediction error (free energy) to survive.',
          paper: 'Artificial Life, 2020',
        },
      ],
      topics: [
        'Reservoir Computing Theory',
        'Information Processing Capacity',
        'Stochastic Resonance',
        'Free Energy Principle',
      ],
    },
  ];
}

const methodologies = [
  {
    title: 'CMOS Arrays',
    desc: 'High-density recording with 10,000+ sites in 2×2mm²',
    detail: 'Collaboration with ETH Zurich & Maxwell Biosystems',
  },
  {
    title: 'Information Theory',
    desc: 'Transfer entropy, IPC, and neural coding analysis',
    detail: 'Quantifying computation in neural systems',
  },
  {
    title: 'Machine Learning',
    desc: 'Deep learning for seizure prediction and neural decoding',
    detail: 'From neural data to clinical applications',
  },
  {
    title: 'Mathematical Modeling',
    desc: 'Dynamical systems and network models',
    detail: 'Understanding neural computation theoretically',
  },
];

export default function ResearchPage() {
  const settings = getHomepageSettings();
  const researchAreas = getResearchAreas(settings);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Grid Overlay */}
      <div className="grid-overlay" />


      {/* Hero */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <p className="section-label">What We Study</p>
          <h1 className="mb-6">
            <span className="text-[var(--text)]">Three Scales,</span>
            <br />
            <span className="text-gradient">One Question</span>
          </h1>
          <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            We approach the brain at multiple scales—from neurons in a dish to human clinical studies.
            Each scale reveals different aspects of how neural computation emerges, processes information,
            and can be modulated.
          </p>
        </div>
      </header>

      {/* Research Areas */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="space-y-32">
            {researchAreas.map((area, index) => (
              <div key={area.id} id={area.id} className="scroll-mt-24">
                {/* Scale indicator */}
                <div className="flex items-center gap-4 mb-8">
                  <span
                    className={`tag tag-${area.id === 'emergence' ? 'cultures' : area.id}`}
                  >
                    {area.scale}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                  {/* Main content */}
                  <div className="lg:col-span-7">
                    <p className="text-sm text-[var(--text-muted)] jp mb-2">{area.titleJa}</p>
                    <h2 className="text-3xl lg:text-4xl font-semibold mb-4">{area.title}</h2>
                    <p className="text-lg mb-6" style={{ color: area.color }}>
                      {area.question}
                    </p>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                      {area.description}
                    </p>

                    {/* Research image */}
                    <div className="aspect-[16/9] relative overflow-hidden border border-[var(--border)] mb-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={area.image}
                        alt={area.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Topics */}
                    <div className="mb-8">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">Research Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {area.topics.map((topic) => (
                          <span key={topic} className="tag">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="lg:col-span-5">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">Key Findings</p>
                    <div className="space-y-4">
                      {area.findings.map((finding) => (
                        <div
                          key={finding.title}
                          className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-colors"
                        >
                          <h4 className="font-medium mb-2">{finding.title}</h4>
                          <p className="text-sm text-[var(--text-secondary)] mb-2">{finding.desc}</p>
                          <p className="text-xs font-mono" style={{ color: area.color }}>{finding.paper}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Philosophy */}
      <section className="py-20 border-y border-[var(--border)] bg-[var(--bg-alt)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="section-label">Philosophy</p>
            <blockquote className="pullquote mb-6">
              &quot;We aim to reverse engineer the brain—to understand what &apos;function&apos; a brain&apos;s
              structure and neural activity patterns represent as a &apos;design solution.&apos;&quot;
            </blockquote>
            <p className="text-[var(--text-secondary)]">
              Unlike AI which automates existing rules, biological intelligence creates new rules.
              We seek to understand this difference through experiment and theory.
            </p>
          </div>
        </div>
      </section>

      {/* Methodologies */}
      <section className="py-20 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <p className="section-label">Methods</p>
            <h2 className="mb-4">How We Work</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl">
              We combine cutting-edge recording technology with rigorous theoretical analysis
              to understand neural computation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodologies.map((method) => (
              <div key={method.title} className="card p-6">
                <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{method.desc}</p>
                <p className="text-xs text-[var(--text-muted)]">{method.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaborations */}
      <section className="py-20 lg:py-32 bg-[var(--bg-alt)] border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label">Global Network</p>
              <h2 className="mb-6">International Collaborations</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                We work with leading researchers worldwide, particularly in neural recording
                technology and computational neuroscience.
              </p>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2" />
                  <span><strong className="text-[var(--text)]">ETH Zurich</strong> — CMOS array development (Hierlemann, Bakkum)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2" />
                  <span><strong className="text-[var(--text)]">Maxwell Biosystems</strong> — High-density recording technology</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2" />
                  <span><strong className="text-[var(--text)]">Monash University</strong> — Consciousness and neural coding</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2" />
                  <span><strong className="text-[var(--text)]">Jichi Medical University</strong> — VNS clinical studies</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Link href="/contact" className="btn-primary">
                Interested in Collaboration?
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
