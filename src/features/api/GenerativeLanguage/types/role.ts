import { ChatRoleName } from '@/types';

export const DefaultRole = 'USER';
export const Roles = {
    [ChatRoleName.User]: 'USER',
    [ChatRoleName.System]: 'MODEL',
    [ChatRoleName.Assistant]: 'MODEL',
} as const;
export type Roles = typeof Roles[keyof typeof Roles];