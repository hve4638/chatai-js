import { ChatMessage } from '@/types/request';

export interface BaseBodyLegacy {
    /** 미지정시 기본 URL 사용 */
    endpoint_url?: string;
    /** 미지정시 기본 URL Path 사용 */
    endpoint_path?: string;

    model: string;
    messages: ChatMessage[];

    temperature?: number;
    max_tokens?: number;
    auth: {}, // 자식 인터페이스에서 정의됨
}