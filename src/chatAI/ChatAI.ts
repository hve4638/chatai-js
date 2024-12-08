import type ChatAIAPI from './models/ChatAIAPI';
import type { RequestForm, RequestDebugOption } from './types/request-form';

import {
    Models, ModelNames
} from './data'
import {
    ClaudeAPI, OpenAIGPTAPI, GoogleGeminiAPI, GoogleVertexAIAPI
} from './models';
import type { ChatAIResponse } from './types/response-data';

class ChatAI {
    private chatAPIs:{[key:string]:ChatAIAPI} = {};
    
    constructor() {
        this.refreshCache();
    }

    refreshCache() {
        this.chatAPIs[ModelNames.CLAUDE] = new ClaudeAPI();
        this.chatAPIs[ModelNames.OPENAI_GPT] = new OpenAIGPTAPI();
        this.chatAPIs[ModelNames.GOOGLE_GEMINI] = new GoogleGeminiAPI();
        this.chatAPIs[ModelNames.GOOGLE_VERTEXAI] = new GoogleVertexAIAPI();
    }

    async request(form:RequestForm, debug?:RequestDebugOption):Promise<ChatAIResponse> {
        const modelAPI = this.chatAPIs[form.model];
        const response = await modelAPI.request(form, debug);
        return response;
    }

    async stream(form:RequestForm, debug?:RequestDebugOption):Promise<[AsyncGenerator<string, void, undefined>, Promise<ChatAIResponse>]> {
        const modelAPI = this.chatAPIs[form.model];

        const [messages, response] = await modelAPI.stream(form, debug);
        return [messages, response];
    }
}

export default ChatAI;