
export interface ResponsesBody {
    model: string;
    input: ResponsesMessages;

    max_output_tokens?: number;
    temperature?: number;
    top_p?: number;
    truncation?: 'auto' | 'disabled'; // 모델 응답이 최대 토큰 초과시 행동 (auto=잘림, disabled=400 에러)

    text?: ResponsesResponseFormat; // @TODO: 작동하는지 검증 필요

    previous_response_id?: string; // 도구 호출 후 이전 추론 및 대화를 유지하며 호출 시 사용
    reasoning?: { // 추론 옵션 (o-시리즈 한정)
        effort?: 'low' | 'medium' | 'high';
        /** @deprecated */
        generate_summary?: 'auto' | 'concise' | 'detailed';
        summary?: 'auto' | 'concise' | 'detailed';
    }

    store?: boolean;
    background?: boolean;
    include?: unknown;

    stream?: boolean;
}

export type ResponsesMessages = {
    role: 'developer' | 'assistant' | 'user';
    content: (
        { type: 'input_text'; text: string; } |
        { type: 'input_image'; image_url: string; detail?:'auto'|'low'|'high'; file_id?:string; } |
        { type: 'input_file'; file_data?: string; filename?: string; file_id?: string }
    )[];
    type?: 'message';
}[];

export type ResponsesResponseFormat = {
    type: 'text';
} | {
    type: 'json_object';
} | {
    type: 'json_schema';
    json_schema: {
        name: string;
        strict: boolean;
        schema: any;
    }
}