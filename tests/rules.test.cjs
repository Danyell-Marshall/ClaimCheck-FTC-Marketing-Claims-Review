const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Rules.gs'), 'utf8'), sandbox);
const analyze = (copy) => sandbox.analyzeClaimText(copy);
const ids = (copy) => Array.from(analyze(copy).findings, f => f.ruleId);

test('Flags absolute guarantee', () => assert.ok(ids('Our service guarantees results.').includes('ABSOLUTE_PROMISE')));
test('Flags specific earnings promise', () => assert.ok(ids('Make $5,000 per month.').includes('EARNINGS')));
test('Flags non-dollar customer income doubling claim (regression)', () => {
  assert.ok(ids('Thousands of customers have doubled their income using our proven method.').includes('CUSTOMER_EARNINGS'));
});
test('Flags percentage-based customer revenue growth', () => assert.ok(ids('Our students increased revenue by 40%.').includes('CUSTOMER_EARNINGS')));
test('Flags customer-first financial outcome in reverse order', () => assert.ok(ids("Our clients' earnings have tripled.").includes('CUSTOMER_EARNINGS')));
test('Does not flag neutral customer service description as earnings outcome', () => {
  assert.ok(!ids('Customers can contact our team to update their billing information.').includes('CUSTOMER_EARNINGS'));
});
test('Original multi-sentence example yields three independent high-priority review flags', () => {
  const copy = "Our revolutionary AI business system guarantees you'll earn $10,000 in your first 30 days. Thousands of customers have doubled their income using our proven method. Results are guaranteed, and the program is completely risk-free.";
  const result = analyze(copy);
  for (const name of ['EARNINGS', 'CUSTOMER_EARNINGS', 'ABSOLUTE_PROMISE']) {
    assert.ok(result.findings.some(f => f.ruleId === name), `Missing ${name}`);
  }
  assert.equal(result.findings.length, 3);
});
test('Flags health efficacy language', () => assert.ok(ids('Clinically proven to improve outcomes.').includes('HEALTH_CURE')));
test('Flags results testimonial', () => assert.ok(ids('I earned $12,000 in my first month.').includes('TYPICAL_RESULTS')));
test('Flags affiliate relationship', () => assert.ok(ids('We include affiliate links.').includes('ENDORSEMENT_DISCLOSURE')));
test('Flags superlative', () => assert.ok(ids('Our software is the #1 platform.').includes('SUPERLATIVE')));
test('Flags free trial', () => assert.ok(ids('Start your free trial today.').includes('NO_COST')));
test('Flags limited inventory', () => assert.ok(ids('Only 3 spots left.').includes('URGENCY')));
test('Flags environmental claim', () => assert.ok(ids('We are carbon neutral.').includes('ENVIRONMENT')));
test('Flags AI automation promise', () => assert.ok(ids('Our workflow is fully automated.').includes('AI_CAPABILITY')));
test('Flags absolute security promise', () => assert.ok(ids('Our tool is 100% secure.').includes('RISK_ELIMINATION')));
test('Neutral editorial sentence gives no flags', () => assert.equal(analyze('Our editorial team meets every Tuesday to review proposed topics.').findings.length, 0));
test('Empty copy is rejected', () => assert.throws(() => analyze('  '), /Paste/));
test('Overlength copy is rejected', () => assert.throws(() => analyze('a'.repeat(30001)), /30,000/));
test('Evidence links resolve to FTC domain', () => assert.ok(analyze('Start your free trial today.').findings.every(x => x.sourceUrl.startsWith('https://www.ftc.gov/'))));
test('Findings include actionable question, excerpt, and origin', () => {
  const [f] = analyze('Our product is 100% secure.').findings;
  assert.ok(f.excerpt.includes('100% secure'));
  assert.ok(f.question.includes('?'));
  assert.equal(f.origin, 'Rule-based');
});
test('Handles quotes containing special HTML characters as plain text', () => {
  const [f] = analyze('Our service guarantees results <script>test</script>.').findings;
  assert.ok(f.excerpt.includes('<script>'));
});
test('No duplicate finding per category and sentence', () => {
  const result = analyze('Guaranteed results and guaranteed income.');
  assert.equal(result.findings.filter(f => f.ruleId === 'ABSOLUTE_PROMISE').length, 1);
});
test('Pattern rules are maintained as twelve categories', () => assert.equal(sandbox.CLAIMCHECK_RULES.length, 12));
