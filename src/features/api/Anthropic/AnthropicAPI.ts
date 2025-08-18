import { ChatAIRequest, FinishReason } from '@/types'
import type { ChatAIResult, ChatAIResultResponse } from '@/types/response';

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';
import {
    AnthropicClaudeBody,
    AnthropicData,
    AnthropicResponse,
    ClaudeStreamData,
    ClaudeStreamDataContentBlockDelta,
    ClaudeStreamDataContentBlockStart,
    ClaudeStreamDataContentBlockStop,
    ClaudeStreamDataMessageDelta,
    ClaudeStreamDataMessageStart,
    ClaudeStreamDataMessageStop
} from './types';
import { BaseChatAIRequestAPI } from '../base';
import AnthropicAPITool from './AnthropicAPITool';
import { ChatAIResponse, ChatAIRequestOption } from '@/types';
import Channel from '@hve/channel';
import AnthropicAPIStreamTool from './AnthropicAPIStreamTool';

class AnthropicAPI extends BaseChatAIRequestAPI<AnthropicData> {
    static readonly DEFAULT_URL = 'https://api.anthropic.com/v1/messages';
    // static readonly DEFAULT_PATH = '';

    constructor(body: AnthropicData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new AnthropicAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        return this.body.url ?? AnthropicAPI.DEFAULT_URL;
    }

    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        const extraHeaders = this.body.headers ?? {}

        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.body.auth.api_key,
            'anthropic-version': '2023-06-01',
            ...extraHeaders,
        };
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(): Promise<AnthropicClaudeBody> {
        const body = AnthropicAPITool.parseBody(this.body, this.option);
        return body;
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse> {
        return AnthropicAPITool.parseResponseOK(response as ChatAIResponse<AnthropicResponse>);
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
            const data = await AnthropicAPIStreamTool.receiveStream(streamCh);
            if (data === null) break;

            const message = await AnthropicAPIStreamTool.parseStreamData(data, chatAIResponse);
            if (message !== null) {
                if (chatAIResponse.content.length === 0) chatAIResponse.content.push(message);
                else chatAIResponse.content[0] += message;

                messageCh.produce(message);
            }
        }
        messageCh.close();
        return chatAIResponse;
    }

    // async #parseStreamMessageStart(data: ClaudeStreamDataMessageStart, responseResult: ChatAIResultResponse):Promise<string|undefined> {
    //     const usage = data.message.usage;
    //     if (usage) {
    //         if (usage.input_tokens) responseResult.tokens.input ??= usage.input_tokens;
    //         if (usage.output_tokens) responseResult.tokens.output ??= usage.output_tokens;
    //         // if (usage.cache_creation_input_tokens) responseResult.tokens.cache_creation_input ??= usage.cache_creation_input_tokens;
    //         // if (usage.cache_read_input_tokens) responseResult.tokens.cache_read_input ??= usage.cache_read_input_tokens;
    //     }
    //     return;
    // }
    // async #parseStreamContentBlockStart(data: ClaudeStreamDataContentBlockStart, responseResult: ChatAIResultResponse):Promise<string|undefined> {
    //     return;
    // }
    // async #parseStreamContentBlockDelta(data: ClaudeStreamDataContentBlockDelta, responseResult: ChatAIResultResponse):Promise<string|undefined> {
    //     return data.delta?.text;
    // }
    // async #parseStreamContentBlockStop(data: ClaudeStreamDataContentBlockStop, responseResult: ChatAIResultResponse):Promise<string|undefined> {
    //     // nothing to do

    //     return;
    // }
    // async #parseStreamMessageDelta(data: ClaudeStreamDataMessageDelta, responseResult: ChatAIResultResponse):Promise<string|undefined> {
    //     const delta = data.delta;
    //     if (delta?.stop_reason) responseResult.finish_reason = delta.stop_reason;
    //     if (delta?.stop_sequence) responseResult.finish_reason = delta.stop_sequence;

    //     const usage = data.usage;
    //     if (usage?.output_tokens) responseResult.tokens.output = usage.output_tokens;

    //     return;
    // }
}

export default AnthropicAPI;