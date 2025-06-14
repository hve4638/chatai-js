import { ChatRoleName, ChatType, ChatAIRequestForm, ChatAIResponse } from '@/types';
import { AnthropicBody, AnthropicRequest, AnthropicMessages, Roles, AnthropicResponse } from './types';
import { ModelUnsupportError } from '@/errors';
import { ChatAIRequestOption, ChatMessage } from '@/types/request';
import { ChatAIResultResponse } from '@/types/response';

class AnthropicAPITool {
    static parseBody(request: AnthropicRequest, option: ChatAIRequestOption): AnthropicBody {
        const {
            messages,
            system
        } = this.parseMessages(request.messages);

        const body: AnthropicBody = {
            model: request.model,
            messages: messages,
        };

        if (system) body.system = system;
        if (option.stream) body.stream = true;
        if (request.max_tokens) body.max_tokens = request.max_tokens;
        if (request.temperature) body.temperature = request.temperature;
        if (request.top_p) body.top_p = request.top_p;
        if (request.thinking_tokens) {
            body.thinking = {
                type: 'enabled',
                budget_tokens: request.thinking_tokens,
            }
        }
        return body;
    }

    static parseMessages(messages: ChatMessage[]): { messages: AnthropicMessages, system: string } {
        let systemPrompt = '';
        const result: AnthropicMessages = [];

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
                    content: [] as any[]
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
                            type: 'image',
                            source: {
                                'type': 'base64',
                                'media_type': `image/${c.extension ?? 'jpeg'}`,
                                'data': `${c.image_url ?? ''}`
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
            messages: result,
            system: systemPrompt,
        }
    }

    static parseResponseOK(response: ChatAIResponse<AnthropicResponse>): ChatAIResultResponse {
        const data = response.data;

        const thinkingContent: string[] = [];
        const content: string[] = [];
        for (const c of data.content) {
            if (c.type === 'thinking') {
                thinkingContent.push(c.thinking);
            }
            else {
                content.push(c.text);
            }
        }
        if (content.length === 0) {
            content.push('');
        }

        let warning: string | null;
        const reason = data.stop_reason;
        if (reason == 'end_turn') warning = null;
        else if (reason == 'max_tokens') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;

        const input_tokens = data.usage.input_tokens;
        const output_tokens = data.usage.output_tokens;
        return {
            ok : true,
            http_status : response.status,
            http_status_text : response.message,
            raw: data,

            thinking_content: thinkingContent,
            content: content,
            warning: warning,

            tokens: {
                input: data.usage.input_tokens,
                output: data.usage.output_tokens,
                total: input_tokens + output_tokens,
            },
            finish_reason: reason,
        }
    }
}

export default AnthropicAPITool;