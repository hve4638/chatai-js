export interface GenerativeLanguageBody {
    contents: GenerativeLanguageMessages;
    generationConfig: GenerationConfig;
    safetySettings: SafetySettings;
}

export interface GenerationConfig {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    response_mime_type?: 'application/json' | 'text/x.enum';
    response_schema?: object;
    thinkingConfig?: ThinkingConfig;
}

export type GenerativeLanguageMessages = {
    role: 'USER' | 'MODEL';
    parts: GenerativeLanguageMessagePart[];
}[];

export type GenerativeLanguageMessagePart = (
    {
        text: string;
    } | {
        inline_data: {
            mime_type: 'application/pdf';
            data: string; // base64
        }
    } | {
        inline_data: {
            mime_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/heic' | 'image/heif';
            data: string; // base64
        }
    }
)

export type SafetySettings = {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
    threshold: SafetyFilterThreshold;
}[];

export type SafetyFilterThreshold = 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE' | 'HARM_BLOCK_THRESHOLD_UNSPECIFIED';

// url: https://ai.google.dev/gemini-api/docs/thinking?hl=ko
export type ThinkingConfig = {
    thinkingBudget?: number;
    includeThoughts?: boolean;
}