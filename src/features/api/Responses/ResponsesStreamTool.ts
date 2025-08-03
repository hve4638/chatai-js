import Channel from '@hve/channel';
import { ChatAITool, StreamData } from '../base';
import { ChatAIResultResponse } from '@/types';
import { ResponsesStreamData } from './types';


class ResponsesStreamTool {
    static async receiveStream(streamCh: Channel<string>): Promise<ResponsesStreamData | null> {
        return ChatAITool.receiveStream(streamCh);
    }

    static async parseStreamData(streamData: ResponsesStreamData, response: ChatAIResultResponse): Promise<StreamData | null> {
        switch (streamData.type) {
            case 'response.created':
            case 'response.in_progress':
            case 'response.completed':
            case 'response.failed':
            case 'response.incomplete':
            case 'response.queued':
            case 'response.content_part.added':
            case 'response.content_part.done':
            case 'response.text.delta':
            case 'response.text.done':
            case 'response.output_text.annotation.added':
            case 'response.output_text.done':
            case 'response.output_item.added':
            case 'response.output_item.done':
            case 'response.reasoning.delta':
            case 'response.reasoning.done':
            case 'response.reasoning_summary.delta':
            case 'response.reasoning_summary.done':
            case 'response.refusal.delta':
            case 'response.refusal.done':
        }

        return null;
    }
}

export default ResponsesStreamTool;