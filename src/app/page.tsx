'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { members } from '@/data/members';
import { publications } from '@/data/publications';
import { news } from '@/data/news';
import { books, youtubeChannel } from '@/data/media';
import { labImages, researchImages } from '@/data/images';
import { useEffect, useRef, useState } from 'react';
import { WaveformGlyph, NetworkGlyph, BrainGlyph } from '@/components/Glyphs';

const navItems = [
  { href: '/research', label: 'Research' },
  { href: '/members', label: 'People' },
  { href: '/publications', label: 'Publications' },
  { href: '/media', label: 'Books & Media' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
];

// Research areas with unique visual identities
const researchAreas = [
  {
    id: 'cultures',
    title: 'Emergent Computing',
    question: 'How does intelligence emerge from neurons?',
    desc: 'We study how self-organizing neuronal networks perform computation, using living cultures as physical reservoirs.',
    tag: 'In Vitro',
    color: 'var(--calcium)',
    image: researchImages.cultures.main,
  },
  {
    id: 'auditory',
    title: 'Auditory Processing',
    question: 'How does the brain encode sound and music?',
    desc: 'We investigate neural coding in the auditory cortex, from basic sound representation to rhythm and prediction.',
    tag: 'In Vivo',
    color: 'var(--voltage)',
    image: researchImages.auditory.main,
  },
  {
    id: 'clinical',
    title: 'Neuromodulation',
    question: 'Can we enhance brain function?',
    desc: 'We develop therapeutic approaches using vagus nerve stimulation and study neural dynamics in epilepsy.',
    tag: 'Clinical',
    color: 'var(--activity)',
    image: researchImages.clinical.main,
  },
];

// Network node type for the emergence network animation
interface NetworkNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  delay: number;
}

