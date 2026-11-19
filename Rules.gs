/**
 * ClaimCheck for Google Sheets — editorial preflight patterns.
 *
 * The rules are prompts for substantiation / disclosure review, NOT findings of
 * unlawful conduct. Rules have deliberately high recall in selected categories
 * and cannot evaluate claim truth, evidence quality, net impression, or layout.
 *
 * This file has no Google service dependency and can be tested with Node.
 */
var CLAIMCHECK_SOURCES = {
  SUBSTANTIATION: 'https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation',
  ADS_FAQ: 'https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business',
  ENDORSEMENTS: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  REVIEWS: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
  DISCLOSURES: 'https://www.ftc.gov/business-guidance/resources/com-disclosures-how-make-effective-disclosures-digital-advertising',
  HEALTH: 'https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance',
  GREEN: 'https://www.ftc.gov/business-guidance/advertising-marketing/environmental-marketing'
};

var CLAIMCHECK_RULES = [
  {
    id: 'ABSOLUTE_PROMISE', category: 'Absolute / guaranteed outcome', priority: 'High',
    pattern: /\b(?:guarantee(?:s|d)? (?:results?|success|outcomes?|returns?|income)|100% guaranteed|risk[ -]free|no risk|can(?:not|'t) lose|never fail|works every time)\b/i,
    why: 'Absolute or guaranteed performance language can convey a strong objective claim that needs reliable support.',
    question: 'What evidence supports this guarantee, and what conditions or limitations are material?', source: 'SUBSTANTIATION'
  },
  {
    id: 'EARNINGS', category: 'Earnings / financial results', priority: 'High',
    pattern: /(?:\b(?:earn|make|generate|profit|income|revenue|sales)\b.{0,45}(?:\$\s?\d[\d,.]*|\b(?:six|seven)[ -]figures?\b|\b\d+(?:\.\d+)?\s?(?:k|thousand|million)\b|\bper (?:day|week|month|year)\b))|(?:\b(?:six|seven)[ -]figure (?:income|business|earnings)\b)/i,
    why: 'Specific or implied earnings representations merit a substantiation and typicality review.',
    question: 'Is the earnings representation supported, and does it accurately convey typical results and material expenses?', source: 'ADS_FAQ'
  },
  {
    id: 'CUSTOMER_EARNINGS', category: 'Customer earnings / outcome claim', priority: 'High',
    // Covers relative financial results, not just dollar-denominated promises.
    // Keep the actor and outcome in the same sentence to limit unrelated matches.
    pattern: /\b(?:customers?|clients?|users?|students?|members?|participants?|graduates?)\b[^.!?\n]{0,100}\b(?:doubled|tripled|quadrupled|increased?|boosted?|grew|raised|improved?)\b[^.!?\n]{0,60}\b(?:income|earnings?|revenue|profits?|sales)\b|\b(?:customers?|clients?|users?|students?|members?|participants?|graduates?)\b[^.!?\n]{0,100}\b(?:income|earnings?|revenue|profits?|sales)\b[^.!?\n]{0,60}\b(?:doubled|tripled|quadrupled|increased?|grew|rose)\b/i,
    why: 'Claims that customers achieved improved financial outcomes can imply representative results even without a dollar figure.',
    question: 'What records substantiate these customer outcomes, how many customers were measured, and are the advertised results representative?', source: 'SUBSTANTIATION'
  },
  {
    id: 'HEALTH_CURE', category: 'Health / treatment claim', priority: 'High',
    pattern: /\b(?:cures?|treats?|prevents?|reverses?|heals?)\s+(?:\w+\s+){0,4}(?:disease|illness|condition|diabetes|cancer|anxiety|depression|infection|arthritis|pain|symptoms?)\b|\b(?:clinically proven|scientifically proven|FDA approved|doctor recommended)\b/i,
    why: 'Health-related efficacy or approval claims may require particularly strong substantiation and precise wording.',
    question: 'What competent and reliable scientific evidence supports this exact claim, and is any approval accurately characterized?', source: 'HEALTH'
  },
  {
    id: 'TYPICAL_RESULTS', category: 'Testimonials / typical results', priority: 'High',
    pattern: /\b(?:results? (?:are|is) not typical|typical results?|real customer (?:results?|stories)|testimonials?)\b|\b(?:I|we) (?:earned?|made|lost)\s+(?:\$\s?\d[\d,.]*|\d+\s?(?:pounds|lbs|kg))\b/i,
    why: 'Testimonials and results-based stories can imply what a typical consumer will achieve.',
    question: 'Is the testimonial authentic, and are generally expected results and material connections handled appropriately?', source: 'ENDORSEMENTS'
  },
  {
    id: 'ENDORSEMENT_DISCLOSURE', category: 'Endorsement / material connection', priority: 'Medium',
    pattern: /\b(?:affiliate links?|affiliate commission|paid partnership|sponsored (?:post|content)|brand ambassador|gifted (?:product|item)|influencer|paid review)\b/i,
    why: 'A material connection between an endorser and a brand may require a clear and conspicuous disclosure.',
    question: 'Is the relationship clearly disclosed where consumers will notice it, and is the endorsement authentic?', source: 'ENDORSEMENTS'
  },
  {
    id: 'SUPERLATIVE', category: 'Superlative / comparative claim', priority: 'Medium',
    pattern: /(?:#\s?1\b|\b(?:number one|most trusted|best[- ]selling|top[- ]rated|fastest|industry[- ]leading|market[- ]leading)\b)|(?:\b(?:the best|the only)\s+(?:software|platform|solution|service|product|program|course|system|choice)\b)/i,
    why: 'Rankings and performance comparisons can communicate an objectively testable claim.',
    question: 'Who or what is the comparison against, for what timeframe, and what evidence substantiates it?', source: 'SUBSTANTIATION'
  },
  {
    id: 'NO_COST', category: 'Free / no-cost offer', priority: 'Medium',
    pattern: /\b(?:completely free|100% free|free trial|no cost|zero fees?|no hidden fees?|free forever|\$\s?0\s*(?:today|to start|per month))\b/i,
    why: 'Free or no-cost language can be misleading when material charges, restrictions, or future obligations are omitted.',
    question: 'Are all charges, renewal terms, and eligibility restrictions clearly disclosed near the offer?', source: 'DISCLOSURES'
  },
  {
    id: 'URGENCY', category: 'Scarcity / urgency', priority: 'Medium',
    pattern: /\b(?:only \d+ (?:spots?|seats?|units?) left|today only|ends tonight|last chance|limited[- ]time offer|offer expires|act now before)\b/i,
    why: 'Scarcity or deadline language may be an objective representation of limited availability.',
    question: 'Can the deadline or availability claim be verified, and will it remain accurate when published?', source: 'ADS_FAQ'
  },
  {
    id: 'ENVIRONMENT', category: 'Environmental claim', priority: 'Medium',
    pattern: /\b(?:eco[- ]friendly|environmentally friendly|carbon neutral|carbon negative|zero emissions|100% (?:recycled|recyclable|sustainable)|non[- ]toxic|biodegradable|sustainably sourced)\b/i,
    why: 'Environmental claims may require clear qualifications and evidence addressing consumers’ likely interpretations.',
    question: 'What specific environmental attribute is being claimed, and what substantiation and qualifications apply?', source: 'GREEN'
  },
  {
    id: 'AI_CAPABILITY', category: 'AI capability / automation promise', priority: 'Medium',
    pattern: /\b(?:fully automated|zero human (?:input|oversight|review)|human[- ]free|100% accurate|error[- ]free|AI[- ]powered)\b/i,
    why: 'Claims about AI capabilities or accuracy may convey measurable performance promises.',
    question: 'What does the system actually do, what human supervision is required, and what evaluations support the claim?', source: 'SUBSTANTIATION'
  },
  {
    id: 'RISK_ELIMINATION', category: 'Unqualified safety / security claim', priority: 'Medium',
    pattern: /\b(?:completely secure|100% secure|unhackable|bulletproof security|eliminates? all risk|guaranteed safe)\b/i,
    why: 'Absolute security and safety language may overstate what can realistically be supported.',
    question: 'Can the absolute promise be substantiated, or should it be qualified with specific, verified protections?', source: 'SUBSTANTIATION'
  }
];

/**
 * @param {string} text Marketing copy to check.
 * @return {{findings: Array, examinedSegments: number, ruleCount: number, truncated: boolean}}
 */
function analyzeClaimText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Paste some marketing copy before running a review.');
  }
  if (text.length > 30000) {
    throw new Error('This version accepts up to 30,000 characters per review. Split longer copy into sections.');
  }

  var segments = text.replace(/\r\n?/g, '\n').split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"'“(])/);
  var findings = [];
  var seen = {};
  var MAX_FINDINGS = 100;
  var truncated = false;
  var examined = 0;

  for (var s = 0; s < segments.length; s++) {
    var segment = segments[s].trim();
    if (!segment) continue;
    examined++;
    for (var i = 0; i < CLAIMCHECK_RULES.length; i++) {
      var rule = CLAIMCHECK_RULES[i];
      var matched = segment.match(rule.pattern);
      if (!matched) continue;
      var key = rule.id + '|' + s;
      if (seen[key]) continue;
      seen[key] = true;
      var start = Math.max(0, matched.index - 80);
      var end = Math.min(segment.length, matched.index + matched[0].length + 130);
      var excerpt = (start ? '…' : '') + segment.slice(start, end) + (end < segment.length ? '…' : '');
      findings.push({
        ruleId: rule.id,
        origin: 'Rule-based',
        category: rule.category,
        priority: rule.priority,
        excerpt: excerpt,
        why: rule.why,
        question: rule.question,
        sourceUrl: CLAIMCHECK_SOURCES[rule.source]
      });
      if (findings.length >= MAX_FINDINGS) {
        truncated = true;
        break;
      }
    }
    if (truncated) break;
  }
  findings.sort(function (a, b) {
    if (a.priority !== b.priority) return a.priority === 'High' ? -1 : 1;
    return a.category.localeCompare(b.category);
  });
  return { findings: findings, examinedSegments: examined, ruleCount: CLAIMCHECK_RULES.length, truncated: truncated };
}
