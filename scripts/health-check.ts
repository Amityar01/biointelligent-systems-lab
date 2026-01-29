/**
 * Health check script for publication YAML files
 *
 * Validates:
 * - Required fields (id, title)
 * - Publication date (year or date field)
 * - Duplicates (same id or same DOI)
 * - Missing abstracts (helps embedding quality)
 * - Orphaned entries (no DOI and no URL)
 * - YAML validity
 *
 * Usage: npm run health-check
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATE_REGEX = /^\d{4}(-\d{2})?(-\d{2})?$/;
const MIN_ABSTRACT_LENGTH = 50;

interface Paper {
  id?: string;
  doi?: string;
  title?: string;
  date?: string;
  year?: number;
  abstract?: string;
  url?: string;
  type?: string;
  journal?: string;
  conference?: string;
  authors?: string[];
  _source?: string;
}

interface Issue {
  source?: string;
  id?: string;
  type: string;
  message: string;
  severity: 'error' | 'warning';
}

function loadYamlPublications(dir: string): { papers: Paper[]; parseErrors: Issue[] } {
  const papers: Paper[] = [];
  const parseErrors: Issue[] = [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Paper | Paper[];

      if (Array.isArray(data)) {
        for (const paper of data) {
          papers.push({ ...paper, _source: file });
        }
      } else if (data) {
        papers.push({ ...data, _source: file });
      }
    } catch (err) {
      parseErrors.push({
        source: file,
        type: 'yaml_invalid',
        message: `Malformed YAML: ${(err as Error).message}`,
        severity: 'error',
      });
    }
  }

  return { papers, parseErrors };
}

function checkRequiredFields(paper: Paper): Issue[] {
  const issues: Issue[] = [];

  if (!paper.id) {
    issues.push({
      source: paper._source,
      type: 'missing_id',
      message: 'Missing required field: id',
      severity: 'error',
    });
  }

  if (!paper.title) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'missing_title',
      message: 'Missing required field: title',
      severity: 'error',
    });
  }

  return issues;
}

function checkDate(paper: Paper): Issue[] {
  const issues: Issue[] = [];

  // Must have either year or date
  if (!paper.year && !paper.date) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'missing_date',
      message: 'Missing publication date (year or date field)',
      severity: 'warning',
    });
  }

  // If date exists, check format
  if (paper.date && !DATE_REGEX.test(paper.date)) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'invalid_date_format',
      message: `Invalid date format "${paper.date}". Expected YYYY, YYYY-MM, or YYYY-MM-DD`,
      severity: 'error',
    });
  }

  return issues;
}

function checkAbstract(paper: Paper): Issue[] {
  const issues: Issue[] = [];

  if (!paper.abstract || paper.abstract.trim().length === 0) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'missing_abstract',
      message: 'Missing abstract',
      severity: 'warning',
    });
  } else if (paper.abstract.trim().length < MIN_ABSTRACT_LENGTH) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'short_abstract',
      message: `Abstract too short (${paper.abstract.trim().length} chars)`,
      severity: 'warning',
    });
  }

  return issues;
}

function checkOrphaned(paper: Paper): Issue[] {
  const issues: Issue[] = [];

  if (!paper.doi && !paper.url) {
    issues.push({
      source: paper._source,
      id: paper.id,
      type: 'orphaned',
      message: 'No DOI and no URL',
      severity: 'warning',
    });
  }

  return issues;
}

function checkDuplicates(papers: Paper[]): Issue[] {
  const issues: Issue[] = [];
  const seenIds = new Map<string, string>();
  const seenDois = new Map<string, string>();

  for (const paper of papers) {
    if (paper.id) {
      const existing = seenIds.get(paper.id);
      if (existing) {
        issues.push({
          source: paper._source,
          id: paper.id,
          type: 'duplicate_id',
          message: `Duplicate ID (first in ${existing})`,
          severity: 'error',
        });
      } else {
        seenIds.set(paper.id, paper._source || 'unknown');
      }
    }

    if (paper.doi) {
      const doiNormalized = paper.doi.toLowerCase().trim();
      const existing = seenDois.get(doiNormalized);
      if (existing) {
        issues.push({
          source: paper._source,
          id: paper.id,
          type: 'duplicate_doi',
          message: `Duplicate DOI (first in ${existing})`,
          severity: 'error',
        });
      } else {
        seenDois.set(doiNormalized, paper._source || 'unknown');
      }
    }
  }

  return issues;
}

function runHealthCheck(papers: Paper[], parseErrors: Issue[]): void {
  const allIssues: Issue[] = [...parseErrors];

  for (const paper of papers) {
    allIssues.push(
      ...checkRequiredFields(paper),
      ...checkDate(paper),
      ...checkAbstract(paper),
      ...checkOrphaned(paper),
    );
  }

  allIssues.push(...checkDuplicates(papers));

  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  // Group by type
  const byType = new Map<string, Issue[]>();
  for (const issue of allIssues) {
    const existing = byType.get(issue.type) || [];
    existing.push(issue);
    byType.set(issue.type, existing);
  }

  // Print results
  console.log(`Files: ${papers.length} parsed, ${parseErrors.length} errors\n`);

  console.log(`=== Issues ===\n`);
  for (const [type, issues] of byType) {
    const icon = issues[0].severity === 'error' ? '✗' : '⚠';
    console.log(`${icon} ${type}: ${issues.length}`);
  }

  if (errors.length > 0) {
    console.log(`\n=== Errors ===\n`);
    for (const issue of errors.slice(0, 10)) {
      console.log(`  ${issue.source}: ${issue.message}`);
    }
    if (errors.length > 10) console.log(`  ... +${errors.length - 10} more`);
  }

  // Stats
  const stats = {
    total: papers.length,
    withDoi: papers.filter(p => p.doi).length,
    withAbstract: papers.filter(p => p.abstract && p.abstract.length >= MIN_ABSTRACT_LENGTH).length,
    withDate: papers.filter(p => p.year || p.date).length,
    byType: {} as Record<string, number>,
  };

  for (const paper of papers) {
    const type = paper.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }

  console.log(`\n=== Stats ===\n`);
  console.log(`DOI:      ${stats.withDoi}/${stats.total} (${((stats.withDoi / stats.total) * 100).toFixed(0)}%)`);
  console.log(`Abstract: ${stats.withAbstract}/${stats.total} (${((stats.withAbstract / stats.total) * 100).toFixed(0)}%)`);
  console.log(`Date:     ${stats.withDate}/${stats.total} (${((stats.withDate / stats.total) * 100).toFixed(0)}%)`);

  console.log(`\nBy type:`);
  for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // Exit
  if (errors.length > 0) {
    console.log(`\n✗ Failed: ${errors.length} errors, ${warnings.length} warnings`);
    process.exit(1);
  } else {
    console.log(`\n✓ Passed: ${warnings.length} warnings`);
  }
}

// Main
const pubsDir = path.join(process.cwd(), 'content', 'publications');

if (!fs.existsSync(pubsDir)) {
  console.error(`Directory not found: ${pubsDir}`);
  process.exit(1);
}

console.log(`\n=== Health Check ===\n`);
const { papers, parseErrors } = loadYamlPublications(pubsDir);
runHealthCheck(papers, parseErrors);
