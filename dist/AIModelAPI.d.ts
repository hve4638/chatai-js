import type { RequestForm, RequestDebugOption } from './types/request-form';
import type { ChatAPIResponse } from './types/response-data';
import { RequestOption } from './types/request-form';
declare class AIModelAPI {
    private requestOption;
    private chatAPIs;
    constructor(requestOption: RequestOption);
    refreshCache(): void;
    request(form: RequestForm, debug?: RequestDebugOption): Promise<ChatAPIResponse>;
}
export default AIModelAPI;
//# sourceMappingURL=AIModelAPI.d.ts.map