export const FinishReason = {
    End: 'end',
    ToolUse: 'tool_use',
    MaxToken: 'max_token',
    Safety: 'safety',
    Blocked: 'blocked',
    Error: 'error',
    Unknown: 'unknown',
} as const;
export type FinishReason = typeof FinishReason[keyof typeof FinishReason];

export interface ChatAIResult {
    request : ChatAIResultRequest;
    response : ChatAIResultResponse;
    debug? : Record<string, any>;
}

export interface ChatAIResultRequest {
    form : unknown;
    url : string;
    headers : object|undefined;
    data : RequestInit;
}

export interface ChatAIResultResponse {
    ok : boolean;               // 정상 응답 여부
    http_status : number;       // HTTP 상태 코드
    http_status_text : string;
    raw : any;               // 응답 원본
    
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
    /**
     * 응답 종료 원인
     */
    finish_reason : FinishReason;
}