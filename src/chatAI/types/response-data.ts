import { RequestForm } from './request-form';

export interface ChatAIResponse {
    request : {
        form? : RequestForm;
        url : string;
        headers : object;
        data : RequestInit;
    };
    response : {
        ok : boolean;               // 정상 응답 여부
        http_status : number;       // HTTP 상태 코드
        http_status_text : string;
        raw : object;               // 응답 원본
        
        content : string[];         // 응답 텍스트
        warning : string|null;      // 한줄 경고 (토큰 한도, safety 등)
        
        tokens : {
            input : number;
            output : number;
            total : number;
            detail? : object;
        };
        finish_reason : string;     // 응답 종료 원인
    };
}
