"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE = exports.ROLE_DEFAULT = exports.VERTEXAI_URL = void 0;
const request_form_1 = require("../../types/request-form");
exports.VERTEXAI_URL = 'https://{{location}}-aiplatform.googleapis.com/v1/projects/{{projectid}}/locations/{{location}}/publishers/anthropic/models/{{model}}:rawPredict';
exports.ROLE_DEFAULT = 'USER';
exports.ROLE = {
    [request_form_1.ChatRole.USER]: 'user',
    [request_form_1.ChatRole.SYSTEM]: 'system',
    [request_form_1.ChatRole.BOT]: 'assistant',
};
