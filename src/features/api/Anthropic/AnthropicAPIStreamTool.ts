import Channel from '@hve/channel';
import { ChatAIResultResponse, FinishReason } from '@/types';

import type { AnthropicClaudeStreamData, ClaudeStreamDataContentBlockDelta, ClaudeStreamDataContentBlockStart, ClaudeStreamDataContentBlockStop, ClaudeStreamDataMessageDelta, ClaudeStreamDataMessageStart } from './types';
import AnthropicAPITool from './AnthropicAPITool';
import { ChatAITool } from '../base';

class AnthropicAPIStreamTool {
    static async receiveStream(streamCh: Channel<string>): Promise<AnthropicClaudeStreamData | null> {
        let fragment: string = '';
        while (true) {
            const line = await streamCh.consume();
            if (line === null) return null;

            if (fragment === '') {
                // "event:" 로 시작하는 줄은 무시
                if (line.startsWith('event:')) continue;

                if (!line.startsWith('data:')) continue;

                fragment = line.slice(5);
                if (fragment === '[DONE]') return null;
            }
            else {
                fragment += line;
            }

            // 거의 모든 경우에 한 fragment 내에 완전한 JSON이 전달되지만
            // 문서 상에선 한 fragment에 완전한 JSON이 오는 것을 보장하지 않음
            try {
                return JSON.parse(fragment.trim()) as AnthropicClaudeStreamData;
            }
            catch (e) {
                console.error('Incomplete stream data : ', fragment);
                continue;
            }
        }
    }

    static async parseStreamData(streamData: AnthropicClaudeStreamData, response: ChatAIResultResponse): Promise<string | null> {
        switch (streamData.type) {
            case 'message_start':
                return this.#parseStreamMessageStart(streamData, response);
            case 'message_delta':
                return this.#parseStreamMessageDelta(streamData, response);
            case 'message_stop': // nothing to do
                return this.#parseStreamMessageStop(streamData, response);
            case 'content_block_start':
                return this.#parseStreamContentBlockStart(streamData, response);
            case 'content_block_stop': // nothing to do
                return this.#parseStreamContentBlockStop(streamData, response);
            case 'content_block_delta':
                return this.#parseStreamContentBlockDelta(streamData, response);
            case 'ping': // nothing to do
                return this.#parseStreamPing(streamData, response);
            default:
                return null;
        }
    }

    static async #parseStreamMessageStart(data: ClaudeStreamDataMessageStart, responseResult: ChatAIResultResponse): Promise<string | null> {
        const usage = data.message.usage;
        if (usage) {
            if (usage.input_tokens) responseResult.tokens.input ??= usage.input_tokens;
            if (usage.output_tokens) responseResult.tokens.output ??= usage.output_tokens;
            // if (usage.cache_creation_input_tokens) responseResult.tokens.cache_creation_input ??= usage.cache_creation_input_tokens;
            // if (usage.cache_read_input_tokens) responseResult.tokens.cache_read_input ??= usage.cache_read_input_tokens;
        }
        return null;
    }
    static async #parseStreamMessageStop(streamData: ClaudeStreamDataMessageStart, response: ChatAIResultResponse): Promise<string | null> {
        // nothing to do
        return null;
    }
    static async #parseStreamMessageDelta(data: ClaudeStreamDataMessageDelta, responseResult: ChatAIResultResponse): Promise<string | null> {
        const delta = data.delta;

        if (delta?.stop_reason) {
            const finishReason = AnthropicAPITool.parseFinishReason(delta.stop_reason);

            responseResult.finish_reason = finishReason;
            if (finishReason === FinishReason.Unknown) {
                responseResult.warning = ChatAITool.getUnhandledReasonWarningMessage(delta.stop_reason);
            }
        }

        const usage = data.usage;
        if (usage) {
            if (usage.input_tokens) responseResult.tokens.input ??= usage.input_tokens;
            if (usage.output_tokens) responseResult.tokens.output ??= usage.output_tokens;
            // if (usage.cache_creation_input_tokens) responseResult.tokens.cache_creation_input ??= usage.cache_creation_input_tokens;
            // if (usage.cache_read_input_tokens) responseResult.tokens.cache_read_input ??= usage.cache_read_input_tokens;
        }

        return null;
    }
    static async #parseStreamContentBlockStart(streamData: ClaudeStreamDataContentBlockStart, response: ChatAIResultResponse): Promise<string | null> {
        return streamData.content_block?.text ?? null;
    }
    static async #parseStreamContentBlockStop(streamData: ClaudeStreamDataContentBlockStop, response: ChatAIResultResponse): Promise<string | null> {
        // nothing to do
        return null;
    }
    static async #parseStreamContentBlockDelta(streamData: ClaudeStreamDataContentBlockDelta, response: ChatAIResultResponse): Promise<string | null> {
        return streamData.delta?.text ?? null;
    }
    static async #parseStreamPing(streamData: ClaudeStreamDataMessageStart, response: ChatAIResultResponse): Promise<string | null> {
        // nothing to do
        return null;
    }
}

export default AnthropicAPIStreamTool;