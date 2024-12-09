import { CHAT_ROLE } from '../../types/request-form';

export const OPENAI_GPT_URL = 'https://api.openai.com/v1/chat/completions';

export const ROLE_DEFAULT = 'USER';
export const ROLE = {
  [CHAT_ROLE.USER] : 'user',
  [CHAT_ROLE.SYSTEM] : 'system',
  [CHAT_ROLE.BOT] : 'assistant',
}
export type ROLE = typeof ROLE[keyof typeof ROLE];