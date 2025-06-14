import { ChatMessage } from '@/types/request';

export interface BaseRequest {
    /** 미지정시 기본 URL 사용 */
    endpoint_url?: string;
    /** 미지정시 기본 URL Path 사용 */
    endpoint_path?: string;

    model: string;
    messages: ChatMessage[];

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
