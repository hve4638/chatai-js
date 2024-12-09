import { CHAT_ROLE } from '../../types/request-form';
export const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export const ROLE_DEFAULT = 'user';
export const ROLE = {
  [CHAT_ROLE.USER] : 'user',
  [CHAT_ROLE.SYSTEM] : 'system',
  [CHAT_ROLE.BOT] : 'assistant',
} as const;
export type ROLE = typeof ROLE[keyof typeof ROLE];