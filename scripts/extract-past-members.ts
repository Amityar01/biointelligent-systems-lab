import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../content');

// Past members data extracted from old_members.html (2019-2024)
const pastMembersData: Record<string, Record<string, string[]>> = {
  "2024": {
    faculty: ["高橋宏知"],
    associateProfessor: ["白松（磯口）知世"],
    assistantProfessor: ["秋田大"],
    postdoc: ["Amit Yaron"],
    d3: ["Usman Abid Khan", "可部泰生", "張倬"],
    d2: [],
    d1: ["大島果林", "飯塚理子", "張赫"],
    m2: ["岡田大吾", "金井智美", "許鶴馨", "高木永遠", "高野雄基"],
    m1: ["大沼陽介", "川上航", "川原佑太", "清水聡太", "竹花和志", "星野有佐"],
    b4: ["池谷賢人", "金子俊一郎", "鎌谷一生", "キムジュンモ", "間山輝紀"],
    b3: ["青山康人", "生駒ひなた", "松川直生", "栁沼大輝"],
    visitors: ["Florian Willi (ETH Zurich)", "Mervan Samil Kacmaz (Technical University of Darmstadt)", "小島丈 (University of Pennsylvania)"],
    researchStudents: ["熊谷真一（自治医大）"],
    staff: ["本田奈津江", "冨永真理子"]
  },
  "2023": {
    faculty: ["高橋宏知"],
    associateProfessor: ["白松（磯口）知世"],
    assistantProfessor: ["秋田大"],
    postdoc: ["Amit Yaron"],
    d3: ["Usman Abid Khan", "可部泰生"],
    d2: ["張倬"],
    d1: [],
    m2: ["大島果林", "岡田大吾", "山木崚太郎"],
    m1: ["金井智美", "許鶴馨", "高木永遠", "高野雄基"],
    b4: ["浦彩人", "大沼陽介", "清水聡太", "川原佑太", "西島皓平", "星野有佐"],
    b3: ["金子俊一郎", "鎌谷一生", "間山輝紀", "池谷賢人", "長谷川恭平", "佐藤諒平"],
    visitors: [],
    researchStudents: ["熊谷真一（自治医大）"],
    staff: ["本田奈津江", "冨永真理子"]
  },
  "2022": {
    faculty: ["高橋宏知"],
    assistantProfessor: ["白松（磯口）知世"],
    postdoc: ["秋田大", "Amit Yaron"],
    d3: [],
    d2: ["Usman Abid Khan", "可部泰生"],
    d1: ["張倬"],
    m2: ["石田直輝", "諏訪瑛介"],
    m1: ["大島果林", "岡田大吾", "山木崚太郎"],
    b4: ["金井智美", "許鶴馨", "高木永遠", "高野雄基"],
    b3: ["澤口昇吾", "清水聡太"],
    visitors: [],
    researchStudents: ["熊谷真一（自治医大）"],
    staff: ["本田奈津江", "冨永真理子"]
  },
  "2021": {
    associateProfessor: ["高橋宏知"],
    assistantProfessor: ["白松（磯口）知世"],
    postdoc: ["Amit Yaron"],
    d3: ["池田成満"],
    d2: ["Usman Abid Khan", "可部泰生"],
    d1: ["張倬"],
    m2: ["高橋斗威", "松村茜"],
    m1: ["石田直輝", "諏訪瑛介"],
    b4: ["大島果林", "岡田大吾", "澤田晴登", "山木崚太郎"],
    b3: ["金井智美", "高野雄基", "チューワニチ パンチャニット", "秀未智"],
    visitors: [],
    researchStudents: ["熊谷真一（自治医大）"],
    staff: ["松田理恵子", "冨永真理子"]
  },
  "2020": {
    associateProfessor: ["高橋宏知"],
    assistantProfessor: ["白松（磯口）知世"],
    d3: ["窪田智之"],
    d2: ["池田成満"],
    d1: ["Usman Abid Khan", "可部泰生", "安田秀策"],
    m2: ["伊藤圭基", "木村武龍", "森叶人", "矢田浩章"],
    m1: ["高橋斗威", "松村茜"],
    b4: ["石田直輝", "諏訪瑛介"],
    b3: ["石橋亨祐", "岡田大吾", "澤田晴登", "山木凌太郎"],
    visitors: [],
    researchStudents: ["Du Han"],
    staff: ["冨永真理子"]
  },
  "2019": {
    associateProfessor: ["高橋宏知"],
    specialAssistantProfessor: ["白松（磯口）知世"],
    d3: ["三田毅", "石津光太郎", "窪田智之"],
    d2: [],
    d1: ["池田成満", "Usman Abid Khan"],
    m2: ["可部泰生", "阿部泰己", "櫻山和浩"],
    m1: ["伊藤圭基", "木村武龍", "森叶人", "矢田浩章"],
    b4: ["高橋斗威", "大澤龍太"],
    b3: ["平林和気", "上野永遠", "内田智也", "有川悦史"],
    visitors: [],
    researchStudents: ["Du han"],
    staff: ["冨永真理子"]
  }
};

