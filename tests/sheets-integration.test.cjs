const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function makeSandbox() {
  const state = { sheets: {}, fetched: 0, lockReleased: false };
  class Sheet {
    constructor(name) { this.name = name; this.rows = []; }
    getName() { return this.name; }
    getLastRow() { return this.rows.length; }
    getMaxRows() { return 1000; }
    getRange(row, col, numRows, numCols) {
      return {
        setValues: (values) => {
          values.forEach((valuesRow, i) => {
            const rowIndex = row + i - 1;
            if (!this.rows[rowIndex]) this.rows[rowIndex] = [];
            valuesRow.forEach((x, j) => { this.rows[rowIndex][col + j - 1] = x; });
          });
          return this;
        },
        setBackground: () => this.getRange(row, col, numRows, numCols),
        setFontColor: () => this.getRange(row, col, numRows, numCols),
        setFontWeight: () => this.getRange(row, col, numRows, numCols),
        setWrap: () => this.getRange(row, col, numRows, numCols),
        setDataValidation: () => this.getRange(row, col, numRows, numCols)
      };
    }
    setFrozenRows() {}
    setRowHeight() {}
    setColumnWidth() {}
  }
  const spreadsheet = {
    getSheetByName: name => state.sheets[name] || null,
    insertSheet: name => (state.sheets[name] = new Sheet(name)),
    setActiveSheet: () => {},
    toast: () => {}
  };
  const sandbox = {
    Date,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      flush: () => {},
      newDataValidation: () => ({ requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return {}; } })
    },
    LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() { state.lockReleased = true; } }) },
    Utilities: { getUuid: () => '12345678-aaaa-bbbb-cccc' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    UrlFetchApp: { fetch: () => { state.fetched++; throw new Error('Unexpected network call.'); } }
  };
  vm.createContext(sandbox);
  for (const f of ['Rules.gs', 'Gemini.gs', 'Code.gs']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), sandbox, { filename: f });
  }
  return { sandbox, state };
}

test('Review creates sheets, logs a review and actionable findings', () => {
  const { sandbox, state } = makeSandbox();
  const result = sandbox.reviewAndSave({title:'Campaign A', sourceUrl:'https://example.com', copy:'Our software guarantees results. Start your free trial.', useGemini:false});
  assert.equal(result.reviewId, 'CC-12345678');
  assert.ok(result.findingCount >= 2);
  assert.equal(state.sheets.ClaimCheck_Reviews.rows.length, 2);
  assert.equal(state.sheets.ClaimCheck_Reviews.rows[1][8], 'Our software guarantees results. Start your free trial.');
  assert.equal(state.sheets.ClaimCheck_Findings.rows.length, 1 + result.findingCount);
  assert.ok(state.sheets.ClaimCheck_Findings.rows.slice(1).every(r=>r[10]==='Needs review'));
  assert.ok(state.sheets.ClaimCheck_Findings.rows.slice(1).every(r=>r[8].startsWith('https://www.ftc.gov/')));
  assert.equal(state.fetched,0);
  assert.equal(state.lockReleased,true);
});

test('A neutral draft is logged but never called compliant', () => {
  const { sandbox, state } = makeSandbox();
  const result = sandbox.reviewAndSave({title:'Neutral',copy:'Our team meets on Tuesdays to plan the editorial calendar.'});
  assert.equal(result.findingCount, 0);
  assert.equal(state.sheets.ClaimCheck_Findings.rows.length, 1);
  assert.match(state.sheets.ClaimCheck_Reviews.rows[1][7], /not a compliance determination/);
});

test('Formula-looking copy and title are kept as text in Sheets', () => {
  const { sandbox, state } = makeSandbox();
  sandbox.reviewAndSave({title:'=IMPORTXML("test")',copy:'=HYPERLINK("test") guarantees results.'});
  assert.ok(state.sheets.ClaimCheck_Reviews.rows[1][2].startsWith("'="));
  assert.ok(state.sheets.ClaimCheck_Findings.rows[1][5].startsWith("'="));
});

test('Invalid URL fails without writing data', () => {
  const { sandbox, state } = makeSandbox();
  assert.throws(() => sandbox.reviewAndSave({title:'Test',copy:'Free trial',sourceUrl:'javascript:alert(1)'}), /Source URL/);
  assert.equal(Object.keys(state.sheets).length, 0);
});

test('Gemini failure does not erase rule findings or leak a key', () => {
  const { sandbox, state } = makeSandbox();
  const result = sandbox.reviewAndSave({title:'AI check',copy:'Our program guarantees results.',useGemini:true});
  assert.equal(result.aiCount, 0);
  assert.ok(result.ruleCount >= 1);
  assert.match(result.aiMessage, /GEMINI_API_KEY is not configured/);
  assert.equal(state.fetched, 0);
  assert.equal(state.sheets.ClaimCheck_Reviews.rows.length, 2);
});

test('Blank copy is rejected before any sheets are created', () => {
  const { sandbox, state } = makeSandbox();
  assert.throws(() => sandbox.reviewAndSave({copy:' '}), /Paste/);
  assert.equal(Object.keys(state.sheets).length, 0);
});
