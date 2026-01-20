'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, ExternalLink } from 'lucide-react';

const affiliations = [
  {
    name: 'Research Center for Advanced Science and Technology (RCAST)',
    nameJa: '先端科学技術研究センター',
    url: 'https://www.rcast.u-tokyo.ac.jp/en/',
  },
  {
    name: 'Department of Mechano-Informatics',
    nameJa: '機械情報学専攻',
    url: 'https://www.kikaib.t.u-tokyo.ac.jp/',
  },
  {
    name: 'Graduate School of Information Science and Technology',
    nameJa: '情報理工学系研究科',
    url: 'https://www.i.u-tokyo.ac.jp/index_e.shtml',
  },
  {
    name: 'The University of Tokyo',
    nameJa: '東京大学',
    url: 'https://www.u-tokyo.ac.jp/en/',
  },
];

export default function ContactPage() {
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
          <p className="section-label">Get in Touch</p>
          <h1 className="mb-6">Contact</h1>
          <p className="text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Interested in our research? Want to join the lab or collaborate?
            We&apos;d love to hear from you.
          </p>
        </div>
      </header>

      {/* Contact Info Grid */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div className="space-y-8">
              {/* Address */}
              <div className="p-8 border border-[var(--border)]">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Address</h3>
                    <div className="text-[var(--text-secondary)] space-y-1">
                      <p className="font-medium text-[var(--text)]">Engineering Building 2, Room 81B</p>
                      <p>Department of Mechano-Informatics</p>
                      <p>Graduate School of Information Science and Technology</p>
                      <p>The University of Tokyo</p>
                      <p className="mt-3">7-3-1 Hongo, Bunkyo-ku</p>
                      <p>Tokyo 113-8656, Japan</p>
                      <p className="mt-3">
                        <span className="font-medium text-[var(--text)]">Phone:</span> +81-3-5841-6318
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-sm text-[var(--text-muted)] jp">
                        〒113-8656 東京都文京区本郷7-3-1
                      </p>
                      <p className="text-sm text-[var(--text-muted)] jp">
                        東京大学大学院情報理工学系研究科 機械情報学専攻
                      </p>
                      <p className="text-sm text-[var(--text-muted)] jp">
                        工学部2号館 81B室
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="p-8 border border-[var(--border)]">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Email</h3>
                    <a
                      href="mailto:takahashi@i.u-tokyo.ac.jp"
                      className="text-[var(--accent)] hover:underline"
                    >
                      takahashi@i.u-tokyo.ac.jp
                    </a>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                      For inquiries about the lab, research collaborations, or prospective students
                    </p>
                  </div>
                </div>
              </div>

              {/* Access */}
              <div className="p-8 border border-[var(--border)]">
                <h3 className="font-semibold text-lg mb-4">Access</h3>
                <div className="text-[var(--text-secondary)] space-y-3">
                  <p>
                    <span className="font-medium text-[var(--text)]">By Train:</span> Hongo-sanchome
                    Station (Tokyo Metro Marunouchi Line or Oedo Line)
                  </p>
                  <p>
                    <span className="font-medium text-[var(--text)]">Walk:</span> About 8 minutes from
                    the station to the Engineering Building
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/place/The+University+of+Tokyo/@35.7126775,139.7577262,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mt-4"
                >
                  Open in Google Maps
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Affiliations */}
            <div>
              <div className="p-8 border border-[var(--border)]">
                <h3 className="font-semibold text-lg mb-6">Affiliations</h3>
                <div className="space-y-4">
                  {affiliations.map((affiliation) => (
                    <a
                      key={affiliation.name}
                      href={affiliation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
                    >
                      <div>
                        <p className="font-medium group-hover:text-[var(--accent)] transition-colors">
                          {affiliation.name}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] jp">{affiliation.nameJa}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prospective Students */}
      <section className="py-20 lg:py-32 bg-[var(--bg-alt)] border-y border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="section-label">Join Us</p>
            <h2 className="mb-6">For Prospective Students</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              We are always looking for motivated students interested in neuroscience,
              engineering, and computation. If you&apos;re interested in joining our lab
              as a graduate student or researcher, please contact us with your CV and
              a brief description of your research interests.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:takahashi@i.u-tokyo.ac.jp?subject=Prospective Student Inquiry"
                className="btn-primary"
              >
                Send Inquiry
              </a>
              <a
                href="https://sites.google.com/g.ecc.u-tokyo.ac.jp/nelab/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2"
              >
                Open Lab Info
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
