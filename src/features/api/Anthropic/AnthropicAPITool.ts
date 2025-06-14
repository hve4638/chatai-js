import { ChatRoleName, ChatType, ChatAIRequestForm, ChatAIResponse } from '@/types';
import { AnthropicBody, AnthropicRequest, AnthropicMessages, Roles } from './types';
import { ModelUnsupportError } from '@/errors';
import { ChatAIRequestOption, ChatMessage } from '@/types/request';

class AnthropicAPITool {
    static parseBody(request: AnthropicRequest, option: ChatAIRequestOption): AnthropicBody {
        const {
            messages,
            system
        } = this.parseMessages(request.messages);

        const body: AnthropicBody = {
            model: request.model,
            messages: messages,
            system: system,
            max_tokens: request.max_tokens ?? 1024,
            temperature: request.temperature ?? 1.0,
            top_p: request.top_p ?? 1.0,
            stream: option.stream,
        };
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

    static parseResponseOK(response: ChatAIResponse) {
        let warning: string | null;
        
        const data = response.data;
        const reason = data.stop_reason;
        const text = data.content[0]?.text ?? '';

        if (reason == 'end_turn') warning = null;
        else if (reason == 'max_tokens') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;

        const input_tokens = data.usage?.input_tokens ?? 0;
        const output_tokens = data.usage?.output_tokens ?? 0;
        return {
            ok : true,
            http_status : response.status,
            http_status_text : response.message,
            raw: data,

            content: [text],
            warning: warning,

            tokens: {
                input: input_tokens,
                output: output_tokens,
                total: input_tokens + output_tokens
            },
            finish_reason: reason,
        }
    }
}

export default AnthropicAPITool;