'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    getInTouch: { en: 'Get in Touch', ja: 'お問い合わせ' },
    contact: { en: 'Contact', ja: 'お問い合わせ' },
    description: {
      en: "Interested in our research? Want to join the lab or collaborate? We'd love to hear from you.",
      ja: '研究に興味がありますか？研究室への参加や共同研究をご希望ですか？お気軽にご連絡ください。',
    },
    address: { en: 'Address', ja: '住所' },
    email: { en: 'Email', ja: 'メール' },
    emailNote: {
      en: 'For inquiries about the lab, research collaborations, or prospective students',
      ja: '研究室・共同研究・進学希望に関するお問い合わせはこちら',
    },
    access: { en: 'Access', ja: 'アクセス' },
    byTrain: { en: 'By Train:', ja: '電車:' },
    walk: { en: 'Walk:', ja: '徒歩:' },
    openInMaps: { en: 'Open in Google Maps', ja: 'Googleマップで開く' },
    affiliations: { en: 'Affiliations', ja: '所属機関' },
    joinUs: { en: 'Join Us', ja: '参加' },
    forProspective: { en: 'For Prospective Students', ja: '入学希望者の方へ' },
    prospectiveDesc: {
      en: "We are always looking for motivated students interested in neuroscience, engineering, and computation. If you're interested in joining our lab as a graduate student or researcher, please contact us with your CV and a brief description of your research interests.",
      ja: '神経科学・工学・計算論に興味のある意欲的な学生を常に募集しています。大学院生または研究者として研究室への参加に興味がある方は、履歴書（CV）と研究興味の概要を添えてご連絡ください。',
    },
    sendInquiry: { en: 'Send Inquiry', ja: 'お問い合わせ' },
    openLabInfo: { en: 'Open Lab Info', ja: 'オープンラボ情報' },
    phone: { en: 'Phone:', ja: '電話:' },
  };

  const addressEn = {
    building: 'Engineering Building 2, Room 81B',
    dept1: 'Department of Mechano-Informatics',
    dept2: 'Graduate School of Information Science and Technology',
    uni: 'The University of Tokyo',
    street: '7-3-1 Hongo, Bunkyo-ku',
    city: 'Tokyo 113-8656, Japan',
    phone: '+81-3-5841-6318',
  };

  const addressJa = {
    postal: '〒113-8656 東京都文京区本郷7-3-1',
    dept: '東京大学大学院情報理工学系研究科 機械情報学専攻',
    room: '工学部2号館 81B室',
    phone: '03-5841-6318',
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.getInTouch)}</p>
          <h1 className="mb-6">{t(texts.contact)}</h1>
          <p className="text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            {t(texts.description)}
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
                    <h3 className="font-semibold text-lg mb-4">{t(texts.address)}</h3>
                    <div className="text-[var(--text-secondary)] space-y-1">
                      {language === 'en' ? (
                        <>
                          <p className="font-medium text-[var(--text)]">{addressEn.building}</p>
                          <p>{addressEn.dept1}</p>
                          <p>{addressEn.dept2}</p>
                          <p>{addressEn.uni}</p>
                          <p className="mt-3">{addressEn.street}</p>
                          <p>{addressEn.city}</p>
                          <p className="mt-3">
                            <span className="font-medium text-[var(--text)]">{t(texts.phone)}</span> {addressEn.phone}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-[var(--text)] jp">{addressJa.room}</p>
                          <p className="jp">{addressJa.dept}</p>
                          <p className="jp mt-3">{addressJa.postal}</p>
                          <p className="mt-3">
                            <span className="font-medium text-[var(--text)]">{t(texts.phone)}</span> {addressJa.phone}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      {language === 'en' ? (
                        <>
                          <p className="text-sm text-[var(--text-muted)] jp">{addressJa.postal}</p>
                          <p className="text-sm text-[var(--text-muted)] jp">{addressJa.dept}</p>
                          <p className="text-sm text-[var(--text-muted)] jp">{addressJa.room}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-[var(--text-muted)]">{addressEn.building}</p>
                          <p className="text-sm text-[var(--text-muted)]">{addressEn.dept1}</p>
                          <p className="text-sm text-[var(--text-muted)]">{addressEn.dept2}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="p-8 border border-[var(--border)]">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">{t(texts.email)}</h3>
                    <a
                      href="mailto:takahashi@i.u-tokyo.ac.jp"
                      className="text-[var(--accent)] hover:underline"
                    >
                      takahashi@i.u-tokyo.ac.jp
                    </a>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                      {t(texts.emailNote)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Access */}
              <div className="p-8 border border-[var(--border)]">
                <h3 className="font-semibold text-lg mb-4">{t(texts.access)}</h3>
                <div className="text-[var(--text-secondary)] space-y-3">
                  <p>
                    <span className="font-medium text-[var(--text)]">{t(texts.byTrain)}</span>{' '}
                    {language === 'en'
                      ? 'Hongo-sanchome Station (Tokyo Metro Marunouchi Line or Oedo Line)'
                      : '本郷三丁目駅（東京メトロ丸ノ内線・都営大江戸線）'}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--text)]">{t(texts.walk)}</span>{' '}
                    {language === 'en'
                      ? 'About 8 minutes from the station to the Engineering Building'
                      : '駅から工学部方面まで徒歩約8分'}
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps/place/The+University+of+Tokyo/@35.7126775,139.7577262,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mt-4"
                >
                  {t(texts.openInMaps)}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Affiliations */}
            <div>
              <div className="p-8 border border-[var(--border)]">
                <h3 className="font-semibold text-lg mb-6">{t(texts.affiliations)}</h3>
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
                          {language === 'en' ? affiliation.name : affiliation.nameJa}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] jp">{language === 'en' ? affiliation.nameJa : affiliation.name}</p>
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
            <p className="section-label">{t(texts.joinUs)}</p>
            <h2 className="mb-6">{t(texts.forProspective)}</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              {t(texts.prospectiveDesc)}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:takahashi@i.u-tokyo.ac.jp?subject=Prospective Student Inquiry"
                className="btn-primary"
              >
                {t(texts.sendInquiry)}
              </a>
              <a
                href="https://sites.google.com/g.ecc.u-tokyo.ac.jp/nelab/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2"
              >
                {t(texts.openLabInfo)}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
