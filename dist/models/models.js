"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_CATEGORY = exports.MODELS = void 0;
exports.MODELS = {
    GOOGLE_GEMINI: 'GOOGLE_GEMINI',
    OPENAI_GPT: 'OPENAI_GPT',
    CLAUDE: 'CLAUDE',
    GOOGLE_VERTEXAI: 'GOOGLE_VERTEXAI',
    DEBUG_MODE: 'DEBUG'
};
exports.MODEL_CATEGORY = {
    [exports.MODELS.GOOGLE_GEMINI]: {
        name: 'Google Gemini',
        models: [
            { name: 'Gemini 1.5 Pro Exp 0827', value: 'gemini-1.5-pro-exp-0827' },
            { name: 'Gemini 1.5 Pro-002', value: 'gemini-1.5-pro-002' },
            { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro-latest' },
            { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
            { name: 'Gemini 1.0 Pro', value: 'gemini-1.0-pro' },
        ]
    },
    [exports.MODELS.OPENAI_GPT]: {
        name: 'OpenAI GPT',
        models: [
            { name: 'GPT-4o', value: 'gpt-4o' },
            { name: 'GPT-4o mini', value: 'gpt-4o-mini' },
            { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        ]
    },
    [exports.MODELS.CLAUDE]: {
        'name': 'Anthropic Claude',
        'models': [
            { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
            { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
            { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
        ]
    },
    [exports.MODELS.GOOGLE_VERTEXAI]: {
        name: 'Google VertexAI',
        models: [
            { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet@20240620' },
            { name: 'Claude 3 Opus', value: 'claude-3-opus@20240229' },
            { name: 'Claude 3 Haiku', value: 'claude-3-haiku@20240307' },
        ]
    }
};
