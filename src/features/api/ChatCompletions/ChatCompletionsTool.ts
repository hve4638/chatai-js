import { ChatAIRequestOption, ChatMessages, ChatRoleName, ChatType } from '@/types';
import { ChatCompletionsMessages, ChatCompletionsRequest, Roles } from './types';
import { JSONSchema } from '@/features/response-format';
import { ChatCompletionsBody, ChatCompletionsBodyResponseFormat } from './types/body';
import { ModelUnsupportError } from '@/errors';
import { ChatCompletionsAllowedResponseFormat } from './types/request';

class ChatCompletionsTool {
    static parseBody(request: ChatCompletionsRequest, option: ChatAIRequestOption): ChatCompletionsBody {
        const messages = ChatCompletionsTool.parseMessages(request.messages);

        const body: ChatCompletionsBody = {
            model: request.model,
            messages: messages,
            // max_tokens: request.max_tokens ?? 1024,
            max_completion_tokens: request.max_tokens ?? 1024,
        }

        if (request.thinking_effort) body.reasoning_effort = request.thinking_effort;
        if (request.temperature) body.temperature = request.temperature;
        if (request.top_p) body.top_p = request.top_p;
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

    static parseMessages(messages: ChatMessages): ChatCompletionsMessages {
        const result: ChatCompletionsMessages = [];
        for (const m of messages) {
            if (m.content.length === 0) continue;
            const chatBlock = {
                role: Roles[m.role] ?? Roles[ChatRoleName.User],
                content: [] as any[]
            };
            for (const chat of m.content) {
                if (chat.chatType === ChatType.Text) {
                    chatBlock.content.push({
                        type: 'text',
                        text: chat.text
                    });
                }
                else if (chat.chatType === ChatType.ImageURL) {
                    chatBlock.content.push({
                        type: 'image_url',
                        image_url: {
                            url: chat.url
                        }
                    });
                }
                else if (chat.chatType === ChatType.ImageBase64) {
                    chatBlock.content.push({
                        type: 'image_url',
                        image_url: {
                            url: `data:image/${chat.extension ?? 'jpeg'};base64,${chat.data}`
                        }
                    });
                }
                else if (chat.chatType === ChatType.PDFBase64) {
                    chatBlock.content.push({
                        type: 'file',
                        file: {
                            filename: chat.filename,
                            file_data: `data:application/pdf;base64,${chat.data}`
                        }
                    });
                }
                else {
                    const unhandledType = (chat as any)?.chatType;
                    throw new ModelUnsupportError(`Chat Completion API does not support chatType: ${unhandledType}`);
                }
            }

            result.push(chatBlock);
        }

        return result;
    }

    static parseResponseFormat(responseFormat?: ChatCompletionsAllowedResponseFormat): ChatCompletionsBodyResponseFormat | undefined {
        if (!responseFormat || responseFormat.type === 'text') {
            return;
        }
        else if (responseFormat.type === 'json_object') {
            return {
                'type': 'json_object'
            }
        }
        else if (responseFormat.type === 'json_schema') {
            const schema = JSONSchema.parse(responseFormat.schema, {
                'array': (element: object) => {
                    return {
                        'type': 'array',
                        'items': element,
                    }
                },
                'object': ({ description, allowAdditionalProperties }, fields: object, options) => {
                    return {
                        'type': 'object',
                        'properties': fields,
                        'required': options.required,
                        'additionalProperties': allowAdditionalProperties ?? false,
                        ...(description && { description }),
                    }
                },
                'boolean': ({ description }) => ({ 'type': 'boolean', ...(description && { description }) }),
                'number': ({ description }) => ({ 'type': 'number', ...(description && { description }) }),
                'string': ({ description }) => ({ 'type': 'string', ...(description && { description }) }),
                'enum': ({ enum: chocies }) => {
                    return {
                        'type': 'string',
                        'enum': chocies,
                    }
                },
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
        return;
    }
}

export default ChatCompletionsTool;