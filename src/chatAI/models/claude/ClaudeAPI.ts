import { CHAT_ROLE, CHAT_TYPE, type RequestForm } from '../../types/request-form'
import { ChatAIResponse } from '../../types/response-data';

import { CLAUDE_URL, ROLE, ROLE_DEFAULT } from './data'

import { assertNotNull, AsyncQueue, bracketFormat } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'
import { ModelUnsupportError } from '../../errors';

type ClaudeMessage = {
    role: ROLE;
    content: ({
        type: 'text';
        text: string;
    } | {
        type: 'image';
        source: {
            type: 'base64';
            media_type: string;
            data: string;
        };
    })[];
}[];

class ClaudeAPI extends ChatAIAPI {
    makeRequestData(form: RequestForm): [string, object, object] {
        assertNotNull(form.secret?.api_key, 'api_key is required');

        let systemPrompt = '';
        const messages: ClaudeMessage = [];
        for (const message of form.message) {
            const role = ROLE[message.role];
            //const text = message.content[0].text!;

            if (role === ROLE.SYSTEM) {
                const text = message.content[0].text!;
                if (messages.length === 0) {
                    systemPrompt += text;
                }
                else {
                    messages.push({
                        role: ROLE[CHAT_ROLE.BOT],
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
                    if (c.chatType == CHAT_TYPE.TEXT) {
                        chatBlock.content.push({
                            type: 'text',
                            text: c.text ?? ''
                        });
                    }
                    else if (c.chatType == CHAT_TYPE.IMAGE_BASE64) {
                        chatBlock.content.push({
                            type : 'image',
                            source : {
                                'type' : 'base64',
                                'media_type' : `image/${c.extension ?? 'jpeg'}`,
                                'data' : `${c.image_url ?? ''}`
                            }
                        });
                    }
                    else if (c.chatType == CHAT_TYPE.IMAGE_URL) {
                        throw new ModelUnsupportError(`Claude API does not support chatType : IMAGE_URL`);
                    }
                }
                messages.push(chatBlock);
            }
        }

        const url = CLAUDE_URL;
        const body = {
            model: form.model_detail,
            messages: messages,
            system: systemPrompt,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p: form.top_p ?? 1.0,
        };
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': form.secret.api_key,
            'anthropic-version': '2023-06-01'
        };
        return [url, body, { headers }];
    }
    handleResponse(rawResponse: any) {
        let warning: string | null;

        const reason = rawResponse.stop_reason;
        const text = rawResponse.content[0]?.text ?? '';

        if (reason == 'end_turn') warning = null;
        else if (reason == 'max_tokens') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;

        const input_tokens = rawResponse.usage?.input_tokens ?? 0;
        const output_tokens = rawResponse.usage?.output_tokens ?? 0;
        return {
            raw: rawResponse,

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

    async handleStreamChunk(chunkOutputQueue: AsyncQueue, messageInputQueue: AsyncQueue): Promise<Omit<ChatAIResponse['response'], 'ok' | 'http_status' | 'http_status_text'>> {
        throw new Error('Not implemented.');
    }
}

export default ClaudeAPI;