export interface ResponsesResponse {
    object: 'response';

    id: string;
    created_at: number;
    status: 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'queued' | 'incomplete';
    error: null;
    incomplete_details?: {
        reason: string;
    };
    instructions?: string;
    max_output_tokens: number | null;
    model: string;
    output: (
        {
            type: 'message'
            id: string;
            status: 'completed';
            role: 'assistant';
            content: {
                type: 'output_text';
                text: string;
                annotations?: {
                    type: 'file_citation';
                    index: number;
                    file_id: string;
                    filename: string;
                }[];
            }[];
        } | {
            type: 'reasoning';
            summary: unknown[];
        }
    )[];
    parallel_tool_calls: boolean;
    previous_response_id: string | null;
    reasoning?: {
        effort?: boolean;
        generate_summary?: boolean;
        summary?: boolean;
    },
    store: boolean;
    temperature?: number;
    text: {
        format: {
            'type': 'text'
        } | unknown;
    },
    tool_choice: 'auto',
    tools: unknown[],
    top_p?: number;
    truncation?: 'auto' | 'disabled';
    usage: {
        input_tokens: number;
        input_tokens_details: {
            cached_tokens: number;
        },
        output_tokens: number;
        output_tokens_details: {
            reasoning_tokens: number;
        },
        total_tokens: number;
    },
    user: null;
    metadata?: unknown;
}      
