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
    siteName: string,
    apiKey: string,
    profile?: DmcaProfile,
    onStream?: (token: string) => void
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

    const prompt = `Write a formal DMCA Takedown Notice in the FIRST PERSON ("I").
Target Website: ${siteName}
My Content being infringed: Unauthorized videos and images featuring the client.
${sourceContent}
Client Name: ${clientName}
${senderDetails}

Requirements:
- WRITE IN THE FIRST PERSON (e.g., "I am the copyright owner", "I have a good faith belief").
- Professional legal tone.
- Cite DMCA Section 512(c)(3).
- State that *I* have a good faith belief that use of the material is not authorized.
- State that the information is accurate and *I* am the owner of the exclusive right that is allegedly infringed.
- Demand immediate removal of the content.
- If sender details are provided above, use them. Otherwise use standard placeholders like [YOUR NAME].
`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey} `
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a legal assistant specializing in DMCA takedowns. Write a formal, legally sound DMCA takedown notice. ALWAYS write in the FIRST PERSON ('I'). Output ONLY the letter content." },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5
            }),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText} `);
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
        console.error('Failed to generate DMCA letter:', error);
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
