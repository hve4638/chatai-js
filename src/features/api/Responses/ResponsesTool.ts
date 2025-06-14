import { ChatMessage, ChatRoleName, ChatType } from '@/types/request';
import { ChatAIRequestOption } from '../types';
import { ResponsesBody, ResponsesRequest, ResponsesMessages, Roles, ResponsesResponse } from './types';
import { ChatAIResponse } from '@/types';
import { ChatAIResultResponse } from '@/types/response';

class ResponsesTool {
    static parseBody(data: ResponsesRequest, option: ChatAIRequestOption): ResponsesBody {
        const messages = this.parseMessages(data.messages);
        const body: ResponsesBody = {
            model: data.model,
            top_p: data.top_p ?? 1.0,
            temperature: data.temperature ?? 1.0,
            max_output_tokens: data.max_tokens ?? 1024,
            input: messages,
        };

        if (data.thinking_effort) {
            body.reasoning ??= {};
            body.reasoning.effort = data.thinking_effort;
        }
        // @TODO: 추론 요약 옵션이 작동하지 않는 문제
        // if (data.thinking_summary) {
        //     body.reasoning ??= {};
        //     body.reasoning.generate_summary = data.thinking_summary;
        // }
        return body;
    }

    static parseMessages(messages: ChatMessage[]): ResponsesMessages {
        const result: ResponsesMessages = [];
        for (const m of messages) {
            if (m.content.length === 0) continue;
            if (m.content.length === 1) {
                result.push({
                    role: Roles[m.role] ?? Roles[ChatRoleName.User],
                    content: [
                        {
                            type: 'input_text',
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
                            type: 'input_text',
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

    static parseResponseOK(response: ChatAIResponse<ResponsesResponse>): ChatAIResultResponse {
        const data = response.data!;
        let warning: string | null = (data.incomplete_details) ? data.incomplete_details.reason : null;

        const thinking_content: string[] = [];
        const content: string[] = [];
        for (const m of data.output) {
            switch (m.type) {
                case 'reasoning':
                    thinking_content.push(m.summary[0] as string);
                    break;
                case 'message':
                    content.push(m.content[0].text);
                    break;
            }
        }
        if (content.length === 0) {
            content.push('');
        }

        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            thinking_content: thinking_content,
            content: content,
            warning: warning,

            tokens: {
                input: data.usage.input_tokens,
                output: data.usage.output_tokens,
                total: data.usage.total_tokens,
            },
            finish_reason: 'unknown',
        };
    }
}

export default ResponsesTool;