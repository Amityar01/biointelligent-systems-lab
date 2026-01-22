import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMBERS_DIR = path.join(__dirname, '../content/members');
const CONTENT_DIR = path.join(__dirname, '../content');

// Data extracted from profile page
const profileData = {
  b3Students: [
    "石田廉",
    "茨目大洋",
    "海野博亮",
    "辻川陽向子",
    "東口怜弘",
    "長谷川蒼弥",
    "山本康生"
  ],
  education: [
    { year: "1988年3月", event: "京都府向日市立向陽小学校卒業" },
    { year: "1991年3月", event: "宮城県仙台市立六郷中学校卒業" },
    { year: "1994年3月", event: "宮城県仙台第一高等学校卒業" },
    { year: "1994年4月", event: "東京大学教養学部理科1類入学" },
    { year: "1998年3月", event: "東京大学工学部産業機械工学科卒業" },
    { year: "1998年4月", event: "東京大学大学院工学系研究科機械工学専攻修士課程入学" },
    { year: "2000年3月", event: "東京大学大学院工学系研究科機械工学専攻修士課程修了" },
    { year: "2000年4月", event: "東京大学大学院工学系研究科産業機械工学専攻博士課程入学" },
    { year: "2003年3月", event: "東京大学大学院工学系研究科産業機械工学専攻博士課程修了" }
  ],
  career: [
    { year: "2001年4月", position: "財団法人日本学術振興会特別研究員", note: "2003年3月まで" },
    { year: "2003年4月", position: "東京大学助手", department: "大学院工学系研究科産業機械工学専攻" },
    { year: "2004年10月", position: "東京大学講師", department: "大学院情報理工学系研究科知能機械情報工学専攻" },
    { year: "2006年8月", position: "東京大学講師", department: "先端科学技術研究センター" },
    { year: "2008年10月", position: "科学技術振興機構さきがけ研究者", department: "「脳情報の解読と制御」領域", note: "2012年3月まで" },
    { year: "2018年12月", position: "東京大学准教授", department: "先端科学技術研究センター" },
    { year: "2019年4月", position: "東京大学准教授", department: "大学院情報理工学系研究科知能機械情報学専攻" },
    { year: "2023年1月", position: "東京大学教授", department: "大学院情報理工学系研究科知能機械情報学専攻", note: "現職" }
  ],
  degree: {
    year: "2003年3月",
    title_ja: "博士(工学)",
    university: "東京大学",
    thesis_ja: "聴性誘発電位の多点計測による聴皮質の機能構造の解明",
    thesis_en: "Elucidation of functional structure of auditory cortex by multi-point measurement of auditory evoked potentials",
    advisor: "中尾政之教授"
  },
  societies: [
    { name_ja: "実際の設計研究会", name_en: "Practical Design Study Group", note: "会長 畑村洋太郎" },
    { name_ja: "日本生体医工学会", name_en: "Japanese Society for Medical and Biological Engineering" },
    { name_ja: "電気学会", name_en: "Institute of Electrical Engineers of Japan" },
    { name_ja: "北米神経科学会", name_en: "Society for Neuroscience" }
  ],
  shortBio_ja: "2003年東京大学大学院工学系研究科(産業機械工学専攻) 博士課程を修了．同年，東京大学大学院工学系研究科 (産業機械工学専攻) 助手，2004年，同情報理工学系研究科 (知能機械情報学専攻) 講師，2006年より同先端科学技術研究センター講師・准教授を経て，2018年より同大学院情報理工学系研究科（知能機械情報学）准教授，2023年より同教授（現職）．2008–2012 年，科学技術振興機構さきがけ研究者 (「脳情報の解読と制御」領域)．福祉工学，感覚代行デバイスの開発，聴覚生理学など，医学・工学の境界領域の研究に従事．生体医工学会，電気学会，北米神経科学会等会員．博士 (工学)．",
  personalBio_ja: "学部時代，卒業論文の指導教官は畑村洋太郎教授．設計論と失敗学を学びながら，東大医学部耳鼻咽喉科の加我君孝教授，きくち歯科医院の菊池彌太郎博士との共同研究で喉頭摘出者のための発声システムの開発に従事．この研究の初体験が学際的な研究スタイルの原点となった．大学院進学後，学位論文では中尾政之教授のもと，微細加工技術を駆使して，神経活動計測用の微小電極アレイをはじめ，生物系の実験手法の開発に従事．それ以来，実験手法の開発にとどまらず，主に脳機能の解明を目指し，神経工学・神経科学分野を中心に活動している．",
  contact: {
    postalCode: "113-8656",
    address_ja: "東京都文京区本郷７－３－１ 工学部２号館 81B",
    address_en: "Engineering Bldg. 2, Room 81B, 7-3-1 Hongo, Bunkyo-ku, Tokyo",
    tel: "03-5841-6318",
    email: "takahashi@i.u-tokyo.ac.jp"
  }
};

