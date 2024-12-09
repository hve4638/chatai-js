import { RequestForm, Models, CHAT_ROLE } from '../';
import { Message } from '../types/request-form';

export function bot(textMessage:string):Message {
    return {
        role: CHAT_ROLE.BOT,
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
        role: CHAT_ROLE.USER,
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
        role: CHAT_ROLE.SYSTEM,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    }
}