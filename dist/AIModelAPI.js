"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("./models");
class AIModelAPI {
    constructor(requestOption) {
        this.chatAPIs = {};
        this.requestOption = requestOption;
        this.refreshCache();
    }
    refreshCache() {
        this.chatAPIs[models_1.MODELS.CLAUDE] = new models_1.ClaudeAPI();
        this.chatAPIs[models_1.MODELS.OPENAI_GPT] = new models_1.OpenAIGPTAPI();
        this.chatAPIs[models_1.MODELS.GOOGLE_GEMINI] = new models_1.GoogleGeminiAPI();
        this.chatAPIs[models_1.MODELS.GOOGLE_VERTEXAI] = new models_1.GoogleVertexAIAPI();
    }
    async request(form, debug) {
        const modelAPI = this.chatAPIs[form.model];
        await modelAPI.preprocess();
        const response = await modelAPI.request(form, this.requestOption, debug);
        await modelAPI.postprocess();
        return response;
    }
}
exports.default = AIModelAPI;
