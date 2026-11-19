# Test results and verification boundaries

## Local source-level checks

**November 2026 — Node.js 22.16.0**

Run `node --test tests/*.test.cjs` from the repository root.

- **30 of 30 automated checks passed (after customer-earnings rule regression fix).**
- 24 direct rule engine checks exercise the actual `Rules.gs` source via the Node `vm` runtime: flag categories, no-match behavior, input validation, duplicate prevention, excerpt content, and source domains.
- 6 integration-style checks use mock Google Apps Script services to execute `Code.gs`, checking how review IDs, copy, individual findings, reviewer statuses, guidance references, data escaping and error handling are recorded.
- Test results **do not measure legal issue identification accuracy**. We do not have a labeled FTC enforcement dataset, and passing tests cannot establish that individual claims violate the law.

## Browser-local preview (not a deployed Google Sheets test)

A Chromium browser executed `ReviewSidebar.html` with an explicitly simulated `google.script.run` backend. The form rendered, accepted fictional marketing copy, updated the character count, handled a submit interaction and displayed the returned review cards. See `screenshots/`. The preview uses a simulated Google bridge and **does not prove** Apps Script authorization, Sheets permissions, data writing inside Google, or Gemini API connectivity.

## Live Google Sheets testing (November 18–19, 2026)

Using fictional marketing copy, the owner tested ClaimCheck in a real, container-bound Google spreadsheet. The application showed its custom menu and sidebar, and the initial self-test reported **11 checks passed**. After a `CUSTOMER_EARNINGS` rule revision, the subsequent test review produced three high-priority editorial review points instead of two. The original test and subsequent runs were preserved as distinct records in `ClaimCheck_Reviews`, and individual excerpts were written into `ClaimCheck_Findings`. The first test review also showed the reviewer-status dropdown. See `screenshots/03-live-claims-review.png` and `screenshots/04-live-review-history.png`.

The owner also enabled the optional Gemini pass. An earlier attempt logged HTTP 404; a subsequent attempt logged no error but returned **0 AI suggestions**. This is not proof of successful Gemini inference because zero suggestions may also result from filtering or an unobserved failure path. API integration and status reporting still need an independent diagnostic test.

## Still not proven

- End-to-end AI suggestion generation from the live Gemini API.
- Comprehensive legal accuracy, precision/recall, or the correctness of any legal conclusion.
- Disclosure visibility or net impression involving page design, neighboring imagery, or context.
- Production-readiness for external users, billing/performance at scale, or authorization outside the author's own spreadsheet.

## November 2026 customer earnings regression test

A real Google Sheets smoke test identified an omitted fictional sentence: “Thousands of customers have doubled their income using our proven method.” The dollar-based `EARNINGS` pattern did not match a relative income change, and `TYPICAL_RESULTS` did not match an aggregate customer outcome. Rule `CUSTOMER_EARNINGS` now flags relative financial outcomes (including doubled/tripled income and increased revenue) for human review. New source-level tests cover the reported sentence, two variant outcomes, a neutral negative example, and the complete three-sentence test copy. Historical review rows are unchanged; run a new review to see the new finding.
