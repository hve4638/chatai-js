import { ChatMessages, ChatRoleName, ChatType } from '@/types';
import { ChatAIRequestOption } from '../types';
import { ResponsesBody, ResponsesRequest, ResponsesMessages, Roles, ResponsesResponse } from './types';
import { ChatAIResponse } from '@/types';
import { ChatAIResultResponse, FinishReason } from '@/types/response';

class ResponsesTool {
    static parseBody(request: ResponsesRequest, option: ChatAIRequestOption): ResponsesBody {
        const messages = this.parseMessages(request.messages);
        const body: ResponsesBody = {
            model: request.model,
            input: messages,
            max_output_tokens: request.max_tokens ?? 1024,
        };

        if (request.temperature) body.temperature = request.temperature;
        if (request.top_p) body.top_p = request.top_p;

        if (request.thinking_effort) {
            body.reasoning ??= {};
            body.reasoning.effort = request.thinking_effort;
        }

        if (option.stream) {
            body.stream = true;
        }
        // @TODO: 추론 요약 옵션이 작동하지 않는 문제
        // if (data.thinking_summary) {
        //     body.reasoning ??= {};
        //     body.reasoning.generate_summary = data.thinking_summary;
        // }
        return body;
    }

    static parseMessages(messages: ChatMessages): ResponsesMessages {
        const result: ResponsesMessages = [];
        for (const m of messages) {
            if (m.content.length === 0) continue;
            
            const chatBlock = {
                role: Roles[m.role] ?? Roles[ChatRoleName.User],
                content: [] as any[]
            };
            for (const chat of m.content) {
                if (chat.chatType === ChatType.Text) {
                    chatBlock.content.push({
                        type: 'input_text',
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
            }

            result.push(chatBlock);
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

        let finishReason: FinishReason;
        if (data.incomplete_details) {
            finishReason = FinishReason.Unknown;
        }
        else {
            finishReason = FinishReason.End;
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