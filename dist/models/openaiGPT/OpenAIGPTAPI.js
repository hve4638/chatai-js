"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const utils_1 = require("../../utils");
const ChatAIAPI_1 = __importDefault(require("../ChatAIAPI"));
class OpenAIGPTAPI extends ChatAIAPI_1.default {
    makeRequestData(form) {
        (0, utils_1.assertNotNull)(form.secret?.api_key, 'api_key is required');
        const message = [];
        for (const m of form.message) {
            message.push({
                role: data_1.ROLE[m.role] ?? data_1.ROLE_DEFAULT,
                content: m.content[0].text
            });
        }
        const url = data_1.OPENAI_GPT_URL;
        const body = {
            model: form.model_detail,
            messages: message,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p: form.top_p ?? 1.0,
        };
        const data = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${form.secret.api_key}`
            },
            body: JSON.stringify(body)
        };
        return [url, data];
    }
    responseThen(rawResponse, requestForm) {
        let tokens;
        let warning;
        try {
            tokens = rawResponse.usage.completion_tokens;
        }
        catch (e) {
            tokens = 0;
        }
        const reason = rawResponse.choices[0]?.finish_reason;
        const text = rawResponse.choices[0]?.message?.content ?? '';
        if (reason === 'stop')
            warning = null;
        else if (reason === 'length')
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
exports.default = OpenAIGPTAPI;
