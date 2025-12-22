/**
 * DMCA Prompt Templates and Constants
 * Extracted from aiService.ts for better maintainability
 */

export const DMCA_COMPLIANCE_REQUIREMENTS = `CRITICAL REQUIREMENTS FOR DMCA COMPLIANCE (17 U.S.C. § 512(c)(3)):

1. IDENTIFICATION OF COPYRIGHTED WORK:
   "I am the copyright owner of original content featuring [CLIENT_NAME]."

2. IDENTIFICATION OF INFRINGING MATERIAL:
   "The infringing material is located at the following URL(s):" + URL placeholder.

3. GOOD FAITH BELIEF STATEMENT (EXACT WORDING - MANDATORY):
   "I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law."

4. PERJURY STATEMENT (EXACT WORDING - MANDATORY):
   "I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed."

5. DEADLINE:
   State: "I demand removal within 48 hours" or "Expeditious removal is required under the DMCA."
   NEVER use 7 days or any longer timeframe.

6. UPSTREAM PROVIDER WARNING (INCLUDE THIS):
   Add: "Failure to comply will result in notification to your upstream hosting provider and domain registrar."

7. SIGNATURE:
   Format: "/s/ [LEGAL_NAME]"
   MUST be the legal name, NOT the stage name.`;

export const TONE_REQUIREMENTS = `TONE REQUIREMENTS - BE A ROBOT, NOT A HUMAN:
- Use words: "demand", "require", "notify", "violation"
- NEVER use: "please", "kindly", "respectfully", "thank you", "appreciate", "would you"
- Write like automated legal software, not a human being
- No emotional language, no personal appeals, no frustration
- Keep under 300 words - shorter is better
- Be cold, formal, procedural`;

export const DMCA_STRUCTURE = `STRUCTURE:
1. Subject: "DMCA Takedown Notice"
2. Statement of copyright ownership (mention stage name [CLIENT_NAME])
3. Infringing URLs placeholder
4. 48-hour removal demand
5. Good faith belief (exact words)
6. Perjury statement (exact words)
7. Upstream provider warning
8. Contact info + Legal name signature`;

export const SYSTEM_MESSAGE = `You are a DMCA compliance specialist. Generate takedown notices that are legally compliant with 17 U.S.C. § 512(c)(3). Use neutral, professional language. Include ALL required statutory elements. Focus on compliance, not intimidation. Write in FIRST PERSON. Output ONLY the letter - no explanations.`;

/**
 * Build the complete DMCA prompt
 */
interface PromptOptions {
    clientName: string;
    targetDescription: string;
    recipientContext: string;
    senderDetails: string;
    sourceContent: string;
    exampleLetterReference: string;
    legalName: string;
}

export function buildDmcaPrompt(options: PromptOptions): string {
    const {
        clientName,
        targetDescription,
        recipientContext,
        senderDetails,
        sourceContent,
        exampleLetterReference,
        legalName
    } = options;

    return `Write a DMCA-COMPLIANT Takedown Notice in the FIRST PERSON ("I").

RECIPIENT: ${targetDescription}
${recipientContext}

IDENTITY INFORMATION:
- Stage Name / Performer Name (for content identification): ${clientName}
- Legal Name (for signature): ${legalName}
${senderDetails}

RULE: In the BODY of the letter, refer to content featuring "${clientName}" (stage name). 
In the SIGNATURE, use ONLY the legal name "${legalName}".

${sourceContent}

INFRINGING MATERIAL LOCATION:
[INSERT SPECIFIC URLS OF INFRINGING CONTENT HERE]
${exampleLetterReference}

${DMCA_COMPLIANCE_REQUIREMENTS}

${TONE_REQUIREMENTS}

${DMCA_STRUCTURE}
`;
}