// Emergence Network Component
function EmergenceNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        setDimensions({
          width: svgRef.current.parentElement.offsetWidth,
          height: svgRef.current.parentElement.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    // Create nodes that emerge from chaos into order
    const nodeCount = Math.floor((dimensions.width * dimensions.height) / 25000);
    const newNodes: NetworkNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        delay: Math.random() * 2,
      });
    }

    // Create connections based on proximity
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[i].x - newNodes[j].x;
        const dy = newNodes[i].y - newNodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && Math.random() > 0.6) {
          newNodes[i].connections.push(j);
        }
      }
    }

    setNodes(newNodes);

    // Animate nodes
    const animate = () => {
      setNodes(prevNodes =>
        prevNodes.map(node => {
          const newX = node.x + node.vx;
          const newY = node.y + node.vy;

          // Bounce off edges
          if (newX < 0 || newX > dimensions.width) node.vx *= -1;
          if (newY < 0 || newY > dimensions.height) node.vy *= -1;

          return {
            ...node,
            x: Math.max(0, Math.min(dimensions.width, newX)),
            y: Math.max(0, Math.min(dimensions.height, newY)),
          };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ opacity: 0.6 }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--calcium)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--voltage)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Connections */}
      {nodes.map(node =>
        node.connections.map(targetId => {
          const target = nodes[targetId];
          if (!target) return null;
          return (
            <line
              key={`${node.id}-${targetId}`}
              x1={node.x}
              y1={node.y}
              x2={target.x}
              y2={target.y}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              style={{
                animationDelay: `${node.delay}s`,
              }}
            />
          );
        })
      )}

      {/* Nodes */}
      {nodes.map(node => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="12"
            fill="var(--calcium)"
            opacity="0.1"
            filter="url(#glow)"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r="3"
            fill="var(--calcium)"
            style={{
              animationDelay: `${node.delay}s`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}


export default function Home() {
  const recentPubs = publications.slice(0, 4);
  const recentNews = news.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Grid Overlay */}
      <div className="grid-overlay" />


      {/* Hero */}
      <header className="relative min-h-[90vh] flex items-center pt-16">
        {/* Background Image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={labImages.hero.banner}
            alt="Neural network visualization"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/80 to-[var(--bg)]" />
        </div>

        {/* Emergence Network Background */}
        <div className="absolute inset-0 overflow-hidden">
          <EmergenceNetwork />
        </div>

        <div className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
          <div className="max-w-3xl">
            <p className="section-label glow-calcium">University of Tokyo · 東京大学</p>
            <h1 className="mb-8 leading-[0.9]">
              <span className="text-[var(--text)]">Reverse Engineering</span>
              <br />
              <span className="text-gradient">the Brain</span>
            </h1>
            <p className="text-lg lg:text-2xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-2xl">
              We decode the algorithms of biological intelligence—from neural cultures
              to the human cortex—to build the next generation of brain-inspired systems.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/research" className="btn-primary">
                Explore Research
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/publications" className="btn-secondary">
                Publications
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="scroll-line" />
        </div>
      </header>

      {/* Mission / Philosophy */}
      <section className="py-32 bg-[var(--bg-alt)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-[var(--calcium)] blur-[150px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-[var(--voltage)] blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="reveal">
              <p className="section-label glow-voltage">Our Philosophy</p>
              <h2 className="mb-8">Beyond Digital Intelligence</h2>
              <div className="space-y-6">
                <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                  Artificial Intelligence excels at <strong>automation</strong>—optimizing within fixed rules.
                </p>
                <div className="h-px w-20 bg-gradient-to-r from-[var(--accent)] to-transparent" />
                <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                  Biological <strong>Life Intelligence</strong> specializes in <strong>autonomization</strong>: the emergent capacity to create new rules and thrive in uncertainty.
                </p>
              </div>
              <Link href="/research" className="inline-flex items-center gap-3 text-[var(--accent)] font-bold mt-10 hover:gap-5 transition-all group">
                Deep Dive into Life Intelligence
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Comparison Graphics */}
            <div className="grid gap-8">
              <div className="p-10 glass rounded-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]">Artificial (AI)</h3>
                </div>
                <p className="text-4xl font-bold mb-3 tracking-tighter">Automation</p>
                <p className="text-[var(--text-secondary)]">Fixed landscapes, optimized outcomes.</p>
              </div>

              <div className="p-10 glass border-[var(--calcium)]/30 rounded-2xl relative overflow-hidden group bio-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--calcium)]/10 to-transparent opacity-50" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[var(--calcium)] animate-pulse shadow-[0_0_10px_var(--calcium)]" />
                  <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--calcium)]">Biological (LI)</h3>
                </div>
                <p className="text-4xl font-bold mb-3 tracking-tighter text-[var(--accent)]">Autonomization</p>
                <p className="text-[var(--text-secondary)]">Fluid rules, emergent survival.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-32 lg:py-48 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
            <div className="max-w-xl reveal">
              <p className="section-label glow-calcium">Research</p>
              <h2 className="mb-6">Multiscale Neural<br />Computation</h2>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                From self-organizing cultures to clinical applications, we investigate how intelligence emerges across scales.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
            {researchAreas.map((area, index) => (
              <div
                key={area.id}
                className={`group relative reveal ${index === 1 ? 'lg:translate-y-12' : index === 2 ? 'lg:-translate-y-6' : ''}`}
              >
                <div className="card h-full bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-alt)] border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-all duration-700">
                  {/* Image Header */}
                  <div className="aspect-[16/10] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={area.image}
                      alt={area.title}
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-alt)] via-transparent to-transparent" />

                    <div className="absolute top-6 left-6">
                      <span className={`tag tag-${area.id} glass-pill text-[10px]`}>
                        {area.tag}
                      </span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-10 relative">
                    <div className="mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                      {area.id === 'cultures' && <NetworkGlyph color={area.color} />}
                      {area.id === 'auditory' && <WaveformGlyph color={area.color} />}
                      {area.id === 'clinical' && <BrainGlyph color={area.color} />}
                    </div>

                    <h3 className="text-2xl mb-4 group-hover:text-[var(--accent)] transition-colors">{area.title}</h3>
                    <p className="text-lg font-medium mb-6 leading-tight" style={{ color: area.color }}>
                      {area.question}
                    </p>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {area.desc}
                    </p>
                  </div>

                  {/* Bottom Bar Glow */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
                    style={{ background: `linear-gradient(90deg, transparent, ${area.color}, transparent)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-32 text-center reveal">
            <Link href="/research" className="btn-secondary group">
              Explore All Research
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-48 bg-[var(--bg)] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="reveal">
              <p className="section-label glow-calcium">Featured Discovery</p>
              <h1 className="text-4xl lg:text-7xl mb-8 leading-[1.05] tracking-tighter">
                Rats Bob to the <span className="text-gradient">Musical Beat</span>
              </h1>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-10 italic border-l-2 border-[var(--calcium)] pl-8">
                &quot;We discovered that rats spontaneously synchronize their movements to musical beats—suggesting that synchronization is determined by brain time constants, not body size.&quot;
              </p>
              <div className="flex flex-wrap gap-8 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center glass-pill text-[var(--accent)]">
                    <WaveformGlyph color="var(--accent)" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Journal</p>
                    <p className="font-bold text-[var(--text)]">Science Advances</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/contact" className="btn-primary">
                  Let&apos;s Connect
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="https://www.science.org/doi/10.1126/sciadv.abo7019"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Read Paper
                </a>
              </div>
            </div>

            <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-[var(--calcium)]/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative aspect-video rounded-3xl overflow-hidden glass border-[var(--border)] group-hover:border-[var(--accent)]/40 transition-all duration-700 group-hover:rotate-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={labImages.research.labVisualization}
                  alt="Neural activity visualization"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-48 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5 reveal">
              <p className="section-label glow-calcium">Leadership</p>
              <h2 className="mb-10 leading-[0.9]">Meet the<br />Adventurers</h2>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-12">
                A multidisciplinary team of engineers and neuroscientists exploring the frontier of biological intelligence.
              </p>
              <Link href="/members" className="btn-secondary">
                View All {members.length} Members
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-8">
                {members.slice(0, 2).map((member) => (
                  <div key={member.name} className="group relative">
                    <div className="aspect-[4/5] relative overflow-hidden rounded-[2rem] glass bio-pulse">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.image}
                        alt={member.name}
                        className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 opacity-60 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-alt)] via-transparent to-transparent" />

                      <div className="absolute bottom-8 left-8 right-8">
                        <p className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-widest mb-2 opacity-80">
                          {member.role}
                        </p>
                        <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium jp">{member.nameJa}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-48 bg-[var(--bg-alt)] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
            <div className="max-w-xl reveal">
              <p className="section-label glow-voltage">Output</p>
              <h2 className="mb-6">Scientific Contribution</h2>
              <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                Our latest findings published in high-impact journals across neuroscience and engineering.
              </p>
            </div>
            <Link href="/publications" className="btn-secondary group whitespace-nowrap">
              View Publication List
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4">
            {recentPubs.slice(0, 4).map((pub) => (
              <div key={pub.id} className="group p-8 lg:p-10 glass hover:bg-[var(--accent-glow)]/5 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center rounded-2xl">
                <div className="font-mono text-sm text-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2 rounded-full">
                  {pub.year}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl lg:text-2xl mb-2 group-hover:text-[var(--accent)] transition-colors">{pub.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">{pub.authors.join(', ')}</p>
                  <p className="text-[var(--accent)] font-mono text-[10px] uppercase tracking-widest">{pub.journal}</p>
                </div>
                <Link href="/publications" className="w-12 h-12 flex items-center justify-center glass-pill opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-48 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex items-end justify-between mb-20">
            <div className="reveal">
              <p className="section-label glow-voltage">Updates</p>
              <h2 className="text-4xl lg:text-5xl tracking-tight">Latest News</h2>
            </div>
            <Link href="/news" className="btn-secondary group">
              News Archive
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {recentNews.map((item) => (
              <article key={item.id} className="group glass p-10 rounded-[2rem] hover:bg-[var(--accent-glow)]/5 transition-all flex flex-col bio-pulse">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)]">{item.category}</span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-6 group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                <p className="text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-auto">{item.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-48 bg-[var(--bg-alt)] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex items-end justify-between mb-20">
            <div className="reveal">
              <p className="section-label glow-calcium">Outreach</p>
              <h2 className="text-4xl lg:text-5xl tracking-tight">Books & Media</h2>
            </div>
            <Link href="/media" className="btn-secondary group">
              Media Hub
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {books.slice(0, 3).map((book) => (
              <article key={book.id} className="card p-10 flex flex-col group bio-pulse bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-alt)]">
                <div className="aspect-[3/4] mb-8 relative rounded-xl overflow-hidden glass shadow-2xl scale-95 group-hover:scale-100 transition-transform duration-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.amazon ? `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80` : labImages.books.lifeIntelligence} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="tag glass-pill text-[10px]">{book.year}</span>
                  <span className="text-xs text-[var(--text-muted)]">{book.publisher}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 leading-snug group-hover:text-[var(--accent)] transition-colors">{book.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-6 line-clamp-1 italic">{book.titleJa}</p>
                <div className="mt-auto">
                  {book.amazon && (
                    <a href={book.amazon} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] group/link">
                      Order Book <ArrowUpRight className="w-4 h-4 group-link/hover:translate-x-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* YouTube Banner */}
          <div className="mt-20 p-12 glass rounded-[2rem] relative overflow-hidden group bio-pulse">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <ArrowRight className="w-6 h-6 rotate-45" />
                  </div>
                  <h3 className="text-2xl font-bold">{youtubeChannel.name}</h3>
                </div>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{youtubeChannel.description}</p>
              </div>
              <a href={youtubeChannel.url} target="_blank" rel="noopener noreferrer" className="btn-primary py-5 px-10 text-lg">
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 lg:py-64 bg-gradient-to-b from-[var(--bg)] to-[var(--bg-alt)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--calcium)] blur-[180px] rounded-full mix-blend-screen opacity-20" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10 text-center">
          <div className="max-w-4xl mx-auto reveal">
            <p className="section-label glow-calcium justify-center">Join the Mission</p>
            <h2 className="text-4xl lg:text-7xl mb-10 leading-[1.05] tracking-tight">
              Decode the Future of <br />
              <span className="text-gradient">Intelligence</span>
            </h2>
            <p className="text-xl lg:text-2xl text-[var(--text-secondary)] mb-12 leading-relaxed">
              We are constantly looking for curious minds—engineers, biologists, and physicists—to join our journey into the heart of the brain.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/contact" className="btn-primary py-5 px-10 text-lg">
                Join our Lab
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link href="/research" className="btn-secondary py-5 px-10 text-lg">
                Explore our Work
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
