# Blog outline — That Time I Built an FTC Claims Preflight Tool in Google Sheets

## The story (first person; preserve real voice)

**Opening:** I once had to review and rewrite approximately 200 marketing articles in roughly a month while my employer faced an FTC investigation. That experience taught me that copy can look polished while making promises the evidence may not support.

**The uncomfortable part:** The problem was never that the prose wasn't pretty. The problem was whether anyone could back up what it said. So many issues begin with a deceptively innocent sentence: 'guaranteed results,' 'make $5,000 a month,' 'free forever.' Each triggers a different question.

**The build:** I already knew Google Apps Script because I had personally built a Reddit Blog Matcher and Gemini-assisted comment generator for a colleague. I wanted the same frictionless interface: click a custom menu in Google Sheets, paste text, get a useful output tab. No server or elaborate software infrastructure.

**Why I chose rules first:** A language model can sound convincing without having evidence. A rules-based system is narrower and less impressive-looking, but transparent: you can see what triggered a flag and which FTC resource the editor should consult. Gemini is available as an explicitly optional second opinion, not a judge.

**Show the mechanism:** Screenshot the actual custom menu, sidebar with fictional marketing text, and editable findings sheet. Demonstrate how one line produces a reviewer question, not an automatic declaration of noncompliance.

**Explain limits:** It cannot look at the visual prominence of disclosures, know whether a testimonial is representative, or evaluate the studies allegedly supporting a claim. Sometimes it will flag perfectly legitimate language. Sometimes it will miss something important. This is how editorial preflight is supposed to work: the editor still makes the call.

**The ending:** Automating the boring first pass is useful. Automating away judgment is the part that gets us into trouble.

## Demonstration screenshots to capture after installation

1. The new `FTC ClaimCheck` menu in the real Google Sheet.
2. The sidebar with **fictional** copy pasted into it.
3. The `ClaimCheck_Findings` tab with priority, excerpt, reviewer question, guidance URL, and status.
4. Optionally one before/after claim edit and the evidence/reasoning that informed it.

## Accuracy guardrails for the post

- Be clear the app is a new project inspired by past work, **not** a 2025 production system.
- Do not say it certifies FTC compliance, catches every claim, or has been validated against regulator decisions.
- Do not publish prior employer drafts, copy, credentials, or confidential records.
- Report test passing accurately as *code tests*, not demonstrated legal-detection accuracy.
- Link both the repository and public FTC guidance.
