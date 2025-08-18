import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { ChatAIRequest, ChatAIRequestOption, ChatAIResultResponse, FinishReason } from '@/types'
import { ChatAIResponse } from '@/types'
import { assertFieldExists, AsyncQueue } from '@/utils'

import { BaseChatAIRequestAPI } from '../base'
import { ResponsesData } from './types'
import ResponsesTool from './ResponsesTool'
import Channel from '@hve/channel'
import ResponsesStreamTool from './ResponsesStreamTool'

class ResponsesAPI extends BaseChatAIRequestAPI<ResponsesData> {
    static readonly DEFAULT_URL = 'https://api.openai.com/v1/responses';
    // static readonly DEFAULT_PATH = '/v1/responses';

    constructor(body: ResponsesData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new ResponsesAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        return this.body.url ?? ResponsesAPI.DEFAULT_URL;
    }
    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        assertFieldExists(this.body.auth.api_key, 'auth.api_key');

        const extraHeaders = this.body.headers ?? {}
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.body.auth.api_key}`,
            ...extraHeaders
        }
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(): Promise<object> {
        return ResponsesTool.parseBody(this.body, this.option);
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse) {
        return ResponsesTool.parseResponseOK(response as ChatAIResponse<any>);
    }

    getMessageFromStreamChunk(chunk: any): string {
        return chunk['choices'][0]['delta']['content'];
    }

    handleResponse(res: any) {
        let warning: string | null;
        const reason = res.choices[0]?.finish_reason;
        const text = res.choices[0]?.message?.content ?? '';

        if (reason === 'stop') warning = null;
        else if (reason === 'length') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;

        return {
            raw: res,

            content: [text],
            warning: warning,

            tokens: {
                input: res.usage?.prompt_tokens ?? 0,
                output: res.usage?.completion_tokens ?? 0,
                total: res.usage?.total_tokens ?? 0,
            },
            finish_reason: reason,
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
            const data = await ResponsesStreamTool.receiveStream(streamCh);
            if (data === null) break;

            const message = await ResponsesStreamTool.parseStreamData(data, chatAIResponse);
            if (message === null) continue;
            else if (message.type === 'response_delta') {
                if (chatAIResponse.content.length === 0) chatAIResponse.content.push(message.delta);
                else chatAIResponse.content[0] += message.delta;

                messageCh.produce(message.delta);
            }
            else if (message.type === 'response_overwrite') {
                if (chatAIResponse.content.length === 0) chatAIResponse.content.push(message.text);
                else chatAIResponse.content[0] = message.text;
            }
        }
        messageCh.close();
        return chatAIResponse;
    }
}

export default ResponsesAPI;