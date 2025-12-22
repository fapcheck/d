import { fetch } from '@tauri-apps/plugin-http';

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

import { DmcaProfile } from '../types';
import { EXAMPLE_DMCA_HOSTING_LETTER } from '../constants';
import { buildDmcaPrompt, SYSTEM_MESSAGE } from '../constants/dmcaPrompts';

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

    // Add example letter reference for hosting mode
    const exampleLetterReference = isHostingMode ? `

EXAMPLE LETTER FOR REFERENCE:
Use the following example as a guide for structure, tone, and escalation language when creating the complaint to the hosting provider:

${EXAMPLE_DMCA_HOSTING_LETTER}

IMPORTANT: Use this as a TEMPLATE and STYLE GUIDE. Replace placeholder information with the actual details provided above. Maintain the professional, direct tone and include similar escalation language about upstream providers and payment processors when appropriate.
` : '';

    const prompt = buildDmcaPrompt({
        clientName,
        targetDescription,
        recipientContext,
        senderDetails,
        sourceContent,
        exampleLetterReference,
        legalName: profile?.legalName || '[LEGAL NAME REQUIRED]'
    });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: SYSTEM_MESSAGE },
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
