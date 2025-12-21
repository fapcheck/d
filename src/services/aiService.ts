import { fetch } from '@tauri-apps/plugin-http';

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

import { DmcaProfile } from '../types';

export const generateDmcaLetter = async (
    clientName: string,
    targetName: string,
    apiKey: string,
    profile?: DmcaProfile,
    onStream?: (token: string) => void,
    recipientType: 'site' | 'hosting' | 'upstream' = 'site',
    selectedSites?: string[]
): Promise<string> => {
    if (!apiKey) {
        throw new Error('API Key missing');
    }

    // Construct the "Sender" details based on profile
    const senderDetails = profile ? `
The sender's details are:
- Legal Name: ${profile.legalName || '[Your Legal Name]'}
- Job Title: Copyright Owner
- Phone: ${profile.phone || '[Your Phone]'}
- Address: ${profile.address || '[Your Address]'}
- Email: ${profile.email || '[Your Email]'}

Please USE these details to sign off the letter and in the header.
` : '';

    const sourceContent = profile?.contentSourceUrl ? `
Original Authorized Content URL: ${profile.contentSourceUrl}
(Please cite this as the original source of the content being infringed)
` : '';

    // Build recipient-specific context
    const isHostingMode = recipientType === 'hosting';
    const isUpstreamMode = recipientType === 'upstream';

    let targetDescription: string;
    let recipientContext: string;

    if (isUpstreamMode) {
        targetDescription = `Upstream Provider: ${targetName}
${selectedSites && selectedSites.length > 0 ? `Non-Compliant Downstream Services: ${selectedSites.join(', ')}` : 'Non-Compliant Services: [LIST OF SITES/HOSTINGS]'}`;
        recipientContext = `This is a DMCA notice to an UPSTREAM INFRASTRUCTURE PROVIDER. You provide bandwidth, infrastructure, or services to "${targetName}" or their downstream customers. The downstream entities listed have failed to respond to previous DMCA takedown requests. This notice requests that you take action against your non-compliant customer.`;
    } else if (isHostingMode) {
        targetDescription = `Hosting Provider: ${targetName}
${selectedSites && selectedSites.length > 0 ? `Infringing Sites Hosted by Them: ${selectedSites.join(', ')}` : 'Infringing Sites: [LIST OF SITES]'}`;
        recipientContext = `This DMCA notice is directed to the hosting provider "${targetName}" regarding infringing content on sites they host.`;
    } else {
        targetDescription = `Target Website: ${targetName}`;
        recipientContext = `This DMCA notice is directed to the website "${targetName}" regarding infringing content on their platform.`;
    }

    const prompt = `Write a DMCA-COMPLIANT Takedown Notice in the FIRST PERSON ("I").

RECIPIENT: ${targetDescription}
${recipientContext}

IDENTITY INFORMATION:
- Stage Name / Performer Name (for content identification): ${clientName}
- Legal Name (for signature): ${profile?.legalName || '[LEGAL NAME REQUIRED]'}
${senderDetails}

RULE: In the BODY of the letter, refer to content featuring "${clientName}" (stage name). 
In the SIGNATURE, use ONLY the legal name "${profile?.legalName || '[LEGAL NAME]'}".

${sourceContent}

INFRINGING MATERIAL LOCATION:
[INSERT SPECIFIC URLS OF INFRINGING CONTENT HERE]

CRITICAL REQUIREMENTS FOR DMCA COMPLIANCE (17 U.S.C. § 512(c)(3)):

1. IDENTIFICATION OF COPYRIGHTED WORK:
   "I am the copyright owner of original content featuring ${clientName}."

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
   Format: "/s/ ${profile?.legalName || '[Legal Name]'}"
   MUST be the legal name, NOT the stage name.

TONE REQUIREMENTS - BE A ROBOT, NOT A HUMAN:
- Use words: "demand", "require", "notify", "violation"
- NEVER use: "please", "kindly", "respectfully", "thank you", "appreciate", "would you"
- Write like automated legal software, not a human being
- No emotional language, no personal appeals, no frustration
- Keep under 300 words - shorter is better
- Be cold, formal, procedural

STRUCTURE:
1. Subject: "DMCA Takedown Notice"
2. Statement of copyright ownership (mention stage name ${clientName})
3. Infringing URLs placeholder
4. 48-hour removal demand
5. Good faith belief (exact words)
6. Perjury statement (exact words)
7. Upstream provider warning
8. Contact info + Legal name signature
`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a DMCA compliance specialist. Generate takedown notices that are legally compliant with 17 U.S.C. § 512(c)(3). Use neutral, professional language. Include ALL required statutory elements. Focus on compliance, not intimidation. Write in FIRST PERSON. Output ONLY the letter - no explanations." },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.2
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as GroqResponse;
        const text = data.choices[0]?.message?.content || '';

        // Simulate streaming for UI effect since Groq is fast enough
        if (onStream) {
            const words = text.split(' ');
            for (const word of words) {
                onStream(word + ' ');
                await new Promise(r => setTimeout(r, 5));
            }
        }

        return text;
    } catch (error) {
        throw error;
    }
};

export const checkOllamaStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        return response.ok;
    } catch {
        return false;
    }
}
