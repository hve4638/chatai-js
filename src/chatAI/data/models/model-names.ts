export const ModelNames = {
    GOOGLE_GEMINI : 'GOOGLE_GEMINI',
    OPENAI_GPT : 'OPENAI_GPT',
    CLAUDE : 'CLAUDE',
    GOOGLE_VERTEXAI : 'GOOGLE_VERTEXAI'
} as const;
export type ModelNames = typeof ModelNames[keyof typeof ModelNames];

export default ModelNames;