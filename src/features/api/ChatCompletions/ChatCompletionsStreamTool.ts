import Channel from '@hve/channel';
import { ChatAIResultResponse, FinishReason } from '@/types';

import type { ChatCompletionsStreamData } from './types';

class ChatCompletionsStreamTool {
    static async receiveStream(streamCh: Channel<string>): Promise<ChatCompletionsStreamData | null> {
        let fragment: string = '';
        while (true) {
            const line = await streamCh.consume();
            if (line === null) return null;

            if (fragment === '') {
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
                return JSON.parse(fragment.trim()) as ChatCompletionsStreamData;
            }
            catch (e) {
                console.error('Incomplete stream data : ', fragment);
                continue;
            }
        }
    }
    static async parseStreamData(streamData: ChatCompletionsStreamData, response: ChatAIResultResponse): Promise<string | null> {
        const usage = streamData.usage;
        if (usage) {
            response.tokens.input = usage.prompt_tokens ?? 0;
            response.tokens.output = usage.completion_tokens ?? 0;
            response.tokens.total = usage.total_tokens ?? 0;
            // response.tokens.detail = usage.total_tokens ?? 0;
        }

        const choice = streamData.choices[0];
        if (!choice) return null;

        if (choice.finish_reason) {
            let finishReason: FinishReason;
            let warning: string | null = null;
            switch (choice.finish_reason) {
                case 'stop':
                    finishReason = FinishReason.End;
                    break;
                case 'length':
                    finishReason = FinishReason.MaxToken;
                    break;
                default:
                    finishReason = FinishReason.Unknown;
                    warning = `unhandled reason: ${choice.finish_reason}`;
                    break;
            }

            response.finish_reason = finishReason;
        }

        if ('content' in choice.delta) {
            if (response.content.length === 0) response.content.push(choice.delta.content);
            else response.content[0] += choice.delta.content;
            return choice.delta.content;
        }
        else {
            return null;
        }
    }
}

export default ChatCompletionsStreamTool;