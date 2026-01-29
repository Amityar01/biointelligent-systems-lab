# Plan: Enrich Publications with Abstracts & DOIs

## Current State
- 1287 publications total
- 131 have DOI (~10%)
- 1156 without DOI (~90%) - many are Japanese conference papers

## Goals
1. Fetch abstracts for papers WITH DOI
2. Try to find DOIs for papers WITHOUT (where possible)
3. Store abstracts for semantic search improvement

---

## Phase 1: Fetch Abstracts for Papers with DOI

**API Options:**
| API | Pros | Cons |
|-----|------|------|
| Semantic Scholar | Good abstracts, free | 100 req/5min unauth |
| CrossRef | Official DOI registry | Abstracts often missing |
| OpenAlex | Comprehensive, free | Newer, less coverage of old papers |

**Recommendation:** Use Semantic Scholar first (best abstracts), fallback to CrossRef.

**Script approach:**
```
1. Load all publications
2. Filter those with DOI
3. For each DOI:
   - Try Semantic Scholar: GET /paper/DOI:{doi}?fields=abstract,title
   - If no abstract, try CrossRef: GET /works/{doi}
4. Save abstracts to abstracts.json
5. Rate limit: 1 request/second (safe for both APIs)
```

**Storage:** New file `public/abstracts.json`
```json
{
  "paper-id-1": "Abstract text here...",
  "paper-id-2": "Another abstract..."
}
```

---

## Phase 2: Find DOIs for Papers Without

**Challenge:** ~90% of papers lack DOI. Many are:
- Japanese domestic conferences (学会, 大会)
- Japanese journals without DOI
- Older papers (pre-2010)

**Approach:**
1. Search by title using CrossRef/Semantic Scholar
2. Verify match (author names, year, journal similarity)
3. Only add DOI if high confidence match

**Script approach:**
```
1. Filter papers without DOI
2. For each paper:
   - Search CrossRef by title
   - Check if top result matches (year, author overlap)
   - If match score > threshold, save DOI candidate
3. Output candidates for manual review OR auto-update
```

**Expected results:** Maybe 10-20% of missing DOIs can be found (mostly English journal articles).

---

## Phase 3: Regenerate Embeddings with Abstracts

After collecting abstracts:
1. Update `generate-embeddings.ts` to include abstract in search text
2. Regenerate all embeddings
3. Deploy

This will significantly improve semantic search quality.

---

## Implementation Order

1. **Script: `fetch-abstracts.ts`** - Fetch abstracts for 131 papers with DOI
2. **Script: `find-dois.ts`** - Search for DOIs for papers without
3. **Update embeddings** - Include abstracts in embedding text
4. **Optional: Update YAML files** - Add found DOIs back to source files

---

## Rate Limits & Timing

| Phase | Papers | Rate | Time |
|-------|--------|------|------|
| Fetch abstracts | 131 | 1/sec | ~2 min |
| Find DOIs | 1156 | 1/sec | ~20 min |

---

## Questions to Clarify

1. Store abstracts in separate JSON or add to YAML files?
2. For found DOIs, auto-update YAMLs or manual review first?
3. Skip Japanese-only conference papers for DOI search? (unlikely to have DOIs)
