import { ChatRoleName, ChatType, ChatAIRequestForm } from '@/types';
import { ChatCompletionsMessage, Roles } from './types';
import { Message } from '@/types/request';

export function parseChatCompletionsMessage(messages:Message[]) {
    const result: ChatCompletionsMessage = [];
    for (const m of messages) {
        if (m.content.length === 0) continue;
        if (m.content.length === 1) {
            result.push({
                role: Roles[m.role] ?? Roles[ChatRoleName.User],
                content: m.content[0].text!
            });
        }
        else {
            const chatBlock = {
                role: Roles[m.role] ?? Roles[ChatRoleName.User],
                content: [] as any[]
            };
            for (const chat of m.content) {
                if (chat.chatType === ChatType.TEXT) {
                    chatBlock.content.push({
                        type: 'text',
                        text: chat.text
                    });
                }
                else if (chat.chatType === ChatType.IMAGE_URL) {
                    chatBlock.content.push({
                        type: 'image_url',
                        image_url: {
                            url: chat.image_url
                        }
                    });
                }
                else if (chat.chatType === ChatType.IMAGE_BASE64) {
                    chatBlock.content.push({
                        type: 'image_url',
                        image_url: {
                            url: `data:image/${chat.extension ?? 'jpeg'};base64,${chat.image_url}`
                        }
                    });
                }
            }

            result.push(chatBlock);
        }
    }

    return result;
}
