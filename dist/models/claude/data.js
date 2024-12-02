"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE = exports.ROLE_DEFAULT = exports.CLAUDE_URL = void 0;
const request_form_1 = require("../../types/request-form");
exports.CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
exports.ROLE_DEFAULT = 'user';
exports.ROLE = {
    [request_form_1.ChatRole.USER]: 'user',
    [request_form_1.ChatRole.SYSTEM]: 'system',
    [request_form_1.ChatRole.BOT]: 'assistant',
};
