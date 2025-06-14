import { ChatAIRequestOption, ChatMessage, ChatRoleName, ChatType } from '@/types/request';
import { ChatCompletionsMessages, ChatCompletionsRequest, Roles } from './types';
import { ResponseFormat } from '@/types';
import { JSONSchema } from '@/features/chatai';
import { ChatCompletionsBody, ChatCompletionsResponseFormat } from './types/body';

class ChatCompletionsTool {
    static parseBody(request: ChatCompletionsRequest, option: ChatAIRequestOption): ChatCompletionsBody {
        const messages = ChatCompletionsTool.parseMessages(request.messages);
        const body: ChatCompletionsBody = {
            model: request.model,
            messages: messages,
            max_tokens: request.max_tokens,
            temperature: request.temperature,
            top_p: request.top_p,
        }

        if (option.stream) {
            body.stream = true;
            body.stream_options = { include_usage: true };
        }
        const responseFormat = this.parseResponseFormat(request.response_format);
        if (responseFormat) {
            body.response_format = responseFormat;
        }
        return body;
    }

    static parseMessages(messages: ChatMessage[]): ChatCompletionsMessages {
        const result: ChatCompletionsMessages = [];
        for (const m of messages) {
            if (m.content.length === 0) continue;
            if (m.content.length === 1) {
                result.push({
                    role: Roles[m.role] ?? Roles[ChatRoleName.User],
                    content: [
                        {
                            type: 'text',
                            text: m.content[0].text ?? '',
                        }
                    ]
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

    static parseResponseFormat(responseFormat?: ResponseFormat): ChatCompletionsResponseFormat | undefined {
        if (!responseFormat) return;

        if (responseFormat.type === 'json') {
            if (!responseFormat.schema) {
                return {
                    'type': 'json_object'
                }
            }
            else {
                const schema = JSONSchema.parse(responseFormat.schema, {
                    'array': (element) => ({ 'type': 'array', 'items': element }),
                    'object': (properties, options) => {
                        return {
                            'type': 'object',
                            'properties': properties,
                            'required': options.required ?? [],
                            'additionalProperties': options.allow_additional_properties ?? false
                        }
                    },
                    'boolean': () => ({ 'type': 'boolean' }),
                    'number': () => ({ 'type': 'number' }),
                    'string': () => ({ 'type': 'string' }),
                });

                return {
                    'type': 'json_schema',
                    'json_schema': {
                        'name': responseFormat.name,
                        'strict': true,
                        'schema': schema,
                    }
                }
            }
        }
        return;
    }
}

export default ChatCompletionsTool;