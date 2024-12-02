"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPError extends Error {
    constructor(response, reason) {
        const statusMessage = `${response.status} ${response.statusText}`;
        const message = reason ? `${statusMessage}\n${reason}` : statusMessage;
        super(message);
        this.name = 'HTTPError';
    }
}
exports.default = HTTPError;
