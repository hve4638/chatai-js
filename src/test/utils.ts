import { ChatRoleName } from '@/types';
import { Message } from '@/types/request'

export function assistant(textMessage:string):Message {
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
export function user(textMessage:string):Message {
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
export function system(textMessage:string):Message {
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