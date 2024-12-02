"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChatAIError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ChatAIError';
    }
}
exports.default = ChatAIError;
