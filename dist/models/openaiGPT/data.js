"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE = exports.ROLE_DEFAULT = exports.OPENAI_GPT_URL = void 0;
const request_form_1 = require("../../types/request-form");
exports.OPENAI_GPT_URL = 'https://api.openai.com/v1/chat/completions';
exports.ROLE_DEFAULT = 'USER';
exports.ROLE = {
    [request_form_1.ChatRole.USER]: 'user',
    [request_form_1.ChatRole.SYSTEM]: 'system',
    [request_form_1.ChatRole.BOT]: 'assistant',
};
