import type { Schema, BaseSchema } from './response-schema'

export const ChatRole = {
    'USER' : 'USER',
    'BOT' : 'BOT',
    'SYSTEM' : 'SYSTEM',
} as const;
export type ChatRole = typeof ChatRole[keyof typeof ChatRole];

export const ChatType = {
    'TEXT' : 'TEXT',
    'IMAGE' : 'IMAGE',
    'FILE' : 'FILE',
} as const;
export type ChatType = typeof ChatType[keyof typeof ChatType];

export type RequestForm = {
    model : string;
    model_detail ? : string;
    
    message : Message[];

    temperature? : number;
    max_tokens? : number;
    top_p? : number;
    top_k? : number;
    
    secret : {
        api_key? : string;
        [key:string] : any;
    },
    /** 응답 포맷을 강제하기 위해 사용 */
    response_format? : BaseSchema;
    /** 모델별로 적용되는 추가 기능 */
    additional? : any;
}

export type Message = {
    role : ChatRole;
    content: Content[];
}

export type Content = {
    chatType : ChatType;
    text? : string;
    image? : string;
}

export type RequestAPI = (url:string, init:RequestInit)=>Promise<any>;

export type RequestOption = {
    fetch:RequestAPI;
};

export type RequestDebugOption = {
    /** undefined가 아니라면 요청 data를 가져옵니다. */
    requestData? : {
        url?:string;
        data?:any;
    };
}