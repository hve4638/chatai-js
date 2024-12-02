"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE = exports.ROLE_DEFAULT = exports.GENIMI_ROLE = exports.GENIMI_ROLE_DEFAULT = exports.GENIMI_OPTION_SAFETY = exports.GENIMIAPI_URL_FORMAT = void 0;
const request_form_1 = require("../../types/request-form");
exports.GENIMIAPI_URL_FORMAT = 'https://generativelanguage.googleapis.com/v1beta/models/{{modelname}}:generateContent?key={{apikey}}';
exports.GENIMI_OPTION_SAFETY = [
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
    }
];
exports.GENIMI_ROLE_DEFAULT = "USER";
exports.GENIMI_ROLE = {
    "user": "USER",
    "system": "MODEL",
    "model": "MODEL",
    "assistant": "MODEL",
    "bot": "MODEL"
};
exports.ROLE_DEFAULT = "USER";
exports.ROLE = {
    [request_form_1.ChatRole.USER]: 'USER',
    [request_form_1.ChatRole.SYSTEM]: 'MODEL',
    [request_form_1.ChatRole.BOT]: 'MODEL',
};
