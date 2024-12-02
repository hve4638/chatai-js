"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const ChatAIAPI_1 = __importDefault(require("../ChatAIAPI"));
const data_1 = require("./data");
class GoogleGeminiAPI extends ChatAIAPI_1.default {
    makeRequestData(form) {
        (0, utils_1.assertNotNull)(form.secret?.api_key, 'form.secret.api_key is required');
        (0, utils_1.assertNotNull)(form.model_detail, 'model_detail is required');
        const url = (0, utils_1.bracketFormat)(data_1.GENIMIAPI_URL_FORMAT, {
            apikey: form.secret.api_key,
            modelname: form.model_detail
        });
        const contents = [];
        for (const request of form.message) {
            const role = request.role;
            const parts = request.content.map(content => {
                return {
                    text: content.text ?? ''
                };
            });
            contents.push({
                role: data_1.ROLE[role] ?? data_1.ROLE_DEFAULT,
                parts: parts
            });
        }
        const body = {
            contents: contents,
            'generation_config': {
                'maxOutputTokens': form.max_tokens ?? 1024,
                'temperature': form.temperature ?? 1.0,
                'topP': form.top_p ?? 1.0,
            },
            'safetySettings': data_1.GENIMI_OPTION_SAFETY
        };
        const data = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };
        return [url, data];
    }
    responseThen(rawResponse, requestFrom) {
        let tokens;
        let warning;
        try {
            tokens = rawResponse.usageMetadata.candidatesTokenCount;
        }
        catch (e) {
            tokens = 0;
        }
        const reason = rawResponse.candidates[0]?.finishReason;
        const text = rawResponse.candidates[0]?.content?.parts[0].text ?? '';
        if (reason == 'STOP')
            warning = null;
        else if (reason == 'SAFETY')
            warning = 'blocked by SAFETY';
        else if (reason == 'MAX_TOKENS')
            warning = 'max token limit';
        else
            warning = `unhandle reason : ${reason}`;
        return {
            output: {
                content: [text]
            },
            tokens: tokens,
            finishReason: reason,
            error: null,
            warning: warning,
            normalResponse: true,
        };
    }
}
exports.default = GoogleGeminiAPI;
