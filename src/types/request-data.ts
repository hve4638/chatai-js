import { ChatMessages } from './request';

export interface BaseRequest {
    /** 미지정시 기본 URL 사용 */
    url?: string;

    /** 추가 요청 헤더 */
    headers?: Record<string, string>;

    model: string;
    messages: ChatMessages;

    temperature?: number;
    max_tokens?: number;
}

export interface APIKeyAuth {
    auth: {
        api_key: string;
    }
}

export interface VertexAIAuth {
    auth: {
        client_email: string;
        project_id: string;
        private_key: string;
    }
}
