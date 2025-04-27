import { ChatRoleName } from '@/types';
import { ChatMessage } from '@/types/request'

export function assistant(textMessage:string):ChatMessage {
    return {
        role: ChatRoleName.Assistant,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    }
}
export function user(textMessage:string):ChatMessage {
    return {
        role: ChatRoleName.User,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    }
}
export function system(textMessage:string):ChatMessage {
    return {
        role: ChatRoleName.System,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    }
}