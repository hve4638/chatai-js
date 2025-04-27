import { ChatRoleName, ChatType, ChatAIRequestForm } from '@/types';
import { ClaudeMessage, Roles } from './types';
import { ModelUnsupportError } from '@/errors';
import { ChatMessage } from '@/types/request';

export function parseClaudeMessage(messages: ChatMessage[]): { message: ClaudeMessage, systemPrompt: string } {
    let systemPrompt = '';
    const result:ClaudeMessage = [];
    
    for (const message of messages) {
        const role = Roles[message.role];
        if (role === Roles[ChatRoleName.System]) {
            const text = message.content[0].text!;
            if (result.length === 0) {
                systemPrompt += text;
            }
            else {
                result.push({
                    role: Roles[ChatRoleName.Assistant],
                    content: [
                        {
                            type: 'text',
                            text: 'system: ' + text,
                        }
                    ]
                });
            }
        }
        else {
            const chatBlock = {
                role: role,
                content : [] as any[]
            }
            for (const c of message.content) {
                if (c.chatType == ChatType.TEXT) {
                    chatBlock.content.push({
                        type: 'text',
                        text: c.text ?? ''
                    });
                }
                else if (c.chatType == ChatType.IMAGE_BASE64) {
                    chatBlock.content.push({
                        type : 'image',
                        source : {
                            'type' : 'base64',
                            'media_type' : `image/${c.extension ?? 'jpeg'}`,
                            'data' : `${c.image_url ?? ''}`
                        }
                    });
                }
                else if (c.chatType == ChatType.IMAGE_URL) {
                    throw new ModelUnsupportError(`Claude API does not support chatType : IMAGE_URL`);
                }
            }
            result.push(chatBlock);
        }
    }
    
    return {
        message: result,
        systemPrompt
    }
}