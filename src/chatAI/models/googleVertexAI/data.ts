import { CHAT_ROLE } from '../../types/request-form';
export const VERTEXAI_URL = 'https://{{location}}-aiplatform.googleapis.com/v1/projects/{{projectid}}/locations/{{location}}/publishers/anthropic/models/{{model}}:rawPredict'

export const ROLE_DEFAULT = 'USER';
export const ROLE = {
    [CHAT_ROLE.USER] : 'user',
    [CHAT_ROLE.SYSTEM] : 'system',
    [CHAT_ROLE.BOT] : 'assistant',
} as const;
export type ROLE = typeof ROLE[keyof typeof ROLE];