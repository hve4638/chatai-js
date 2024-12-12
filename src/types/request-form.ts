import type { ResponseFormat } from './response-format'

export const CHAT_ROLE = {
    'USER' : 'USER',
    'BOT' : 'BOT',
    'SYSTEM' : 'SYSTEM',
} as const;
export type CHAT_ROLE = typeof CHAT_ROLE[keyof typeof CHAT_ROLE];

export const CHAT_TYPE = {
    'TEXT' : 'TEXT',
    'IMAGE_URL' : 'IMAGE_URL',
    'IMAGE_BASE64' : 'IMAGE_BASE64',
    'FILE' : 'FILE',
} as const;
export type CHAT_TYPE = typeof CHAT_TYPE[keyof typeof CHAT_TYPE];

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
    
    stream? : boolean;

    /** 응답 포맷을 강제하기 위해 사용 */
    response_format? : ResponseFormat;

    /** 모델별로 적용되는 추가 기능 */
    additional? : any;
}

export type Message = {
    role : CHAT_ROLE;
    content: Content[];
}

export type Content = {
    chatType : CHAT_TYPE;
    text? : string;
    image_url? : string;
    image? : string;
    extension? : string;
}

export type RequestAPI = (url:string, init:RequestInit)=>Promise<any>;

export type RequestOption = {
    fetch:RequestAPI;
};

export type RequestDebugOption = {
    unmaskSecret? : boolean;
}