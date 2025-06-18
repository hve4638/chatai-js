import { ChatAIRequest } from '@/types'
import type { ChatAIResult, ChatAIResultResponse } from '@/types/response';

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';
import {
    AnthropicBody,
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

class AnthropicAPI extends BaseChatAIRequestAPI<AnthropicData> {
    static readonly DEFAULT_URL = 'https://api.anthropic.com';
    static readonly DEFAULT_PATH = '/v1/messages';

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
        const domain = this.body.endpoint_url ?? AnthropicAPI.DEFAULT_URL;
        const path = this.body.endpoint_path ?? AnthropicAPI.DEFAULT_PATH;
        return domain + path;
    }

    async makeRequestConfig():Promise<AxiosRequestConfig<any>> {
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': this.body.auth.api_key,
            'anthropic-version': '2023-06-01'
        };
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(): Promise<AnthropicBody> {
        const body = AnthropicAPITool.parseBody(this.body, this.option);
        return body;
    }
    async parseResponseOK(request:ChatAIRequest, response:ChatAIResponse):Promise<ChatAIResultResponse> {
        return AnthropicAPITool.parseResponseOK(response as ChatAIResponse<AnthropicResponse>);
    }

    async mergeStreamFragment() {
        throw new Error('Not implemented');
    }

    async parseStreamData():Promise<string | undefined> {
        throw new Error('Not implemented');
    }
    
    // protected override async mergeStreamFragment(streamConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
    //     let partOfChunk:string|null = null;
    //     while(true) {
    //         const line = await streamConsumer.dequeue();
    //         if (line === null) return null;
            
    //         // "event:" 로 시작하는 줄은 무시하고 "data:" 만 처리
    //         let fragment:string;
    //         if (partOfChunk === null) {
    //             if (!line.startsWith('data:')) {
    //                 continue;
    //             }
    //             fragment = line.slice(5).trim();
    //         }
    //         else {
    //             fragment = partOfChunk + line;
    //             partOfChunk = null;
    //         }

    //         try {
    //             return JSON.parse(fragment);
    //         }
    //         catch (e) {
    //             partOfChunk = fragment;
    //             console.error('Incomplete stream data : ', fragment);
    //             continue;
    //         }
    //     }
    // }
    // protected override async parseStreamData(data: unknown, responseResult: ChatAIResultResponse): Promise<string | undefined> {
    //     const streamData = data as ClaudeStreamData;

    //     switch (streamData.type) {
    //         case 'message_start':
    //             return this.#parseStreamMessageStart(streamData, responseResult);
    //         case 'content_block_start':
    //             return this.#parseStreamContentBlockStart(streamData, responseResult);
    //         case 'content_block_delta':
    //             return this.#parseStreamContentBlockDelta(streamData, responseResult);
    //         case 'content_block_stop':
    //             return this.#parseStreamContentBlockStop(streamData, responseResult);
    //         case 'message_delta':
    //             return this.#parseStreamMessageDelta(streamData, responseResult);
    //         case 'message_stop':
    //         case 'ping':
    //             return undefined;
    //     }
    // }

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