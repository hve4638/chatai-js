"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _GoogleVertexAIAPI_instances, _GoogleVertexAIAPI_refreshToken;
Object.defineProperty(exports, "__esModule", { value: true });
const request_form_1 = require("../../types/request-form");
const data_1 = require("./data");
const utils_1 = require("../../utils");
const ChatAIAPI_1 = __importDefault(require("../ChatAIAPI"));
const TokenGenerator_1 = __importDefault(require("./TokenGenerator"));
const claude_1 = require("../claude");
class GoogleVertexAIAPI extends ChatAIAPI_1.default {
    constructor() {
        super(...arguments);
        _GoogleVertexAIAPI_instances.add(this);
        this.lasttoken = null;
    }
    async request(form, option) {
        const requestAPI = option.requestAPI;
        let token = this.lasttoken;
        const [url, data] = this.makeRequestData(form);
        const refreshToken = async () => {
            await __classPrivateFieldGet(this, _GoogleVertexAIAPI_instances, "m", _GoogleVertexAIAPI_refreshToken).call(this, {
                clientEmail: form.secret['clientemail'],
                privateKey: form.secret['privatekey']
            });
            this.updateData(data);
            this.updateForm(form);
            token = this.lasttoken;
        };
        try {
            if (token == null) {
                await refreshToken();
            }
            const res = await requestAPI(url, data);
            if (res.ok) {
                return res.data;
            }
            else if (res.status === 401) {
                // 토큰 만료시 재시도
                await refreshToken();
                const res = await requestAPI(url, data);
                if (res.ok) {
                    return res.data;
                }
                else {
                    throw new Error(`${res.reason} (${res.status})`);
                }
            }
            else {
                throw new Error(`${res.reason} (${res.status})`);
            }
        }
        finally {
            this.lasttoken = token;
        }
    }
    makeRequestData(form) {
        const projectId = form.secret?.['projectid'];
        const privateKey = form.secret?.['privatekey'];
        const clientEmail = form.secret?.['clientemail'];
        (0, utils_1.assertNotNull)(clientEmail, 'clientemail is required');
        (0, utils_1.assertNotNull)(privateKey, 'privatekey is required');
        (0, utils_1.assertNotNull)(projectId, 'projectid is required');
        const LOCATION = 'us-east5';
        const url = (0, utils_1.bracketFormat)(data_1.VERTEXAI_URL, {
            location: LOCATION,
            projectid: projectId,
            model: form.model_detail
        });
        let systemPrompt = '';
        const messages = [];
        for (const m of form.message) {
            if (m.role === request_form_1.ChatRole.SYSTEM) {
                if (messages.length === 0) {
                    systemPrompt += m.content[0].text;
                }
                else {
                    messages.push({
                        role: 'assistant',
                        content: 'system: ' + m.content[0].text
                    });
                }
            }
            else {
                messages.push({
                    role: data_1.ROLE[m.role] ?? data_1.ROLE_DEFAULT,
                    content: m.content[0].text
                });
            }
        }
        const body = {
            anthropic_version: 'vertex-2023-10-16',
            messages: messages,
            system: systemPrompt,
            temperature: form.temperature ?? 1024,
            max_tokens: form.max_tokens ?? 1.0,
            top_p: form.top_p ?? 1.0,
            top_k: 0,
        };
        const data = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.lasttoken}`,
                'Content-Type': 'application/json',
                'charset': 'utf-8'
            },
            body: JSON.stringify(body),
        };
        return [url, data];
    }
    updateData(data) {
        data['header']['Authorization'] = `Bearer ${this.lasttoken}`;
    }
    responseThen(rawResponse, requestForm) {
        return GoogleVertexAIAPI.claude.responseThen(rawResponse, requestForm);
    }
    async updateForm(form) {
        form.secret['token'] = this.lasttoken;
    }
}
_GoogleVertexAIAPI_instances = new WeakSet(), _GoogleVertexAIAPI_refreshToken = async function _GoogleVertexAIAPI_refreshToken({ clientEmail, privateKey }) {
    this.lasttoken = await TokenGenerator_1.default.generate({
        clientEmail: clientEmail,
        privateKey: privateKey,
        scope: 'https://www.googleapis.com/auth/cloud-platform'
    });
};
GoogleVertexAIAPI.claude = new claude_1.ClaudeAPI();
exports.default = GoogleVertexAIAPI;
