import { ChatAIRequest } from '@/types';
import { ChatAIResult, ChatAIResultResponse, FinishReason } from '@/types/response';
import type { BaseRequest } from '@/types/request-data';
import { EndpointAction, ChatAIRequestOption } from '../types';

import { AxiosResponse, AxiosRequestConfig } from 'axios'
import { AsyncQueue } from '@/utils';
import { AsyncQueueConsumer, AsyncQueueProducer } from '@/utils/AsyncQueue';
import { ChatAIResponse } from '@/types';
import Channel from '@hve/channel';
import ChatAITool from './ChatAITool';
import { IncomingMessage } from 'node:http';

abstract class BaseChatAIRequestAPI<TBody extends BaseRequest = BaseRequest> {
    protected body: TBody;
    protected option: ChatAIRequestOption;

    constructor(body: TBody, option: ChatAIRequestOption = { stream: false }) {
        this.body = body;
        this.option = option;
    }

    setBody(body: TBody) {
        this.body = body;
    }
    setOption(option: ChatAIRequestOption) {
        this.option = option;
    }
    getBody(): TBody {
        return this.body;
    }
    getOption(): ChatAIRequestOption {
        return this.option;
    }

    /** 요청 수행 전 호출 */
    async preprocess(): Promise<EndpointAction> { return EndpointAction.Continue; }
    /** 요청 수행 후 호출 */
    async postprocess(): Promise<void> { }

    /** Request URL 리턴, 여러번 호출 될 수 있음 */
    abstract makeRequestURL(): Promise<string>;
    /** Request Config 리턴, 여러번 호출 될 수 있음 */
    abstract makeRequestConfig(): Promise<AxiosRequestConfig<any>>;
    /** Request Body 리턴, 여러번 호출 될 수 있음 */
    abstract makeRequestData(): Promise<object>;

    /** fetch 실패 시 */
    async catchFetchFailed(error: unknown, retryCount: number): Promise<EndpointAction> { return EndpointAction.Continue; }
    /** response 파싱 중 실패 시 */
    async catchResponseFailed(response: AxiosResponse, retryCount: number): Promise<EndpointAction> { return EndpointAction.Continue; }
    /** 최종 결과물 리턴 (Response OK 시) */
    abstract parseResponseOK(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse>;
    /** 최종 결과물 리턴 (Response Fail 시) */
    async parseResponseFail(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse> {
        return {
            ok: false,
            http_status: response.status,
            http_status_text: response.message,
            raw: response.data,
            content: [],
            thinking_content: [],
            warning: null,
            tokens: {
                input: 0,
                output: 0,
                total: 0,
            },
            finish_reason: FinishReason.Error,
        }
    }

    abstract mask(): BaseChatAIRequestAPI<TBody>;

    protected maskField(data: object) {
        if (!data || typeof data !== 'object') return data;

        for (const [key, value] of Object.entries(data)) {
            data[key] = (typeof value === 'string') ? 'SECRET' : this.maskField(value);
        }

        return data;
    }
    parseResponseStreamOK(request: ChatAIRequest, response: ChatAIResponse<IncomingMessage>, rawStreamCh?: Channel<string>): {
        response: Promise<ChatAIResultResponse>,
        messageStream: Channel<string>
    } {
        if (response.status !== 200) {
            throw new Error(`Stream response error: ${response.status}`);
        }
        const streamCh = this.handleHTTPStream(response.data, rawStreamCh);
        const messageCh = new Channel<string>();
        
        const resultResponse = this.parseStreamData(response, streamCh, messageCh);
        return {
            response: resultResponse,
            messageStream: messageCh
        }
    }

    protected handleHTTPStream(incomingMessage: IncomingMessage, rawStreamCh?: Channel<string>): Channel<string> {
        return ChatAITool.handleHTTPStream(incomingMessage, rawStreamCh);
    }

    abstract parseStreamData(response: ChatAIResponse, streamCh: Channel<string>, messageCh: Channel<string>, rawStreamCh?: Channel<string>): Promise<ChatAIResultResponse>;
}

export default BaseChatAIRequestAPI;