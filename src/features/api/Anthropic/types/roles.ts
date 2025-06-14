import { ChatRoleName } from '@/types';

export const Roles = {
    [ChatRoleName.User]: 'user',
    [ChatRoleName.System]: 'system',
    [ChatRoleName.Assistant]: 'assistant',
} as const;
export type Roles = typeof Roles[keyof typeof Roles];