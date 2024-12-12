export const Models = {
    GOOGLE_GEMINI : 'GOOGLE_GEMINI',
    OPENAI_GPT : 'OPENAI_GPT',
    CLAUDE : 'CLAUDE',
    GOOGLE_VERTEXAI : 'GOOGLE_VERTEXAI'
} as const;
export type Models = typeof Models[keyof typeof Models];

export default Models;