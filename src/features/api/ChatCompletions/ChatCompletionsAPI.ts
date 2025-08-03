import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { ChatAIRequest, ChatAIRequestOption } from '@/types'
import { ChatAIResultResponse, FinishReason } from '@/types/response';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';
import { assertFieldExists, AsyncQueue, getDefaultChatAIResponse } from '@/utils'

import type { ChatCompletionsData, ChatCompletionsResponse } from './types';
import { BaseChatAIRequestAPI, ChatAITool } from '../base';
import ChatCompletionsTool from './ChatCompletionsTool';
import { ChatAIResponse } from '@/types';
import ChatCompletionsStreamTool from './ChatCompletionsStreamTool';
import Channel from '@hve/channel';

class ChatCompletionsAPI extends BaseChatAIRequestAPI<ChatCompletionsData> {
    static readonly DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions';
    static readonly DEFAULT_OPTIONS = {
        TOP_P: 1.0,
        TEMPERATURE: 1.0,
        MAX_OUTPUT_TOKENS: 1024,
    };

    constructor(body: ChatCompletionsData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new ChatCompletionsAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        return this.body.url ?? ChatCompletionsAPI.DEFAULT_BASE_URL;
    }
    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        assertFieldExists(this.body.auth.api_key, 'secret.api_key');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.body.auth.api_key}`
        }
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(): Promise<object> {
        const body = ChatCompletionsTool.parseBody(this.body, this.option);
        return body;
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse<ChatCompletionsResponse>): Promise<ChatAIResultResponse> {
        const data = response.data;

        const content: string[] = [];
        const choice = data.choices[0];
        content.push(choice.message.content);
        const rawFinishResponse = choice.finish_reason;

        let finishReason: FinishReason;
        let warning: string | null = null;
        switch (rawFinishResponse) {
            case 'stop':
                finishReason = FinishReason.End;
                break;
            case 'length':
                finishReason = FinishReason.MaxToken;
                break;
            default:
                finishReason = FinishReason.Unknown;
                warning = `unhandled reason: ${rawFinishResponse}`;
                break;
        }

        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            content,
            thinking_content: [],
            warning: '',

            tokens: {
                input: data.usage?.prompt_tokens ?? 0,
                output: data.usage?.completion_tokens ?? 0,
                total: data.usage?.total_tokens ?? 0,
            },
            finish_reason: finishReason,
        };
    }

    async parseStreamData(response: ChatAIResponse, streamCh: Channel<string>, messageCh: Channel<string>): Promise<ChatAIResultResponse> {
        const chatAIResponse: ChatAIResultResponse = {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: null,

            content: [],
            thinking_content: [],
            warning: '',

            tokens: {
                input: 0,
                output: 0,
                total: 0,
            },
            finish_reason: FinishReason.Unknown,
        };

        while (true) {
            const data = await ChatCompletionsStreamTool.receiveStream(streamCh);
            if (data === null) break;

            const message = await ChatCompletionsStreamTool.parseStreamData(data, chatAIResponse);
            if (message !== null) messageCh.produce(message);
        }
        messageCh.close();
        return chatAIResponse;
    }
}

export default ChatCompletionsAPI;