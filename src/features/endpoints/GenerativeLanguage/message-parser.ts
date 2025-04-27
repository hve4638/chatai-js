import { ChatRoleName, ChatType, ChatAIRequestForm } from '@/types';
import { GenerativeLanguageMessage, Roles } from './types';
import { ModelUnsupportError } from '@/errors';
import { ChatMessage } from '@/types/request';

export function parseMessage(messages:ChatMessage[]) {
    const contents:GenerativeLanguageMessage = [];

    for(const request of messages) {
        const role = request.role;
        const parts = request.content.map(content => {
            if (content.chatType === ChatType.TEXT) {
                return {
                    text: content.text ?? ''
                }
            }
            else if (content.chatType === ChatType.IMAGE_URL) {
                throw new ModelUnsupportError(`Gemini API does not support chatType : IMAGE_URL`);
            }
            else if (content.chatType === ChatType.IMAGE_BASE64) {
                return {
                    inline_data : {
                        'mime_type' : `image/${content.extension ?? 'jpeg'}`,
                        'data' : content.image_url ?? ''
                    }
                }

            }
        });
        contents.push({
            role: Roles[role] ?? Roles[ChatRoleName.User],
            parts: parts as any
        });
    }
    return contents;
}