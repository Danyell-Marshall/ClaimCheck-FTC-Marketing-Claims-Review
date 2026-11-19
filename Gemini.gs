/**
 * OPTIONAL second pass. Runs only after the user checks "Use Gemini" in sidebar.
 * Sends pasted copy and rule findings to Google's Gemini Developer API.
 * No API key in source, spreadsheet cells, or logs.
 */
function runGeminiSecondPass_(copy, ruleFindings) {
  var properties = PropertiesService.getScriptProperties();
  var key = properties.getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY is not configured in Script Properties.');
  var model = properties.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('Invalid model name in GEMINI_MODEL.');

  var prompt = [
    'You are an editorial advertising-claims preflight assistant. You are NOT a lawyer or regulator.',
    'Review the marketing copy for up to eight ADDITIONAL important claims or possible disclosure issues',
    'missed by keyword rules. Do not make legal judgments, declare violations, or invent evidence.',
    'Only quote an EXACT continuous substring from the supplied marketing copy as an excerpt.',
    'If no additional concerns are evident, return an empty findings array.',
    'Output ONLY a JSON object: {"findings":[{"excerpt":"verbatim text",',
    '"category":"short category","priority":"High or Medium",',
    '"why":"reason for human review","question":"specific fact-check question",',
    '"source":"SUBSTANTIATION or ADS_FAQ or ENDORSEMENTS or REVIEWS or DISCLOSURES or HEALTH or GREEN"}]}.',
    'Existing rule findings (do not duplicate):',
    JSON.stringify(ruleFindings.map(function (f) { return { category: f.category, excerpt: f.excerpt }; })),
    'Marketing copy follows between markers:',
    '<<<COPY>>>', copy.slice(0, 18000), '<<<END COPY>>>'
  ].join('\n');

  var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
  var response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 1500 }
    })
  });
  var status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Gemini API returned HTTP ' + status + '. Check model access, quota, and key.');
  }
  var data = JSON.parse(response.getContentText());
  var generated = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  var content = generated.map(function (p) { return p.text || ''; }).join('');
  var parsed = JSON.parse(content);
  if (!parsed || !Array.isArray(parsed.findings)) throw new Error('Gemini response did not contain findings.');
  var seen = {};
  var out = [];
  parsed.findings.slice(0, 8).forEach(function (candidate) {
    if (!candidate || typeof candidate.excerpt !== 'string') return;
    var excerpt = candidate.excerpt.trim();
    // Reject hallucinated excerpts. We must be able to locate every quote in input.
    if (excerpt.length < 8 || excerpt.length > 300 || copy.indexOf(excerpt) === -1 || seen[excerpt]) return;
    seen[excerpt] = true;
    var source = String(candidate.source || 'SUBSTANTIATION');
    if (!CLAIMCHECK_SOURCES[source]) source = 'SUBSTANTIATION';
    out.push({
      ruleId: 'AI_SUGGESTION', origin: 'Gemini suggestion',
      category: String(candidate.category || 'Additional claim').slice(0, 90),
      priority: candidate.priority === 'High' ? 'High' : 'Medium',
      excerpt: excerpt,
      why: String(candidate.why || 'Additional consideration suggested by AI; human verification required.').slice(0, 400),
      question: String(candidate.question || 'Is this claim substantiated and appropriately qualified?').slice(0, 400),
      sourceUrl: CLAIMCHECK_SOURCES[source]
    });
  });
  return out;
}
