import { ChatMessages } from '@/types/request';

export type ChatAIRequestOption = {
    stream: boolean;
}

export const EndpointAction = {
    Abort: Symbol('Abort'),
    Continue: Symbol('Continue'),
    Retry: Symbol('Retry'),
} as const;
export type EndpointAction = typeof EndpointAction[keyof typeof EndpointAction];

export interface BaseAPIBody {
    /** 미지정시 기본 URL 사용 */
    endpoint_url? : string;
    /** 미지정시 기본 URL Path 사용 */
    endpoint_path? : string;

    model : string;
    messages : ChatMessages;

    temperature? : number;
    max_tokens? : number;
    auth : {
        api_key : string;
    },
}