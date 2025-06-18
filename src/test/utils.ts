import { ChatRoleName } from '@/types';
import { ChatMessages, ChatRolePart } from '@/types';

export function assistant(textMessage:string):ChatRolePart {
    return {
        role: ChatRoleName.Assistant,
        content: [
            {
                chatType: 'Text',
                text: textMessage,
            },
        ]
    }
}
export function user(textMessage:string):ChatRolePart {
    return {
        role: ChatRoleName.User,
        content: [
            {
                chatType: 'Text',
                text: textMessage,
            },
        ]
    }
}
export function system(textMessage:string):ChatRolePart {
    return {
        role: ChatRoleName.System,
        content: [
            {
                chatType: 'Text',
                text: textMessage,
            },
        ]
    }
}