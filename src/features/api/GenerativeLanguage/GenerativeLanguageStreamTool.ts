import Channel from '@hve/channel';
import { ChatAITool } from '../base';
import { GenerativeLanguageStreamData } from './types';
import { ChatAIResultResponse } from '@/types';
import GenerativeLanguageTool from './GenerativeLanguageTool';

class GenerativeLanguageStreamTool {
    static async receiveStream(streamCh: Channel<string>): Promise<GenerativeLanguageStreamData | null> {
        return ChatAITool.receiveStream(streamCh);
    }

    static async parseStreamData(streamData: GenerativeLanguageStreamData, response: ChatAIResultResponse): Promise<string | null> {
        const usage = streamData.usageMetadata;
        if (usage) {
            if (usage.promptTokenCount) response.tokens.input = usage.promptTokenCount;
            if (usage.candidatesTokenCount) response.tokens.output = usage.candidatesTokenCount;
            if (usage.totalTokenCount) response.tokens.total = usage.totalTokenCount;
            // if (usage.cacheCreationInputTokens) response.tokens.cache_creation_input = usage.cacheCreationInputTokens;
            // if (usage.cacheReadInputTokens) response.tokens.cache_read_input = usage.cacheReadInputTokens;
        }

        const candidates = streamData.candidates;
        if (candidates && candidates[0]) {
            const candidate = candidates[0];
            
            if (candidate.finishReason) {
                const reason = candidate.finishReason;
                let { finishReason, warning } = GenerativeLanguageTool.parseFinishReason(reason);
                response.finish_reason = finishReason;
                response.warning = warning;
            }

            if (candidate.content) {
                const parts = candidate.content.parts;
                if (parts && parts.length > 0) {
                    const part = parts[0];
                    if (part.text) {
                        return part.text;
                    }
                }
            }
        }

        return null;
    }
}

export default GenerativeLanguageStreamTool;