import { ChatRoleName } from '@/types';

export type GenerativeLanguageMessage = {
  role: string;
  parts: ({ text: string } | { inline_data: { mime_type: string, data: string } })[];
}[];

export const DefaultRole = 'USER';
export const Roles = {
  [ChatRoleName.User]: 'USER',
  [ChatRoleName.System]: 'MODEL',
  [ChatRoleName.Assistant]: 'MODEL',
} as const;
export type Roles = typeof Roles[keyof typeof Roles];

