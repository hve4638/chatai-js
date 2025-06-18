import { ChatRoleName, ChatType, ChatAIResponse, ChatAIRequestOption, ChatMessages } from '@/types';
import { AnthropicBody, AnthropicRequest, AnthropicMessages, Roles, AnthropicResponse, AnthropicMessageContent } from './types';
import { ModelUnsupportError } from '@/errors';
import { ChatAIResultResponse, FinishReason } from '@/types/response';

class AnthropicAPITool {
    static parseBody(request: AnthropicRequest, option: ChatAIRequestOption): AnthropicBody {
        const {
            messages,
            system
        } = this.parseMessages(request.messages);

        const body: AnthropicBody = {
            model: request.model,
            messages: messages,
            max_tokens: request.max_tokens ?? 1024,
        };

        if (system) body.system = system;
        if (option.stream) body.stream = true;
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

    static parseMessages(messages: ChatMessages): { messages: AnthropicMessages, system: string } {
        let systemPrompt = '';
        const result: AnthropicMessages = [];

        for (const m of messages) {
            const role = Roles[m.role];
            if (role === Roles[ChatRoleName.System]) {
                for (const c of m.content) {
                    if (c.chatType !== ChatType.Text) {
                        throw new Error(`Invalid system message type: ${c.chatType}`);
                    }

                    if (result.length === 0) {
                        systemPrompt += c.text;
                    }
                    else {
                        result.push({
                            role: Roles[ChatRoleName.Assistant],
                            content: [
                                {
                                    type: 'text',
                                    text: 'system: ' + c.text,
                                }
                            ]
                        });
                    }
                }
            }
            else {
                const chatBlock = {
                    role: role,
                    content: [] as AnthropicMessageContent[]
                }
                for (const c of m.content) {
                    if (c.chatType == ChatType.Text) {
                        chatBlock.content.push({
                            type: 'text',
                            text: c.text
                        });
                    }
                    else if (c.chatType == ChatType.ImageBase64) {
                        chatBlock.content.push({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: `image/${c.extension ?? 'jpeg'}`,
                                data: c.data
                            }
                        });
                    }
                    else if (c.chatType == ChatType.ImageURL) {
                        chatBlock.content.push({
                            type: 'image',
                            source: {
                                type: 'url',
                                url: c.url,
                            }
                        });
                    }
                    else if (c.chatType == ChatType.PDFBase64) {
                        chatBlock.content.push({
                            type: 'document',
                            source: {
                                type: 'base64',
                                media_type: 'application/pdf',
                                data: c.data
                            }
                        });
                    }
                    else if (c.chatType == ChatType.PDFUrl) {
                        chatBlock.content.push({
                            type: 'document',
                            source: {
                                type: 'url',
                                url: c.url,
                            }
                        });
                    }
                    else {
                        const unhandledType = (c as any)?.chatType;
                        throw new ModelUnsupportError(`Anthropic API does not support chatType: ${unhandledType}`);
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

        let finishReason: FinishReason;
        let warning: string | null = null;
        switch (data.stop_reason) {
            case 'end_turn':
                finishReason = FinishReason.End;
                break;
            case 'max_tokens':
                finishReason = FinishReason.MaxToken;
                break;
            case 'tool_use':
                finishReason = FinishReason.ToolUse;
                break;
            default:
                finishReason = FinishReason.Unknown;
                warning = `Unhandled reason: ${data.stop_reason}`;
        }

        const input_tokens = data.usage.input_tokens;
        const output_tokens = data.usage.output_tokens;
        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            thinking_content: thinkingContent,
            content: content,
            warning: warning,

            tokens: {
                input: data.usage.input_tokens,
                output: data.usage.output_tokens,
                total: input_tokens + output_tokens,
            },
            finish_reason: finishReason,
        }
    }
}

export default AnthropicAPITool;