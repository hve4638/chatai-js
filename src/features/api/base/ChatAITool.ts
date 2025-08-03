import { AxiosResponse, AxiosRequestConfig } from 'axios';
import Channel from '@hve/channel';
import { IncomingMessage } from 'node:http';

class ChatAITool {
    static handleHTTPStream(streamResponse: IncomingMessage, rawStreamCh?: Channel<string>): Channel<string> {
        const streamCh = new Channel<string>();

        const decoder = new TextDecoder();
        streamResponse.on('data', (chunk: AllowSharedBufferSource | undefined) => {
            const lines = decoder.decode(chunk, { stream: true }).split('\n');
            for (const line of lines) {
                streamCh.produce(line);

                if (rawStreamCh) rawStreamCh.produce(line);
            }
        });
        streamResponse.on('end', () => {
            streamCh.close();
            if (rawStreamCh) rawStreamCh.close();
        });

        return streamCh;
    }

    static async receiveStream<T>(streamCh: Channel<string>): Promise<T | null> {
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
                return JSON.parse(fragment.trim()) as T;
            }
            catch (e) {
                // console.error('Incomplete stream data : ', fragment);
                continue;
            }
        }
    }


    static getUnhandledReasonWarningMessage(finishReason: string): string {
        return `Unhandled reason: ${finishReason}`;
    }
}

export default ChatAITool;