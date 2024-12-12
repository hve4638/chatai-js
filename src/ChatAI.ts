import type ChatAIAPI from './models/ChatAIAPI';
import type { RequestForm, RequestDebugOption } from './types/request-form';

import {
    ModelDetails, Models
} from './data'
import {
    ClaudeAPI, OpenAIGPTAPI, GoogleGeminiAPI, GoogleVertexAIAPI
} from './models';
import type { ChatAIResponse } from './types/response-data';
import { ChatAIError } from './errors';
import { assertFieldExists } from './utils';

class ChatAI {
    private chatAPIs:{[key:string]:ChatAIAPI} = {};
    
    constructor() {
        this.refreshCache();
    }

    refreshCache() {
        this.chatAPIs[Models.CLAUDE] = new ClaudeAPI();
        this.chatAPIs[Models.OPENAI_GPT] = new OpenAIGPTAPI();
        this.chatAPIs[Models.GOOGLE_GEMINI] = new GoogleGeminiAPI();
        this.chatAPIs[Models.GOOGLE_VERTEXAI] = new GoogleVertexAIAPI();
    }
    
    async request(form:RequestForm, debug?:RequestDebugOption):Promise<ChatAIResponse> {
        this.assertFormValid(form);
        
        const modelAPI = this.chatAPIs[form.model];
        if (modelAPI === undefined) {
            throw new ChatAIError(`Model '${form.model}' is not supported.`);
        }
        else {
            const response = await modelAPI.request(form, debug);
            return response;
        }
    }
    
    async stream(form:RequestForm, debug?:RequestDebugOption):Promise<[AsyncGenerator<string, void, undefined>, Promise<ChatAIResponse>]> {
        const modelAPI = this.chatAPIs[form.model];

        const [messages, response] = await modelAPI.stream(form, debug);
        return [messages, response];
    }

    private assertFormValid(form:RequestForm) {
        assertFieldExists(form.model, 'model');
        assertFieldExists(form.secret, 'secret');
        assertFieldExists(form.message, 'message');
    }
}

export default ChatAI;