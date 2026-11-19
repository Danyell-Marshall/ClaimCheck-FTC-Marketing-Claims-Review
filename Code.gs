/**
 * ClaimCheck for Google Sheets — container-bound Apps Script.
 * Create a Google Sheet, choose Extensions > Apps Script, and copy this file.
 * All reviews stay in the user's Google spreadsheet unless the reviewer
 * explicitly enables the optional Gemini second pass.
 */
var CLAIMCHECK_REVIEW_HEADERS = [
  'Timestamp', 'Review ID', 'Document / campaign', 'Source URL', 'Characters',
  'Rule findings', 'AI suggestions', 'Review note', 'Original pasted copy'
];
var CLAIMCHECK_FINDING_HEADERS = [
  'Timestamp', 'Review ID', 'Document / campaign', 'Priority', 'Category',
  'Flagged excerpt', 'Reason to review', 'Reviewer question', 'FTC reference',
  'Detection method', 'Reviewer status', 'Reviewer notes'
];
var CLAIMCHECK_STATUSES = [
  'Needs review', 'Evidence requested', 'Revised', 'Supported after review', 'Not applicable'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('FTC ClaimCheck')
    .addItem('Paste Copy & Review', 'showClaimCheckSidebar')
    .addItem('Review Selected Cell', 'reviewSelectedCell')
    .addSeparator()
    .addItem('Open Findings', 'openClaimFindings')
    .addItem('Run Self-Tests', 'runClaimCheckSelfTests')
    .addItem('About / Gemini Setup', 'showClaimCheckAbout')
    .addToUi();
}

function showClaimCheckSidebar() {
  initializeClaimCheckSheets_();
  var html = HtmlService.createHtmlOutputFromFile('ReviewSidebar')
    .setTitle('FTC ClaimCheck');
  SpreadsheetApp.getUi().showSidebar(html);
}

function reviewSelectedCell() {
  var cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  var copy = String(cell.getDisplayValue() || '').trim();
  if (!copy) {
    SpreadsheetApp.getUi().alert('Select a cell containing marketing copy, then try again.');
    return;
  }
  var result = reviewAndSave({ title: 'Cell ' + cell.getA1Notation(), copy: copy, sourceUrl: '', useGemini: false });
  SpreadsheetApp.getActive().toast(result.findingCount + ' possible review point(s) recorded.', 'FTC ClaimCheck');
  openClaimFindings();
}

