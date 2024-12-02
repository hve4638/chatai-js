"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPError = exports.ChatAIError = void 0;
var ChatAIError_1 = require("./ChatAIError");
Object.defineProperty(exports, "ChatAIError", { enumerable: true, get: function () { return __importDefault(ChatAIError_1).default; } });
var HTTPError_1 = require("./HTTPError");
Object.defineProperty(exports, "HTTPError", { enumerable: true, get: function () { return __importDefault(HTTPError_1).default; } });
