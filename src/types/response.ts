import { ChatAIRequestForm } from './request';

export interface ChatAIResult {
    request : ChatAIResultRequest;
    response : ChatAIResultResponse;
    debug? : Record<string, any>;
}

export interface ChatAIResultRequest {
    form : ChatAIRequestForm;
    url : string;
    headers : object|undefined;
    data : RequestInit;
}

export interface ChatAIResultResponse {
    ok : boolean;               // 정상 응답 여부
    http_status : number;       // HTTP 상태 코드
    http_status_text : string;
    raw : object;               // 응답 원본
    
    thinking_content : string[]; // 추론 중 텍스트 (thinking 단계에서의 응답)
    content : string[];         // 응답 텍스트
    warning : string|null;      // 한줄 경고 (토큰 한도, safety 등)
    
    tokens : {
        input : number;
        output : number;
        total : number;
        detail? : {
            cache_input?: number;
            thinking_output?: number;
        };
    };
    finish_reason : string;     // 응답 종료 원인
}

// export interface ChatAIResult {
//     request : {
//         form : ChatAIRequestForm;
//         url : string;
//         headers : object|undefined;
//         data : RequestInit;
//     };
//     response : {
//         ok : boolean;               // 정상 응답 여부
//         http_status : number;       // HTTP 상태 코드
//         http_status_text : string;
//         raw : object;               // 응답 원본
        
//         content : string[];         // 응답 텍스트
//         warning : string|null;      // 한줄 경고 (토큰 한도, safety 등)
        
//         tokens : {
//             input : number;
//             output : number;
//             total : number;
//             detail? : object;
//         };
//         finish_reason : string;     // 응답 종료 원인
//     };
// }
