import { ChatAIRequest, ChatAIRequestOption, type ChatAIRequestForm } from '@/types/request'
import type { ChatAIResult, ChatAIResultResponse } from '@/types/response';

import BaseEndpoint from '../BaseEndpoint'

import { assertFieldExists, AsyncQueue } from '@/utils'
import {
    DEFAULT_BASE_URL,
    ENDPOINT_URL,
} from './data';
import { parseClaudeMessage } from './message-parser';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';
import { ClaudeStreamData, ClaudeStreamDataContentBlockDelta, ClaudeStreamDataContentBlockStart, ClaudeStreamDataContentBlockStop, ClaudeStreamDataMessageDelta, ClaudeStreamDataMessageStart, ClaudeStreamDataMessageStop } from './types';

class ClaudeEndpoint extends BaseEndpoint {
    get baseURL() {
        return DEFAULT_BASE_URL;
    }

    async makeRequestURL(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        return form.base_url + ENDPOINT_URL;
    }
    async makeRequestConfig(form:ChatAIRequestForm, option:ChatAIRequestOption):Promise<AxiosRequestConfig<any>> {
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': form.secret.api_key,
            'anthropic-version': '2023-06-01'
        };
        if (option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        assertFieldExists(form.model_name, 'model_name');

        const {
            message : messages,
            systemPrompt
        } = parseClaudeMessage(form.message);

        const body = {
            model: form.model_name,
            messages: messages,
            system: systemPrompt,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p: form.top_p ?? 1.0,
            stream : option.stream,
        };
        return body;
    }
    async parseResponseOK(request:ChatAIRequest, response:AxiosResponse<any>):Promise<ChatAIResultResponse> {
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
            http_status_text : response.statusText,
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
    
    protected override async mergeStreamFragment(streamConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
        let partOfChunk:string|null = null;
        while(true) {
            const line = await streamConsumer.dequeue();
            if (line === null) return null;
            
            // "event:" 로 시작하는 줄은 무시하고 "data:" 만 처리
            let fragment:string;
            if (partOfChunk === null) {
                if (!line.startsWith('data:')) {
                    continue;
                }
                fragment = line.slice(5).trim();
            }
            else {
                fragment = partOfChunk + line;
                partOfChunk = null;
            }

            try {
                return JSON.parse(fragment);
            }
            catch (e) {
                partOfChunk = fragment;
                console.error('Incomplete stream data : ', fragment);
                continue;
            }
        }
    }
    protected override async parseStreamData(data: unknown, responseResult: ChatAIResultResponse): Promise<string | undefined> {
        const streamData = data as ClaudeStreamData;

        switch (streamData.type) {
            case 'message_start':
                return this.#parseStreamMessageStart(streamData, responseResult);
            case 'content_block_start':
                return this.#parseStreamContentBlockStart(streamData, responseResult);
            case 'content_block_delta':
                return this.#parseStreamContentBlockDelta(streamData, responseResult);
            case 'content_block_stop':
                return this.#parseStreamContentBlockStop(streamData, responseResult);
            case 'message_delta':
                return this.#parseStreamMessageDelta(streamData, responseResult);
            case 'message_stop':
            case 'ping':
                return undefined;
        }
    }

    async #parseStreamMessageStart(data: ClaudeStreamDataMessageStart, responseResult: ChatAIResultResponse):Promise<string|undefined> {
        const usage = data.message.usage;
        if (usage) {
            if (usage.input_tokens) responseResult.tokens.input ??= usage.input_tokens;
            if (usage.output_tokens) responseResult.tokens.output ??= usage.output_tokens;
            // if (usage.cache_creation_input_tokens) responseResult.tokens.cache_creation_input ??= usage.cache_creation_input_tokens;
            // if (usage.cache_read_input_tokens) responseResult.tokens.cache_read_input ??= usage.cache_read_input_tokens;
        }
        return;
    }
    async #parseStreamContentBlockStart(data: ClaudeStreamDataContentBlockStart, responseResult: ChatAIResultResponse):Promise<string|undefined> {
        return;
    }
    async #parseStreamContentBlockDelta(data: ClaudeStreamDataContentBlockDelta, responseResult: ChatAIResultResponse):Promise<string|undefined> {
        return data.delta?.text;
    }
    async #parseStreamContentBlockStop(data: ClaudeStreamDataContentBlockStop, responseResult: ChatAIResultResponse):Promise<string|undefined> {
        // nothing to do

        return;
    }
    async #parseStreamMessageDelta(data: ClaudeStreamDataMessageDelta, responseResult: ChatAIResultResponse):Promise<string|undefined> {
        const delta = data.delta;
        if (delta?.stop_reason) responseResult.finish_reason = delta.stop_reason;
        if (delta?.stop_sequence) responseResult.finish_reason = delta.stop_sequence;

        const usage = data.usage;
        if (usage?.output_tokens) responseResult.tokens.output = usage.output_tokens;

        return;
    }
}

export default ClaudeEndpoint;