// Generate romanized slug from Japanese name
function generateSlug(japaneseName: string): string {
  const romanizations: Record<string, string> = {
    "石田廉": "ishida",
    "茨目大洋": "barame",
    "海野博亮": "unno",
    "辻川陽向子": "tsujikawa",
    "東口怜弘": "higashiguchi",
    "長谷川蒼弥": "hasegawa",
    "山本康生": "yamamoto"
  };
  return romanizations[japaneseName] || japaneseName.toLowerCase();
}

// Generate English name approximation
function generateEnglishName(japaneseName: string): string {
  const names: Record<string, string> = {
    "石田廉": "Ren Ishida",
    "茨目大洋": "Taiyo Barame",
    "海野博亮": "Hiroaki Unno",
    "辻川陽向子": "Hinako Tsujikawa",
    "東口怜弘": "Akihiro Higashiguchi",
    "長谷川蒼弥": "Soya Hasegawa",
    "山本康生": "Kosei Yamamoto"
  };
  return names[japaneseName] || japaneseName;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Profile Data Updater');
  console.log('='.repeat(60));

  // 1. Add B3 students
  console.log('\n1. Adding B3 students...');
  const undergradDir = path.join(MEMBERS_DIR, 'undergraduates');

  for (const student of profileData.b3Students) {
    const slug = generateSlug(student);
    const englishName = generateEnglishName(student);

    const memberData = {
      id: slug,
      slug: slug,
      name: {
        en: englishName,
        ja: student.replace(/(.)(.)/, '$1 $2') // Add space after first char for surname
      },
      role: {
        en: 'Undergraduate Student (B3, Seminar)',
        ja: '学部3年（ゼミ生）'
      },
      bio: {
        en: 'B3 seminar student.',
        ja: '学部3年ゼミ生。'
      }
    };

    const filePath = path.join(undergradDir, `${slug}.yaml`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, yaml.dump(memberData, { lineWidth: -1 }), 'utf-8');
      console.log(`  Created: ${slug}.yaml`);
    } else {
      console.log(`  Exists: ${slug}.yaml`);
    }
  }

  // 2. Update takahashi.yaml with full CV
  console.log('\n2. Updating Professor Takahashi profile...');
  const takahashiPath = path.join(MEMBERS_DIR, 'faculty/takahashi.yaml');
  const takahashiData = yaml.load(fs.readFileSync(takahashiPath, 'utf-8')) as any;

  // Add education
  takahashiData.education = profileData.education;

  // Add career
  takahashiData.career = profileData.career;

  // Add degree
  takahashiData.degree = profileData.degree;

  // Add societies
  takahashiData.societies = profileData.societies;

  // Add detailed bios
  takahashiData.bio_detailed = {
    en: takahashiData.bio?.en || '',
    ja: profileData.shortBio_ja
  };

  takahashiData.bio_personal = {
    ja: profileData.personalBio_ja
  };

  fs.writeFileSync(takahashiPath, yaml.dump(takahashiData, { lineWidth: -1 }), 'utf-8');
  console.log('  Updated: takahashi.yaml');

  // 3. Update/create contact.yaml
  console.log('\n3. Updating contact info...');
  const contactPath = path.join(CONTENT_DIR, 'contact.yaml');
  const contactData = {
    postalCode: profileData.contact.postalCode,
    address: {
      en: profileData.contact.address_en,
      ja: profileData.contact.address_ja
    },
    tel: profileData.contact.tel,
    email: profileData.contact.email,
    map: {
      campus: 'https://www.u-tokyo.ac.jp/campusmap/cam01_04_03_j.html',
      building: 'https://www.u-tokyo.ac.jp/campusmap/cam01_04_03_j.html'
    }
  };

  fs.writeFileSync(contactPath, yaml.dump(contactData, { lineWidth: -1 }), 'utf-8');
  console.log('  Created/Updated: contact.yaml');

  console.log('\n' + '='.repeat(60));
  console.log('✓ Profile data update complete');
  console.log(`  - B3 students: ${profileData.b3Students.length}`);
  console.log('  - Professor CV: education, career, degree, societies');
  console.log('  - Contact info: address, phone, email');
}

main().catch(console.error);
