"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_form_1 = require("../../types/request-form");
const data_1 = require("./data");
const utils_1 = require("../../utils");
const ChatAIAPI_1 = __importDefault(require("../ChatAIAPI"));
class ClaudeAPI extends ChatAIAPI_1.default {
    makeRequestData(form) {
        (0, utils_1.assertNotNull)(form.secret?.api_key, 'api_key is required');
        let systemPrompt = '';
        const messages = [];
        for (const message of form.message) {
            const role = data_1.ROLE[message.role];
            const text = message.content[0].text;
            if (role === data_1.ROLE.SYSTEM) {
                if (messages.length === 0) {
                    systemPrompt += text;
                }
                else {
                    messages.push({
                        role: data_1.ROLE[request_form_1.ChatRole.BOT],
                        content: [
                            {
                                type: 'text',
                                text: 'system: ' + text,
                            }
                        ]
                    });
                }
            }
            else {
                messages.push({
                    role: role,
                    content: [
                        {
                            type: 'text',
                            text: text,
                        }
                    ]
                });
            }
        }
        const url = data_1.CLAUDE_URL;
        const body = {
            model: form.model_detail,
            messages: messages,
            system: systemPrompt,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p: form.top_p ?? 1.0,
        };
        const data = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': form.secret.api_key,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        };
        return [url, data];
    }
    responseThen(rawResponse, requestForm) {
        let tokens;
        let warning;
        try {
            tokens = rawResponse.usage.output_tokens;
        }
        catch (e) {
            tokens = 0;
        }
        const reason = rawResponse.stop_reason;
        const text = rawResponse.content[0]?.text ?? '';
        if (reason == 'end_turn')
            warning = null;
        else if (reason == 'max_tokens')
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
exports.default = ClaudeAPI;
