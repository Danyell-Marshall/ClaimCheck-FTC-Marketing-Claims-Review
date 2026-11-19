# Start here — ClaimCheck in Google Sheets

The original Reddit Blog Matcher had a simple workflow: open the Google Sheets menu, click a function, and let Apps Script do the work. This project uses that same approach for marketing copy claims.

## The first setup session

1. Open [Google Sheets](https://sheets.google.com) and create a **blank spreadsheet** named `ClaimCheck — Marketing Claims Review`.
2. Choose **Extensions → Apps Script**.
3. Paste this package's `Code.gs` into the existing `Code.gs` file (replace its placeholder code).
4. In the left Files column, click **+ → Script**. Name it `Rules`; paste `Rules.gs`.
5. Add another **Script** named `Gemini`; paste `Gemini.gs`.
6. Add another **Script** named `Tests`; paste `Tests.gs`.
7. Click **+ → HTML**, name it `ReviewSidebar`, and paste the full `ReviewSidebar.html` file.
8. Save. Return to the Google Sheet and reload. A new top-menu option should appear: **FTC ClaimCheck**.
9. Click **FTC ClaimCheck → Paste Copy & Review**. Authorize only after reading the requested permissions.
10. Paste the text from `examples/sample-marketing-copy.txt`. Submit, then inspect `ClaimCheck_Reviews` and `ClaimCheck_Findings`.

You do **not** need to set up Gemini to try the project. You do **not** need GitHub Pages or a server. The optional `appsscript.json` manifest is included for developers who want a versioned manifest, not required for the initial copy-and-paste install.

When it works in your actual Google Sheet, capture screenshots of the real menu, sidebar, and findings tab. Then upload the extracted project folder's contents to a new **public GitHub repository**—without your spreadsheet data, API keys, or client drafts.

For deeper details, read `README.md`.

## Updating from the initial Google Sheets installation

To add relative customer earnings claims (e.g., “Thousands of customers have doubled their income”), replace the content of `Rules.gs` and `Tests.gs` in the existing Apps Script editor with the updated files. Save, reload the spreadsheet, and use **FTC ClaimCheck → Run Self-Tests**; expect **12 self-tests passed**. Then re-submit the original fictional **Test Marketing Campaign** to create a fresh review with **three findings**. Existing review records are retained; this change does not automatically rescan old rows.