function showClaimCheckAbout() {
  SpreadsheetApp.getUi().alert(
    'FTC ClaimCheck — Editorial Preflight',
    'Paste marketing copy to flag selected objective claims, disclosure-related language, and unsupported promises for human editorial review. It does not determine FTC compliance.\n\n' +
    'Optional Gemini second pass: In Extensions > Apps Script > Project Settings > Script Properties, add GEMINI_API_KEY. Optionally set GEMINI_MODEL (default: gemini-2.5-flash). Select the opt-in checkbox when you want to send pasted copy to that external API.\n\n' +
    'See the repository README and FTC reference links for full limitations.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function getClaimCheckSettings() {
  return {
    geminiConfigured: !!PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
    maxCharacters: 30000
  };
}

/** Public entry point for the sidebar; checks input before writing any sheets. */
function reviewAndSave(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('No review data received.');
  var copy = String(payload.copy || '');
  var title = String(payload.title || 'Untitled copy').trim().slice(0, 150) || 'Untitled copy';
  var sourceUrl = String(payload.sourceUrl || '').trim().slice(0, 500);
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    throw new Error('Source URL must begin with http:// or https://, or be left blank.');
  }
  var report = analyzeClaimText(copy);
  var aiFindings = [];
  var aiMessage = '';

  // Explicit opt-in required. No external AI call in the default review flow.
  if (payload.useGemini === true) {
    try {
      aiFindings = runGeminiSecondPass_(copy, report.findings);
    } catch (err) {
      aiMessage = 'AI second pass unavailable: ' + String(err.message || err);
    }
  }

  var allFindings = report.findings.concat(aiFindings);
  var lock = LockService.getDocumentLock();
  if (!lock) throw new Error('Use this project from a Google Sheet, not as a standalone script.');
  lock.waitLock(30000);
  var id;
  try {
    var sheets = initializeClaimCheckSheets_();
    var now = new Date();
    id = 'CC-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    var summaryNote = aiMessage || (report.truncated ? 'Rule results capped at 100.' : 'Screening only; not a compliance determination.');
    var row = [now, id, title, sourceUrl, copy.length, report.findings.length, aiFindings.length, summaryNote, copy];
    writeSafeRows_(sheets.reviews, [row], 3); // Title & URL text cells sanitised

    if (allFindings.length) {
      var rows = allFindings.map(function (f) {
        return [now, id, title, f.priority, f.category, f.excerpt, f.why, f.question,
          f.sourceUrl, f.origin, 'Needs review', ''];
      });
      writeSafeRows_(sheets.findings, rows, 3);
      applyStatusValidation_(sheets.findings);
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return {
    reviewId: id,
    findingCount: allFindings.length,
    ruleCount: report.findings.length,
    aiCount: aiFindings.length,
    aiMessage: aiMessage,
    truncated: report.truncated,
    findings: allFindings.slice(0, 30).map(function (f) {
      return { priority: f.priority, category: f.category, excerpt: f.excerpt,
        question: f.question, sourceUrl: f.sourceUrl, origin: f.origin };
    })
  };
}

function initializeClaimCheckSheets_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var reviews = spreadsheet.getSheetByName('ClaimCheck_Reviews');
  var findings = spreadsheet.getSheetByName('ClaimCheck_Findings');
  if (!reviews) reviews = spreadsheet.insertSheet('ClaimCheck_Reviews');
  if (!findings) findings = spreadsheet.insertSheet('ClaimCheck_Findings');
  setupHeadersIfEmpty_(reviews, CLAIMCHECK_REVIEW_HEADERS);
  setupHeadersIfEmpty_(findings, CLAIMCHECK_FINDING_HEADERS);
  return { reviews: reviews, findings: findings };
}

function setupHeadersIfEmpty_(sheet, headers) {
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#531A4A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.setRowHeight(1, 38);
  sheet.getRange(1, 1, 1, headers.length).setWrap(true);
  sheet.setColumnWidth(1, 145);
  sheet.setColumnWidth(2, 135);
  sheet.setColumnWidth(3, 210);
  if (sheet.getName() === 'ClaimCheck_Reviews') sheet.setColumnWidth(9, 420);
  if (sheet.getName() === 'ClaimCheck_Findings') {
    sheet.setColumnWidth(5, 205);
    sheet.setColumnWidth(6, 360);
    sheet.setColumnWidth(7, 340);
    sheet.setColumnWidth(8, 340);
    sheet.setColumnWidth(9, 320);
    sheet.setColumnWidth(11, 170);
    sheet.setColumnWidth(12, 230);
  }
}

/** Prevent pasted prose from being interpreted as spreadsheet formulas. */
function safeSheetString_(value) {
  if (typeof value !== 'string') return value;
  return /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
}

function writeSafeRows_(sheet, rows, startSanitizeColumn) {
  if (!rows.length) return;
  var safe = rows.map(function (row) {
    return row.map(function (val, col) {
      return col + 1 >= startSanitizeColumn ? safeSheetString_(val) : val;
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, safe.length, safe[0].length).setValues(safe);
}

function applyStatusValidation_(sheet) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CLAIMCHECK_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 11, Math.max(1, sheet.getMaxRows() - 1), 1).setDataValidation(rule);
}

function openClaimFindings() {
  var sheets = initializeClaimCheckSheets_();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheets.findings);
}
