import { ChatRoleName } from '@/types';

export const Roles = {
    [ChatRoleName.User]: 'user',
    [ChatRoleName.System]: 'system',
    [ChatRoleName.Assistant]: 'assistant',
} as const;
export type Roles = typeof Roles[keyof typeof Roles];

export type ChatCompletionsMessage = {
    role: Roles;
    content: string | { type: string, text: string } | { type: string, image_url: string }[];
}[];
