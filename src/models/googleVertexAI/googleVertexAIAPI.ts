import {default as axios} from 'axios'
import { CHAT_ROLE, CHAT_TYPE } from '../../types/request-form'
import type { RequestDebugOption, RequestForm, RequestOption } from '../../types/request-form'
import { ChatAIResponse } from '../../types/response-data'

import { VERTEXAI_URL, ROLE, ROLE_DEFAULT } from './data'

import { assertNotNull, AsyncQueue, bracketFormat } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'

import TokenGenerator from './TokenGenerator'
import { ClaudeAPI } from '../claude'

type VertexAIMessage = {
    role: ROLE;
    content: string;
}[];

class GoogleVertexAIAPI extends ChatAIAPI {
    private static claude = new ClaudeAPI();
    private lasttoken:string | null = null;

    override async request(form:RequestForm, debug:RequestDebugOption):Promise<ChatAIResponse> {
        let token = this.lasttoken;

        const [url, data, config] = this.makeRequestData(form);
        const refreshToken = async ()=>{
            await this.#refreshToken({
                clientEmail : form.secret['clientemail'],
                privateKey : form.secret['privatekey']
            });
            this.updateTokenToHeaders(config);
            this.updateTokenToForm(form);
            token = this.lasttoken;
        }

        try {
            if (token == null) {
                await refreshToken();
            }
            
            const res = await axios.post(url, data, config);
            if (res.status === 401) {
                // 토큰 만료시 재시도
                await refreshToken();
                
                const res = await axios.post(url, data, config);
                return this.handleRawResponse(res, { form, url, data, config });
            }
            else {
                return this.handleRawResponse(res, { form, url, data, config });
            }
        }
        catch (error:unknown) {
            return this.handleFetchError(error, { form, url, data, config });
        }
        finally {
            this.lasttoken = token;
        }
    }

    makeRequestData(form:RequestForm):[string, object, object] {
        const projectId = form.secret?.['projectid'];
        const privateKey = form.secret?.['privatekey'];
        const clientEmail = form.secret?.['clientemail'];
        assertNotNull(clientEmail, 'clientemail is required');
        assertNotNull(privateKey, 'privatekey is required');
        assertNotNull(projectId, 'projectid is required');

        const LOCATION = 'us-east5';
        const url = bracketFormat(VERTEXAI_URL, {
            location : LOCATION,
            projectid : projectId,
            model : form.model_detail
        });

        let systemPrompt:string = '';
        const messages:VertexAIMessage = [];

        for (const m of form.message) {
            if (m.role === CHAT_ROLE.SYSTEM) {
                if (messages.length === 0) {
                    systemPrompt += m.content[0].text!;
                }
                else {
                    messages.push({
                        role : 'assistant',
                        content : 'system: ' + m.content[0].text!
                    })
                }
            }
            else {
                messages.push({
                    role : ROLE[m.role] ?? ROLE_DEFAULT,
                    content : m.content[0].text!
                })
            }
        }

        const body = {
            anthropic_version: 'vertex-2023-10-16',
            messages : messages,
            system : systemPrompt,
            temperature: form.temperature ?? 1024,
            max_tokens: form.max_tokens ?? 1.0,
            top_p : form.top_p ?? 1.0,
            top_k: 0,
        }
        const headers = {
            'Authorization' : `Bearer ${this.lasttoken}`,
            'Content-Type' : 'application/json',
            'charset' : 'utf-8'
        };
        return [url, body, {headers}];
    }

    private updateTokenToHeaders(config:any) {
        config['headers']['Authorization'] = `Bearer ${this.lasttoken}`;
    }

    private updateTokenToForm(form:RequestForm) {
        form.secret['token'] = this.lasttoken;
    }

    handleResponse(rawResponse: any) {
        return GoogleVertexAIAPI.claude.handleResponse(rawResponse);
    }

    async #refreshToken({clientEmail, privateKey}:{clientEmail:string, privateKey:string}) {
        this.lasttoken = await TokenGenerator.generate({
            clientEmail : clientEmail,
            privateKey : privateKey,
            scope : 'https://www.googleapis.com/auth/cloud-platform'
        });
    }

    async handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue):Promise<Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'>> {
        throw new Error('Not implemented.');
    }
}

export default GoogleVertexAIAPI;