export const Models = {
    GOOGLE_GEMINI : 'GOOGLE_GEMINI',
    OPENAI_GPT : 'OPENAI_GPT',
    CLAUDE : 'CLAUDE',
    GOOGLE_VERTEXAI : 'GOOGLE_VERTEXAI'
} as const;
export type Models = typeof Models[keyof typeof Models];

type ModelDetail = { name: string; value: string };
type ModelInformation = { name: string; models: ModelDetail[] };

export const ModelCategory:Record<Models, ModelInformation> = {
    [Models.GOOGLE_GEMINI] : {
        name : 'Google Gemini',
        models : [
            { name : 'Gemini Exp 1121', value: 'gemini-exp-1121' },
            { name : 'Gemini Exp 1114', value: 'gemini-exp-1114' },
            { name : 'Gemini 1.5 Pro Exp 0827', value: 'gemini-1.5-pro-exp-0827' },
            { name : 'Gemini 1.5 Pro 002', value: 'gemini-1.5-pro-002' },
            { name : 'Gemini 1.5 Pro 001', value: 'gemini-1.5-pro-001' },
            { name : 'Gemini 1.5 Pro (latest)', value: 'gemini-1.5-pro-latest' },
            { name : 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
            { name : 'Gemini 1.5 Flash 002', value: 'gemini-1.5-flash-002' },
            { name : 'Gemini 1.5 Flash 001', value: 'gemini-1.5-flash-001' },
            { name : 'Gemini 1.5 Flash (latest)', value: 'gemini-1.5-flash-latest' },
            { name : 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
            { name : 'Gemini 1.5 Flash-8B (latest)', value: 'gemini-1.5-flash-8b-latest' },
            { name : 'Gemini 1.5 Flash-8B', value: 'gemini-1.5-flash-8b' },
            { name : 'Gemini 1.0 Pro', value: 'gemini-1.0-pro' },
        ]
    },
    [Models.OPENAI_GPT] : {
        name: 'OpenAI GPT',
        models : [
            { name : 'GPT-4o', value: 'gpt-4o' },
            { name : 'GPT-4o (2024-11-20)', value: 'gpt-4o-2024-11-20' },
            { name : 'GPT-4o (2024-11-20)', value: 'gpt-4o-2024-08-06' },
            { name : 'GPT-4o (2024-11-20)', value: 'gpt-4o-2024-05-13' },
            { name : 'ChatGPT-4o (latest)', value: 'chatgpt-4o-latest' },
            { name : 'GPT-4o mini', value: 'gpt-4o-mini' },
            { name : 'GPT-4o mini (2024-07-18)', value: 'gpt-4o-mini-2024-07-18' },
            { name : 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        ]
    },
    [Models.CLAUDE] : {
        name : 'Anthropic Claude',
        models : [
            { name : 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
            { name : 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
            { name : 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
            { name : 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
        ]
    },
    [Models.GOOGLE_VERTEXAI] : {
        name : 'Google VertexAI',
        models : [
            { name : 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet@20240620' },
            { name : 'Claude 3 Opus', value: 'claude-3-opus@20240229' },
            { name : 'Claude 3.5 Haiku', value: 'claude-3-5-haiku@20241022' },
            { name : 'Claude 3 Haiku', value: 'claude-3-haiku@20240307' },
        ]
    }
} as const;
