/** Run from the Google Apps Script editor or FTC ClaimCheck > Run Self-Tests. */
function runClaimCheckSelfTests() {
  var checks = [
    { text: 'Our program guarantees results.', id: 'ABSOLUTE_PROMISE' },
    { text: 'Make $5,000 per month with our course.', id: 'EARNINGS' },
    { text: 'Thousands of customers have doubled their income using our proven method.', id: 'CUSTOMER_EARNINGS' },
    { text: 'Clinically proven to improve outcomes.', id: 'HEALTH_CURE' },
    { text: 'We use affiliate links in our review.', id: 'ENDORSEMENT_DISCLOSURE' },
    { text: 'The #1 platform for teams.', id: 'SUPERLATIVE' },
    { text: 'Start your free trial.', id: 'NO_COST' },
    { text: 'Only 3 spots left.', id: 'URGENCY' },
    { text: 'Our process is carbon neutral.', id: 'ENVIRONMENT' },
    { text: 'This process is fully automated.', id: 'AI_CAPABILITY' },
    { text: 'Our software is 100% secure.', id: 'RISK_ELIMINATION' }
  ];
  var passed = 0;
  checks.forEach(function (c) {
    var found = analyzeClaimText(c.text).findings.some(function (f) { return f.ruleId === c.id; });
    if (!found) throw new Error('FAILED ' + c.id + ' in: ' + c.text);
    passed++;
  });
  if (analyzeClaimText('Our team meets on Tuesdays to review the editorial calendar.').findings.length !== 0) {
    throw new Error('FAILED: neutral copy should have no pattern matches.');
  }
  passed++;
  SpreadsheetApp.getUi().alert(passed + ' self-tests passed. Rule matching only; not legal accuracy validation.');
  return passed;
}
