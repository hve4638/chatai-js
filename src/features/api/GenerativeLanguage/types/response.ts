export interface GenerativeLanguageResponse {
    candidates: {
        content: {
            parts?: {
                text: string;
                thought?: boolean;
            }[];
            role: string;
        };
        finishReason: GenerativeLanguageFinishReason;
        index: number;
    }[];
    usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
        promptTokensDetails: {
            modality: string;
            tokenCount: number;
        }[];
        thoughtsTokenCount: number;
    };
    modelVersion: string;
    responseId: string;
}

// Generative Language API의 FinishReason 타입
// https://ai.google.dev/api/generate-content?hl=ko#FinishReason
export type GenerativeLanguageFinishReason = (
    'FINISH_REASON_UNSPECIFIED' | // 사용되지 않음
    'STOP' | // 정상 종료 및 중단 시퀀스를 만남
    'MAX_TOKENS' | // 최대 토큰 수 도달
    'SAFETY' | // 안전성 필터링에 의해 차단
    'RECITATION' | // 재현에 의한 차단?
    'LANGUAGE' | // 지원하지 않는 언어 사용으로 안한 차단
    'OTHER' | 
    'BLOCKLIST' | // 콘텐츠에 금지된 용어 포함되어 토큰 생성 중지
    'PROHIBITED_CONTENT' | // 금지된 콘텐츠가 포함되어 있어 토큰 생성 중지
    'SPII' | // 콘텐츠에 개인 식별 정보가 포함되어 있어 토큰 생성 중지
    'MALFORMED_FUNCTION_CALL' | //  생성된 함수 호출이 잘못됨
    'IMAGE_SAFETY' // 생성한 이미지의 안전 위반사항 위반으로 토큰 생성 중지
);