import { AxiosResponse } from 'axios'
import type { ChatAIRequest } from '@/types'
import { ChatAIResultResponse } from '@/types/response'

import { assertFieldExists, bracketFormat } from '@/utils'

import TokenGenerator from './TokenGenerator'
import { ChatAIRequestOption, EndpointAction } from '../types'
import { AsyncQueueConsumer } from '@/utils/AsyncQueue'
import { BaseChatAIRequestAPI } from '../base'
import { VertexAIData } from './types'
import VertexAITool from './VertexAITool'
import { ChatAIResponse } from '@/types'
import Channel from '@hve/channel'


class VertexAIAPI extends BaseChatAIRequestAPI<VertexAIData> {
    static readonly DEFAULT_URL = 'https://{{location}}-aiplatform.googleapis.com';
    static readonly DEFAULT_GLOBAL_URL = 'https://aiplatform.googleapis.com';
    static readonly DEFAULT_PATH_RAWPREDICT = '/v1/projects/{{projectid}}/locations/{{location}}/publishers/{{publisher}}/models/{{model}}:rawPredict';
    static readonly DEFAULT_PATH_GENERATE = '/v1/projects/{{projectid}}/locations/{{location}}/publishers/{{publisher}}/models/{{model}}:generateContent';
    static readonly DEFAULT_PATH = '/v1/projects/{{projectid}}/locations/{{location}}/publishers/{{publisher}}/models/{{model}}';

    // static readonly LOCATION = 'us-east5';
    static readonly LOCATION = 'us-central1';
    private static tokenCache: Map<string, string> = new Map();
    private alreadyRefreshed: boolean = false;
    private masked: boolean = false;

    constructor(data: VertexAIData, option: ChatAIRequestOption) {
        super(data, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new VertexAIAPI(copiedBody, this.option);
        copied.masked = true;
        return copied;
    }

    override async preprocess() {
        this.alreadyRefreshed = false;
        await this.getToken(); // 캐싱되지 않았다면 토큰 발급

        return EndpointAction.Continue;
    }
    override async postprocess() {
        this.alreadyRefreshed = false;
    }

    private async refreshToken() {
        if (this.masked) return;

        const clientEmail = this.body.auth.client_email;
        const privateKey = this.body.auth.private_key;

        const key = this.getTokenCacheKey();
        const token = await TokenGenerator.generate({
            clientEmail: clientEmail,
            privateKey: privateKey,
            scope: 'https://www.googleapis.com/auth/cloud-platform'
        });
        VertexAIAPI.tokenCache.set(key, token);
    }
    private async getToken() {
        if (this.masked) return 'SECRET';

        const key = this.getTokenCacheKey();
        if (!VertexAIAPI.tokenCache.has(key)) {
            await this.refreshToken();
        }
        return VertexAIAPI.tokenCache.get(key);
    }
    private getTokenCacheKey() {
        const clientEmail = this.body.auth.client_email;
        const privateKey = this.body.auth.private_key;

        return `${clientEmail}:${privateKey}`;
    }

    async makeRequestURL() {
        const baseUrl = (
            this.body.location === 'global'
                ? VertexAIAPI.DEFAULT_GLOBAL_URL
                : VertexAIAPI.DEFAULT_URL
        )

        // DEFAULT_GLOBAL_URL
        const url = bracketFormat(baseUrl + VertexAIAPI.DEFAULT_PATH, {
            location: this.body.location,
            projectid: this.body.auth.project_id,
            model: this.body.model,
            publisher: this.body.publisher,
        });

        switch (this.body.publisher) {
            case 'anthropic':
                return url + ':rawPredict';
            case 'google':
                return url + ':generateContent';
            default:
                return url;
        }
    }
    async makeRequestConfig() {
        const token = await this.getToken();

        const extraHeaders = this.body.headers ?? {}

        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'charset': 'utf-8',
                ...extraHeaders,
            }
        };
    }
    async makeRequestData() {
        return VertexAITool.parseBody(this.body, this.option);
    }

    override async catchResponseFailed(response: AxiosResponse<any, any>, retryCount: number): Promise<EndpointAction> {
        if (retryCount >= 3) {
            return EndpointAction.Continue;
        }
        if (response.status === 401) { // 401 Unauthorized: 토큰 만료됨
            if (this.alreadyRefreshed) {
                return EndpointAction.Continue;
            }
            else {
                this.alreadyRefreshed = true;
                await this.refreshToken();

                return EndpointAction.Retry;
            }
        }

        return EndpointAction.Continue;
    }

    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse> {
        switch (this.body.type) {
            case 'anthropic':
                return VertexAITool.parseAnthropicResponseOK(response);
            case 'generative_language':
                return VertexAITool.parseGenerativeLanguageResponseOK(response);
        }
    }

    parseStreamData(response: ChatAIResponse, streamCh: Channel<string>, messageCh: Channel<string>): Promise<ChatAIResultResponse> {
        throw new Error('Method not implemented.');
    }
}

export default VertexAIAPI;