"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = bot;
exports.user = user;
exports.system = system;
const __1 = require("../");
function bot(textMessage) {
    return {
        role: __1.ChatRole.BOT,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    };
}
function user(textMessage) {
    return {
        role: __1.ChatRole.USER,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    };
}
function system(textMessage) {
    return {
        role: __1.ChatRole.SYSTEM,
        content: [
            {
                chatType: 'TEXT',
                text: textMessage,
            },
        ]
    };
}