// Extract unique alumni (people who are no longer in the lab)
function extractAlumni(): any[] {
  const currentMembers = new Set([
    "高橋宏知", "白松（磯口）知世", "秋田大", "Amit Yaron",
    "Usman Abid Khan", "可部泰生", "張倬",
    "大島果林", "飯塚理子", "張赫",
    "許鶴馨", "山木凌太朗",
    "大沼陽介", "川上航", "川原佑太", "清水聡太", "竹花和志", "星野有佐",
    "池谷賢人", "金子俊一郎", "鎌谷一生", "間山輝紀", "イムチェヒョン", "キムジュンモ",
    "安部飛悠河", "生駒ひなた", "信夫行彦", "柴崎裕覇", "栁沼大輝",
    "Thaïs Cantegrel", "Montse Flores Garcia", "熊谷真一",
    "本田奈津江", "冨永真理子", "深山理"
  ]);

  const alumni: any[] = [];
  const seenNames = new Set<string>();

  // Role categories to check
  const roleCategories = [
    { key: 'faculty', en: 'Professor', ja: '教授' },
    { key: 'associateProfessor', en: 'Associate Professor', ja: '准教授' },
    { key: 'assistantProfessor', en: 'Assistant Professor', ja: '助教' },
    { key: 'specialAssistantProfessor', en: 'Special Assistant Professor', ja: '特任助教' },
    { key: 'postdoc', en: 'Postdoctoral Researcher', ja: '博士研究員' },
    { key: 'd3', en: 'PhD Student (D3)', ja: '博士課程3年' },
    { key: 'd2', en: 'PhD Student (D2)', ja: '博士課程2年' },
    { key: 'd1', en: 'PhD Student (D1)', ja: '博士課程1年' },
    { key: 'm2', en: "Master's Student (M2)", ja: '修士課程2年' },
    { key: 'm1', en: "Master's Student (M1)", ja: '修士課程1年' },
    { key: 'b4', en: 'Undergraduate (B4)', ja: '学部4年' },
    { key: 'b3', en: 'Undergraduate (B3)', ja: '学部3年' },
    { key: 'visitors', en: 'Visiting Researcher', ja: '客員研究員' },
    { key: 'researchStudents', en: 'Research Student', ja: '研究生' },
    { key: 'staff', en: 'Staff', ja: 'スタッフ' }
  ];

  // Go through years from oldest to newest to track when people left
  const years = Object.keys(pastMembersData).sort();

  for (const year of years) {
    const yearData = pastMembersData[year];

    // Collect all members from this year with their roles
    for (const category of roleCategories) {
      const members = yearData[category.key] || [];
      for (const name of members) {
        // Clean up the name (remove affiliations in parentheses for comparison)
        const cleanName = name.replace(/（.*）|\(.*\)/g, '').trim();

        if (!currentMembers.has(cleanName) && !seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          alumni.push({
            name: cleanName,
            originalName: name,
            lastYear: parseInt(year),
            lastRole: category.en,
            lastRoleJa: category.ja
          });
        }
      }
    }
  }

  return alumni;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Past Members Extractor');
  console.log('='.repeat(60));

  // Create alumni directory
  const alumniDir = path.join(CONTENT_DIR, 'members/alumni');
  if (!fs.existsSync(alumniDir)) {
    fs.mkdirSync(alumniDir, { recursive: true });
  }

  // Extract alumni
  const alumni = extractAlumni();
  console.log(`\nFound ${alumni.length} alumni (past members no longer in lab)`);

  // Save yearly snapshots
  const historyDir = path.join(CONTENT_DIR, 'members/history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  for (const [year, data] of Object.entries(pastMembersData)) {
    const filePath = path.join(historyDir, `${year}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(data, { lineWidth: -1 }), 'utf-8');
    console.log(`  Created: history/${year}.yaml`);
  }

  // Create alumni summary file
  const alumniSummary = {
    totalAlumni: alumni.length,
    byYear: {} as Record<string, number>,
    members: alumni.sort((a, b) => b.lastYear - a.lastYear)
  };

  for (const alum of alumni) {
    const year = alum.lastYear.toString();
    alumniSummary.byYear[year] = (alumniSummary.byYear[year] || 0) + 1;
  }

  fs.writeFileSync(
    path.join(CONTENT_DIR, 'members/alumni-summary.yaml'),
    yaml.dump(alumniSummary, { lineWidth: -1 }),
    'utf-8'
  );
  console.log('  Created: alumni-summary.yaml');

  console.log('\n' + '='.repeat(60));
  console.log('Past members extraction complete');
  console.log(`  - Years of history: ${Object.keys(pastMembersData).length}`);
  console.log(`  - Alumni identified: ${alumni.length}`);
}

main().catch(console.error);
