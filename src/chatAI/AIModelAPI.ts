import type ChatAIAPI from './models/ChatAIAPI';
import type { RequestForm, RequestDebugOption } from './types/request-form';

import {
    Models, ModelNames
} from './data'
import {
    ClaudeAPI, OpenAIGPTAPI, GoogleGeminiAPI, GoogleVertexAIAPI
} from './models';
import type { ChatAPIResponse } from './types/response-data';

import { RequestOption } from './types/request-form';


class AIModelAPI {
    private requestOption:RequestOption;
    private chatAPIs:{[key:string]:ChatAIAPI} = {};

    constructor(requestOption:RequestOption) {
        this.requestOption = requestOption;
        
        this.refreshCache();
    }

    refreshCache() {
        this.chatAPIs[ModelNames.CLAUDE] = new ClaudeAPI();
        this.chatAPIs[ModelNames.OPENAI_GPT] = new OpenAIGPTAPI();
        this.chatAPIs[ModelNames.GOOGLE_GEMINI] = new GoogleGeminiAPI();
        this.chatAPIs[ModelNames.GOOGLE_VERTEXAI] = new GoogleVertexAIAPI();
    }

    async request(form:RequestForm, debug?:RequestDebugOption):Promise<ChatAPIResponse> {
        const modelAPI = this.chatAPIs[form.model];

        await modelAPI.preprocess();
        const response = await modelAPI.request(form, this.requestOption, debug);
        await modelAPI.postprocess();

        return response;
    }
}

export default AIModelAPI;