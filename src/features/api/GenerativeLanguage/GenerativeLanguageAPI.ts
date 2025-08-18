import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { bracketFormat } from '@/utils';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';

import type { ChatAIRequest, ChatAIRequestOption } from '@/types';
import type { ChatAIResultResponse } from '@/types/response';

import {
    GenerativeLanguageMessages,
    GenerativeLanguageData,
    GenerativeLanguageBody,
    GenerationConfig,
} from './types';

import { BaseChatAIRequestAPI } from '../base';
import GenerativeLanguageTool from './GenerativeLanguageTool';
import { ChatAIResponse, FinishReason } from '@/types';
import Channel from '@hve/channel';
import GenerativeLanguageStreamTool from './GenerativeLanguageStreamTool';

class GenerativeLanguageAPI extends BaseChatAIRequestAPI<GenerativeLanguageData> {
    static readonly DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/{{model}}';
    // static readonly DEFAULT_URL_STREAM = 'https://generativelanguage.googleapis.com/v1beta/models/{{model}}:streamGenerateContent?alt=sse&key={{api_key}}';
    static readonly URL_QUERY = '?key={{api_key}}';
    static readonly URL_QUERY_STREAM = '?alt=sse&key={{api_key}}';

    constructor(body: GenerativeLanguageData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new GenerativeLanguageAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        let baseURL: string;

        if (this.body.url) {
            baseURL = this.body.url;
        }
        else {
            if (this.option.stream) {
                baseURL = GenerativeLanguageAPI.DEFAULT_URL + ':streamGenerateContent';
            }
            else {
                baseURL = GenerativeLanguageAPI.DEFAULT_URL + ':generateContent';
            }
        }

        let url: string;
        if (this.option.stream) {
            url = bracketFormat(baseURL + GenerativeLanguageAPI.URL_QUERY_STREAM, {
                api_key: this.body.auth.api_key,
                model: this.body.model,
            });
        }
        else {
            url = bracketFormat(baseURL + GenerativeLanguageAPI.URL_QUERY, {
                api_key: this.body.auth.api_key,
                model: this.body.model,
            });
        }
        return url;
    }
    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        const extraHeaders = this.body.headers ?? {}

        const headers = {
            'Content-Type': 'application/json',
            ...extraHeaders,
        }
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData() {
        const body = GenerativeLanguageTool.parseBody(this.body);
        return body;
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse> {
        return GenerativeLanguageTool.parseResponseOK(response as ChatAIResponse<any>);
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
            const data = await GenerativeLanguageStreamTool.receiveStream(streamCh);
            if (data === null) break;

            const message = await GenerativeLanguageStreamTool.parseStreamData(data, chatAIResponse);
            if (message !== null) {
                if (chatAIResponse.content.length === 0) chatAIResponse.content.push(message);
                else chatAIResponse.content[0] += message;
                
                messageCh.produce(message);
            }
        }
        messageCh.close();
        return chatAIResponse;
    }
}

export default GenerativeLanguageAPI;