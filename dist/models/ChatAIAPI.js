"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
class ChatAIAPI {
    async preprocess() {
    }
    async postprocess() {
    }
    async request(form, option, debug = {}) {
        const requestAPI = option.requestAPI;
        const [url, data] = this.makeRequestData(form);
        if (debug.requestData) {
            debug.requestData.url = url;
            debug.requestData.data = data;
        }
        const promise = requestAPI(url, data);
        let res;
        try {
            res = await promise;
        }
        catch (e) {
            console.log(e);
            throw new Error('Fetch Fail');
        }
        if (res.ok) {
            return this.responseThen(await res.json(), form);
        }
        else {
            let error;
            try {
                error = new errors_1.HTTPError(res, await res.text());
            }
            catch (e) {
                error = new errors_1.HTTPError(res);
            }
            throw error;
        }
    }
}
exports.default = ChatAIAPI;
