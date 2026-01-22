import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../content');

// Research themes extracted from profile.html
const researchThemes = [
  {
    id: "auditory-language-reconstruction",
    name: {
      en: "Auditory and Language Function Reconstruction",
      ja: "聴覚・言語機能の再建"
    },
    description: {
      en: "Development of systems to restore auditory and speech functions",
      ja: "聴覚および言語機能を再建するシステムの開発"
    },
    subthemes: [
      {
        id: "electrolarynx",
        name: {
          en: "Speech System for Laryngectomy Patients",
          ja: "喉頭摘出者の発声システム"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Masayuki Nakao, Yataro Kikuchi, and Kimitaka Kaga",
            title: "Alaryngeal speech aid using an intra-oral electrolarynx and a miniature fingertip switch",
            journal: "Auris Nasus Larynx",
            volume: "32 (2)",
            pages: "pp. 157-162",
            year: 2005,
            link: "http://www.aurisnasuslarynx.com/article/S0385-8146(05)00006-4/abstract"
          }
        ]
      },
      {
        id: "auditory-brainstem-implant",
        name: {
          en: "Auditory Brainstem Implant",
          ja: "聴性脳幹インプラント（脳幹の電気刺激による聴覚再建）"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Masayuki Nakao, and Kimitaka Kaga",
            title: "Accessing ampli-tonotopic organization of rat auditory cortex by microstimulation of cochlear nucleus",
            journal: "IEEE Transactions on Biomedical Engineering",
            volume: "52 (7)",
            pages: "pp. 1333-1344",
            year: 2005,
            link: "http://ieeexplore.ieee.org/xpl/articleDetails.jsp?arnumber=1440612"
          },
          {
            authors: "高橋宏知",
            title: "脳幹の電気刺激による聴覚機能代行 -聴性人工脳幹インプラント-",
            journal: "BME",
            volume: "18 (4)",
            pages: "pp. 48-54",
            year: 2004,
            link: "https://www.jstage.jst.go.jp/article/jsmbe1987/18/4/18_4_48/_article/-char/ja/"
          }
        ]
      }
    ]
  },
  {
    id: "neural-interface",
    name: {
      en: "Neural Interface",
      ja: "神経インターフェース"
    },
    description: {
      en: "Development of interfaces between neural systems and electronic devices",
      ja: "神経系と電子デバイス間のインターフェース開発"
    },
    subthemes: [
      {
        id: "microelectrode-array",
        name: {
          en: "Microelectrode Array",
          ja: "微小電極アレイ"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Takayuki Ejiri, Masayuki Nakao, Naoya Nakamura, Kimitaka Kaga, and Thierry Hervé",
            title: "Microelectrode array on folding polyimide ribbon for epidural mapping of functional evoked potentials",
            journal: "IEEE Transactions on Biomedical Engineering",
            volume: "50 (4)",
            pages: "pp. 510-516",
            year: 2003,
            link: "http://ieeexplore.ieee.org/xpl/articleDetails.jsp?arnumber=1193785"
          },
          {
            authors: "Takahiro Noda, and Hirokazu Takahashi",
            title: "Anesthetic effects of isoflurane on the topographic map and neuronal population activity in the rat auditory cortex",
            journal: "European Journal of Neuroscience",
            volume: "42 (6)",
            pages: "pp. 2298-2311",
            year: 2015,
            doi: "10.1111/ejn.13007",
            link: "http://onlinelibrary.wiley.com/doi/10.1111/ejn.13007/full"
          },
          {
            authors: "Tomoyo I. Shiramatsu, Kazusa Takahashi, Takahiro Noda, Ryohei Kanzaki, Haruka Nakahara, and Hirokazu Takahashi",
            title: "Microelectrode mapping of tonotopic, laminar, and field-specific organization of thalamo-cortical pathway in rat",
            journal: "Neuroscience",
            volume: "332",
            pages: "pp. 38-52",
            year: 2016,
            doi: "10.1016/j.neuroscience.2016.06.024",
            link: "http://www.sciencedirect.com/science/article/pii/S0306452216302548"
          },
          {
            authors: "高橋宏知，神保泰彦",
            title: "神経工学の潮流",
            journal: "電気学会論文誌C",
            volume: "133 (3)",
            pages: "pp. 544-549",
            year: 2013,
            link: "https://www.jstage.jst.go.jp/article/ieejeiss/133/3/133_544/_article/-char/ja/"
          }
        ]
      },
      {
        id: "light-addressable-electrode",
        name: {
          en: "Light-Addressable Electrode",
          ja: "光アドレス電極"
        },
        publications: [
          {
            authors: "Jun Suzurikawa, Hirokazu Takahashi, Ryohei Kanzaki, Masayuki Nakao, Yuzo Takayama, and Yasuhiko Jimbo",
            title: "Light-addressable electrode with hydrogenated amorphous silicon and low-conductive passivation layer for stimulation of cultured neurons",
            journal: "Applied Physics Letters",
            volume: "90 (9)",
            pages: "Art. No.093901 (3pp)",
            year: 2007,
            link: "http://apl.aip.org/resource/1/applab/v90/i9/p093901_s1?isAuthorized=no"
          }
        ]
      },
      {
        id: "genetic-engineering-neural-culture",
        name: {
          en: "Neural Culture Functionalization via Genetic Engineering",
          ja: "遺伝子工学による培養神経回路の機能化"
        },
        publications: [
          {
            authors: "Norio Tanada, Takeshi Sakurai, Hidefumi Mitsuno, Douglas J. Bakkum, Ryohei Kanzaki, Hirokazu Takahashi",
            title: "Dissociated neuronal culture expressing ionotropic odorant receptors as a hybrid odorant biosensor – proof-of-concept study –",
            journal: "Analyst",
            volume: "137 (15)",
            pages: "pp. 3452-3458",
            year: 2012,
            link: "http://pubs.rsc.org/en/content/articlelanding/2012/an/c2an35058k"
          }
        ]
      },
      {
        id: "high-density-cmos-array",
        name: {
          en: "High-Density CMOS Electrode Array",
          ja: "高密度CMOS電極アレイ"
        },
        publications: [
          {
            authors: "Douglas J. Bakkum, Urs Frey, Milos Radivojevic, Thomas L. Russell, Jan Müller, Michele Fiscella, Hirokazu Takahashi, Andreas Hierlemann",
            title: "Tracking axonal action potential propagation on a high-density microelectrode array across hundreds of sites",
            journal: "Nature Communications",
            volume: "4",
            pages: "Art. No. 2181 (12 pp)",
            year: 2013,
            doi: "10.1038/ncomms3181",
            link: "http://www.nature.com/ncomms/2013/130719/ncomms3181/full/ncomms3181.html"
          }
        ]
      },
      {
        id: "reservoir-computing",
        name: {
          en: "Physical Reservoir Computing with Neuronal Culture",
          ja: "神経細胞の分散培養系による物理リザバー計算"
        },
        publications: [
          {
            authors: "Yuichiro Yada, Shusaku Yasuda, and Hirokazu Takahashi",
            title: "Physical reservoir computing with FORCE learning in a living neuronal culture",
            journal: "Applied Physics Letters",
            volume: "119 (16)",
            pages: "173701",
            year: 2021,
            doi: "10.1063/5.0064771",
            link: "https://aip.scitation.org/doi/10.1063/5.0064771"
          }
        ]
      }
    ]
  },
  {
    id: "auditory-cortex-processing",
    name: {
      en: "Auditory Cortex Information Processing",
      ja: "聴覚野の情報処理"
    },
    description: {
      en: "Understanding information processing in the auditory cortex",
      ja: "聴覚野における情報処理の解明"
    },
    subthemes: [
      {
        id: "functional-maps",
        name: {
          en: "Functional Maps and Information Representation",
          ja: "機能マップと情報表現"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Masayuki Nakao, and Kimitaka Kaga",
            title: "Interfield differences in intensity and frequency representation of evoked potentials in rat auditory cortex",
            journal: "Hearing Research",
            volume: "210 (1-2)",
            pages: "pp. 9-23",
            year: 2005,
            link: "http://www.sciencedirect.com/science/article/pii/S0378595505001619"
          },
          {
            authors: "Hirokazu Takahashi, Ryo Yokota, and Ryohei Kanzaki",
            title: "Response variance in functional maps: Neural Darwinism revisited",
            journal: "PLOS ONE",
            volume: "8 (7)",
            pages: "e68705 (7 pp)",
            year: 2013,
            doi: "10.1371/journal.pone.0068705",
            link: "http://www.plosone.org/article/info%3Adoi%2F10.1371%2Fjournal.pone.0068705"
          },
          {
            authors: "高橋宏知",
            title: "脳の情報表現における集団のなかの個性",
            journal: "日本神経回路学会誌",
            volume: "17 (3)",
            pages: "pp. 112-123",
            year: 2010,
            link: "https://www.jstage.jst.go.jp/article/jnns/17/3/17_3_112/_article/-char/ja/"
          }
        ]
      },
      {
        id: "learning-plasticity",
        name: {
          en: "Learning-Induced Plasticity",
          ja: "学習による可塑性"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Ryo Yokota, Akihiro Funamizu, Hidekazu Kose, Ryohei Kanzaki",
            title: "Learning-stage-dependent, field-specific, map plasticity in the rat auditory cortex during appetitive operant conditioning",
            journal: "Neuroscience",
            volume: "199",
            pages: "pp. 243-258",
            year: 2011,
            link: "http://www.sciencedirect.com/science/article/pii/S0306452211011316"
          },
          {
            authors: "Akihiro Funamizu, Ryohei Kanzaki, and Hirokazu Takahashi",
            title: "Pre-attentive, context-specific representation of fear memory in the auditory cortex of rat",
            journal: "PLOS ONE",
            volume: "8 (5)",
            pages: "e63655 (14 pp)",
            year: 2013,
            link: "http://www.plosone.org/article/info%3Adoi%2F10.1371%2Fjournal.pone.0063655"
          },
          {
            authors: "高橋宏知",
            title: "聴皮質の可塑性と聴覚認知リハビリテーション",
            journal: "Otology Japan",
            volume: "18 (1)",
            pages: "pp. 12-18",
            year: 2008,
            link: "https://www.jstage.jst.go.jp/article/otoljpn1991/18/1/18_1_12/_article/-char/ja/"
          }
        ]
      },
      {
        id: "sound-perception",
        name: {
          en: "Sound Perception",
          ja: "音の知覚"
        },
        publications: [
          {
            authors: "Takahiro Noda, Ryohei Kanzaki, and Hirokazu Takahashi",
            title: "Stimulus phase locking of cortical oscillation for auditory stream segregation in rats",
            journal: "PLOS ONE",
            volume: "8 (12)",
            pages: "e83544 (14 pp)",
            year: 2013,
            link: "http://dx.plos.org/10.1371/journal.pone.0083544"
          },
          {
            authors: "高橋宏知",
            title: "聴知覚と聴覚野の神経活動の位相同期",
            journal: "Audiology Japan",
            volume: "61 (4)",
            pages: "pp. 246-253",
            year: 2018,
            link: "https://www.jstage.jst.go.jp/article/audiology/61/4/61_245/_article/-char/ja"
          }
        ]
      },
      {
        id: "mismatch-negativity",
        name: {
          en: "Mismatch Negativity",
          ja: "ミスマッチ陰性電位"
        },
        publications: [
          {
            authors: "Tomoyo I. Shiramatsu, Ryohei Kanzaki, and Hirokazu Takahashi",
            title: "Cortical mapping of mismatch negativity with deviance detection property in rat",
            journal: "PLOS ONE",
            volume: "8 (12)",
            pages: "e82663 (10 pp)",
            year: 2013,
            link: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0082663"
          },
          {
            authors: "Tomoyo I. Shiramatsu, Hirokazu Takahashi",
            title: "Mismatch-negativity (MMN) in animal models: homology of human MMN?",
            journal: "Hearing Research",
            volume: "399",
            pages: "107936 (11 pp)",
            year: 2021,
            link: "https://www.sciencedirect.com/science/article/abs/pii/S0378595519304356?via%3Dihub"
          }
        ]
      },
      {
        id: "music-and-brain",
        name: {
          en: "Music and the Brain",
          ja: "音楽と脳"
        },
        publications: [
          {
            authors: "Yoshiki Ito, Tomoyo I. Shiramatsu, Naoki Ishida, Karin Oshima, Kaho Magami, and Hirokazu Takahashi",
            title: "Spontaneous beat synchronization in rats: Neural dynamics and motor entrainment",
            journal: "Science Advances",
            volume: "8 (45)",
            pages: "eabo7019 (11 pp)",
            year: 2022,
            link: "https://www.science.org/doi/10.1126/sciadv.abo7019"
          }
        ]
      }
    ]
  },
  {
    id: "epilepsy-research",
    name: {
      en: "Basic Research on Epilepsy Treatment",
      ja: "てんかん治療の基礎研究"
    },
    description: {
      en: "Research on diagnosis and treatment of epilepsy",
      ja: "てんかんの診断と治療に関する研究"
    },
    subthemes: [
      {
        id: "seizure-diagnosis",
        name: {
          en: "Epilepsy Seizure Diagnosis",
          ja: "てんかん発作の診断"
        },
        publications: [
          {
            authors: "Ali Emami, Naoto Kunii, Takeshi Matsuo, Takashi Shinozaki, Kensuke Kawai, and Hirokazu Takahashi",
            title: "Seizure detection by convolutional neural network-based analysis of scalp electroencephalography plot images",
            journal: "NeuroImage: Clinical",
            volume: "22",
            pages: "Article #101684 (10 pp.)",
            year: 2019,
            link: "https://www.sciencedirect.com/science/article/pii/S2213158219300348"
          }
        ]
      },
      {
        id: "vagus-nerve-stimulation",
        name: {
          en: "Vagus Nerve Stimulation Therapy",
          ja: "迷走神経刺激療法"
        },
        publications: [
          {
            authors: "Hirokazu Takahashi, Tomoyo I. Shiramatsu, et al.",
            title: "Vagus nerve stimulation research",
            journal: "Scientific Reports",
            year: 2020,
            link: "https://www.nature.com/articles/s41598-020-65745-z"
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log('='.repeat(60));
  console.log('Research Themes Extractor');
  console.log('='.repeat(60));

  // Create research directory
  const researchDir = path.join(CONTENT_DIR, 'research');
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true });
  }

  // Create themes directory
  const themesDir = path.join(researchDir, 'themes');
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
  }

  // Write each theme
  for (const theme of researchThemes) {
    const themeData = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      subthemes: theme.subthemes.map(st => ({
        id: st.id,
        name: st.name,
        selectedPublications: st.publications
      }))
    };

    const filePath = path.join(themesDir, `${theme.id}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(themeData, { lineWidth: -1 }), 'utf-8');
    console.log(`  Created: ${theme.id}.yaml`);
  }

  // Also create an index file listing all themes
  const indexData = {
    themes: researchThemes.map(t => ({
      id: t.id,
      name: t.name,
      subthemeCount: t.subthemes.length,
      publicationCount: t.subthemes.reduce((sum, st) => sum + st.publications.length, 0)
    }))
  };

  fs.writeFileSync(
    path.join(researchDir, 'themes-index.yaml'),
    yaml.dump(indexData, { lineWidth: -1 }),
    'utf-8'
  );
  console.log('  Created: themes-index.yaml');

  console.log('\n' + '='.repeat(60));
  console.log('Research themes extraction complete');
  console.log(`  - Themes: ${researchThemes.length}`);
  console.log(`  - Subthemes: ${researchThemes.reduce((sum, t) => sum + t.subthemes.length, 0)}`);
  console.log(`  - Selected publications: ${researchThemes.reduce((sum, t) => sum + t.subthemes.reduce((s, st) => s + st.publications.length, 0), 0)}`);
}

main().catch(console.error);
