import { AxiosResponse } from 'axios'
import type { ChatAIRequestForm, ValidChatRequestForm, ChatAIRequest } from '@/types/request'
import { ChatAIResultResponse } from '@/types/response'

import { BASE_URL } from './data'

import { assertFieldExists, bracketFormat } from '@/utils'

import TokenGenerator from './TokenGenerator'
import BaseEndpoint from '../BaseEndpoint'
import ClaudeEndpoint from '@/features/endpoints/Claude';
import { ChatAIRequestOption, EndpointAction } from '../types'
import { parseClaudeMessage } from '@/features/endpoints/Claude/message-parser'
import { AsyncQueueConsumer } from '@/utils/AsyncQueue'

const LOCATION = 'us-east5';

class VertexAIEndpoint extends BaseEndpoint {
    private static claude = new ClaudeEndpoint();
    static #claudeEndpoint = new ClaudeEndpoint();
    #clientEmail:string|null = null;
    #privateKey:string|null = null;
    #lastToken:string | null = null;
    #alreadyRefreshed:boolean = false;

    constructor() {
        super();
    }

    get baseURL() {
        return '';
    }

    override async preprocess(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        const privateKey = form.secret?.['privatekey'];
        const clientEmail = form.secret?.['clientemail'];
        assertFieldExists(privateKey, 'secret.privatekey');
        assertFieldExists(clientEmail, 'secret.clientemail');

        this.#clientEmail = clientEmail;
        this.#privateKey = privateKey;
        this.#alreadyRefreshed = false;

        if (this.#lastToken == null) {
            await this.#refreshToken();
        }
        return EndpointAction.Continue;
    }
    override async postprocess() {
        this.#clientEmail = null;
        this.#privateKey = null;
        this.#alreadyRefreshed = false;
    }

    async #refreshToken() {
        const clientEmail = this.#clientEmail;
        const privateKey = this.#privateKey;
        this.#lastToken = await TokenGenerator.generate({
            clientEmail : clientEmail,
            privateKey : privateKey,
            scope : 'https://www.googleapis.com/auth/cloud-platform'
        });
    }
    
    async makeRequestURL(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        const projectId = form.secret?.['projectid'];
        assertFieldExists(projectId, 'secret.projectid');
        
        return bracketFormat(BASE_URL, {
            location : LOCATION,
            projectid : projectId,
            model : form.model_name
        });
    }
    
    async makeRequestData(form:ValidChatRequestForm, option:ChatAIRequestOption) {
        const {
            message, systemPrompt
        } = parseClaudeMessage(form.message);
        
        return {
            anthropic_version: 'vertex-2023-10-16',
            messages : message,
            system : systemPrompt,
            temperature: form.temperature,
            max_tokens: form.max_tokens,
            top_p : form.top_p,
        }
    }
    
    async makeRequestConfig(form:ValidChatRequestForm, option:ChatAIRequestOption) {
        return {
            headers : {
                'Authorization' : `Bearer ${this.#lastToken}`,
                'Content-Type' : 'application/json',
                'charset' : 'utf-8'
            }
        };
    }
    
    override async catchResponseFailed(response: AxiosResponse<any, any>, retryCount: number):Promise<EndpointAction> {
        if (retryCount >= 3) {
            return EndpointAction.Continue;
        }
        if (response.status === 401) { // 401 Unauthorized : 토큰이 만료됨
            if (this.#alreadyRefreshed) {
                return EndpointAction.Continue;
            }

            this.#alreadyRefreshed = true;
            await this.#refreshToken();

            return EndpointAction.Retry;
        }
        
        return EndpointAction.Continue;
    }

    async parseResponseOK(request: ChatAIRequest, response: AxiosResponse): Promise<ChatAIResultResponse> {
        return VertexAIEndpoint.#claudeEndpoint.parseResponseOK(request, response);
    }
    
    protected override mergeStreamFragment(streamFragmentConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
        throw new Error('Method not implemented.')
    }
    protected override parseStreamData(data: unknown, responseCandidate: ChatAIResultResponse): Promise<string | undefined> {
        throw new Error('Method not implemented.')
    }

    // async handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue):Promise<Omit<ChatAIResult['response'],'ok'|'http_status'|'http_status_text'>> {
    //     throw new Error('Not implemented.');
    // }
}

export default VertexAIEndpoint;