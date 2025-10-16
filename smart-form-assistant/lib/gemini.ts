import { FormData } from './types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(prompt: string, model: string = 'gemini-1.5-flash'): Promise<{
    text: string;
    tokensUsed: number;
  }> {
    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as GeminiResponse;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    return { text, tokensUsed };
  }

  async autofillFromResume(resumeText: string): Promise<{
    extracted: Partial<FormData>;
    tokensUsed: number;
  }> {
    const prompt = `Extract structured information from this resume and return ONLY valid JSON without any additional text or markdown formatting.

Resume:
${resumeText}

Return this exact JSON structure (fill all fields you can extract, use empty strings for missing data):
{
  "step1": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string (City, Country format)"
  },
  "step2": {
    "currentPosition": "string (most recent job title)",
    "company": "string (most recent company)",
    "yearsOfExperience": number (total years of professional experience),
    "keyAchievements": "string (bullet points of main achievements)"
  },
  "step3": {
    "primarySkills": "string (main technical skills)",
    "programmingLanguages": "string (comma-separated list)",
    "frameworksAndTools": "string (comma-separated list)"
  }
}

Respond ONLY with the JSON object, no explanation or markdown code blocks.`;

    const { text, tokensUsed } = await this.makeRequest(prompt);

    try {
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const extracted = JSON.parse(cleanedText) as Partial<FormData>;
      return { extracted, tokensUsed };
    } catch (error) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  async improveText(
    text: string,
    field: 'keyAchievements' | 'primarySkills' | 'motivation'
  ): Promise<{
    improved: string;
    tokensUsed: number;
  }> {
    const fieldDescriptions = {
      keyAchievements:
        'key professional achievements in a job application',
      primarySkills: 'technical skills description for a job application',
      motivation:
        'motivation statement explaining why the candidate is interested in a role',
    };

    const prompt = `You are helping a candidate improve their job application. 
Rewrite the following ${fieldDescriptions[field]} to be more professional, compelling, and well-structured.
Keep the same meaning and factual information, but make it more polished and impactful.
Do not add fake information or exaggerate - only improve the writing quality and clarity.

Original text:
${text}

Return ONLY the improved text without any explanation or additional commentary.`;

    const { text: improved, tokensUsed } = await this.makeRequest(prompt);

    return {
      improved: improved.trim(),
      tokensUsed,
    };
  }

  async validateForm(formData: FormData): Promise<{
    issues: Array<{ field: string; message: string; severity: 'warning' | 'suggestion' }>;
    tokensUsed: number;
  }> {
    const prompt = `You are reviewing a job application form for inconsistencies and missing details.
Analyze the following application data and provide constructive feedback.

Application Data:
${JSON.stringify(formData, null, 2)}

Look for:
1. Inconsistencies (e.g., "Senior Engineer" with 1 year of experience)
2. Missing important details that would strengthen the application
3. Unclear or vague statements

Return ONLY a JSON array of issues in this format:
[
  {
    "field": "step2.yearsOfExperience",
    "message": "Description of the issue",
    "severity": "warning" or "suggestion"
  }
]

If everything looks good, return an empty array: []
Respond ONLY with the JSON array, no explanation.`;

    const { text, tokensUsed } = await this.makeRequest(prompt);

    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const issues = JSON.parse(cleanedText) as Array<{
        field: string;
        message: string;
        severity: 'warning' | 'suggestion';
      }>;

      return { issues, tokensUsed };
    } catch (error) {
      console.error('Failed to parse validation response:', text);
      return { issues: [], tokensUsed };
    }
  }

  // Estimate cost based on tokens (rough estimate for free tier tracking)
  estimateCost(tokensUsed: number): number {
    // Gemini 1.5 Flash is free tier, but we track for monitoring
    // Using hypothetical pricing for tracking: $0.10 per 1M tokens
    return (tokensUsed / 1_000_000) * 0.1;
  }
}

