# Architecture and editorial workflow

## How a review travels through the application

```text
A Google spreadsheet
  └── Custom menu: FTC ClaimCheck
       ├── Paste Copy & Review → ReviewSidebar.html
       │      └── google.script.run.reviewAndSave(...)
       │             ├── Rules.gs → 11 deterministic, transparent patterns
       │             ├── [opt-in] Gemini.gs → Gemini API (external)
       │             └── Code.gs → append data to Sheets
       └── Review Selected Cell → reviewAndSave(...)

Google Sheet tabs
  ├── ClaimCheck_Reviews  → timestamp, review ID, document, URL, counts, original copy
  └── ClaimCheck_Findings → excerpts, rule category, risk priority, guidance,
                             question, source link, reviewer status and notes
```

## Architectural decisions

- **Bound to Sheets:** Mirrors the useful behavior of a custom spreadsheet menu without requiring users to install desktop software, manage a server, or deploy a public web application.
- **Paste-first:** Eliminates webpage crawling and associated scraping/formatting complications. Reviewers can use copy from emails, landing pages, ads, and draft documents.
- **Deterministic first pass:** Rules are auditable, editable, testable, inexpensive, and can run without external network access. Each provides a concrete verification question and an official FTC source.
- **Optional generative AI:** Only runs after specific user opt-in and configuration. It is not a compliance classifier, and generated excerpts must be verified as literal spans of input copy.
- **Audit trail:** Each review receives a unique ID; original copy is retained with the review; related findings are appended to a second sheet. Review status and notes are editable by a person.
- **Anti-formula handling:** User-provided text that starts with formula-like characters is escaped before being written to spreadsheet cells.
- **Single-spreadsheet concurrency:** `LockService.getDocumentLock()` guards append operations.
- **No automatic approvals:** There is no 'passed compliance' status, approval percentage, automated publishing, or claim that the tool has verified evidence.

## Stored data and permissions

The Google account running the script controls access to the spreadsheet. The base app needs permission to create/update tabs and rows within that spreadsheet. The optional Gemini feature also uses `UrlFetchApp` to send the pasted text to an external model endpoint. Auth scopes are determined by Apps Script when the script is first authorized; always review them.

API credentials are read from Script Properties (`GEMINI_API_KEY` and optional `GEMINI_MODEL`) and should never appear in source control.

## Follow-up engineering opportunities

- Make pattern rules editable through a `ClaimCheck_Rules` tab, with versioned rule releases.
- Add a document comparison mode and evidence-link attachment for reviewers.
- Add structural markup checks for article footnotes and explicit disclosures.
- Create a separate UI for human reviewer notes and evidence approval.
- Benchmark on an independently labeled test corpus before making any accuracy claims.
- Expand checklists for specialized regulated industries only with domain-expert review.
