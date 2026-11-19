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

## Not yet run / not proven

- No live install and user authorization inside the owner's Google Sheets account.
- No real Gemini API request, billing/quota check, or model-availability check.
- No end-to-end test using real spreadsheet permissions and review status editing.
- No externally validated precision/recall measurement or comprehensive legal rule-set audit.
- No review of layouts, adjacent images, disclosures, or the net impression of an actual ad.

## First live smoke test to perform after installation

1. Create the new Sheet and paste Apps Script files per README.
2. Reload to verify `FTC ClaimCheck` menu appears.
3. Use `FTC ClaimCheck → Run Self-Tests`; expect **12 checks passed**.
4. Open `Paste Copy & Review` and paste the fictional sample from `examples/sample-marketing-copy.txt`.
5. Verify `ClaimCheck_Reviews` has one row with timestamp, ID, summary and full pasted copy.
6. Verify `ClaimCheck_Findings` has individual rows with excerpts, FTC links, reviewer statuses and editable notes.
7. Review a harmless sample and confirm the app doesn't label it compliant.
8. Only if desired, configure Gemini in Script Properties and perform one **consented** test with fictional, non-sensitive copy.

If any of those checks fail, do not describe the Google Sheets app as fully deployed or operational in public materials until repaired.

## November 2026 customer earnings regression test

A real Google Sheets smoke test identified an omitted fictional sentence: “Thousands of customers have doubled their income using our proven method.” The dollar-based `EARNINGS` pattern did not match a relative income change, and `TYPICAL_RESULTS` did not match an aggregate customer outcome. Rule `CUSTOMER_EARNINGS` now flags relative financial outcomes (including doubled/tripled income and increased revenue) for human review. New source-level tests cover the reported sentence, two variant outcomes, a neutral negative example, and the complete three-sentence test copy. Historical review rows are unchanged; run a new review to see the new finding.
