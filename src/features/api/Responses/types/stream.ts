export type ResponsesStreamData =
    ResponsesStreaming.Response.Created |
    ResponsesStreaming.Response.InProgress |
    ResponsesStreaming.Response.Completed |
    ResponsesStreaming.Response.Failed |
    ResponsesStreaming.Response.Incomplete |
    ResponsesStreaming.Response.OutputItem.Added |
    ResponsesStreaming.Response.OutputItem.Done |
    ResponsesStreaming.Response.ContentPart.Added |
    ResponsesStreaming.Response.ContentPart.Done |
    ResponsesStreaming.Response.Text.Delta |
    ResponsesStreaming.Response.Text.Done |
    ResponsesStreaming.Response.OutputText.Delta |
    ResponsesStreaming.Response.OutputText.Done |
    ResponsesStreaming.Response.Refusal.Delta |
    ResponsesStreaming.Response.Refusal.Done |
    ResponsesStreaming.Response.Reasoning.Delta |
    ResponsesStreaming.Response.Reasoning.Done |
    ResponsesStreaming.Response.ReasoningSummary.Delta |
    ResponsesStreaming.Response.ReasoningSummary.Done |
    ResponsesStreaming.Response.Queued |
    ResponsesStreaming.Response.Error;

type ResponsesStreamDataResponse = {
    'background'?: boolean;
    'created_at': number;
    'id': string;
    'incomplete_details'?: {
        'reason'?: string;
    };
    'instructions'?: string | unknown;
    'max_tool_calls'?: number;
    'metadata': Record<string, unknown>;
    'model': string;
    'object': 'response';
    'output': Array<{
        'id': string;
        'type': 'message';
        'status': 'in_progress' | 'completed';
        'role': 'assistant';
        'content': Array<{
            'type': 'output_text' | 'reasoning';
            'text'?: string;
            'summary'?: string[];
            'annotations'?: any[];
        }>;
    }>;
    'parallel_tool_calls': boolean;
    'previous_response_id'?: string;
    'prompt'?: {
        'id': string;
        'variables': Record<string, unknown>;
        'version'?: string;
    }
    'reasoning'?: { // o-series model only

    }
    'service_tier'?: string;
    'status': 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'queued' | 'completed';
    'temperature'?: number;
    'text': object;
    'tool_choice': object[];
    'top_logprobs'?: number;
    'top_p'?: number;
    'truncation'?: 'disabled' | 'auto';
    'usage'?: {
        'input_tokens': number;
        'output_tokens': number;
        'total_tokens': number;
        'input_tokens_details'?: {
            'input_tokens_details': number;
        }
        'output_tokens_details'?: {
            'reasoning_tokens': number;
        };
    }
    'user'?: string;
}

declare namespace ResponsesStreaming {
    namespace Response {
        type Created = {
            'type': 'response.created';
            'sequence_number': number;
            'response': ResponsesStreamDataResponse;
        }
        type InProgress = {
            'type': 'response.in_progress';
            'sequence_number': number;
            'response': ResponsesStreamDataResponse;
        }
        type Completed = {
            'type': 'response.completed';
            'sequence_number': number;
            'response': ResponsesStreamDataResponse;
        }
        type Failed = {
            'type': 'response.failed';
            'sequence_number': number;
            'response': ResponsesStreamDataResponse;
        }
        type Incomplete = {
            'type': 'response.incomplete';
            'sequence_number': number;
            'response': ResponsesStreamDataResponse;
        }
        namespace OutputItem {
            type Added = {
                'type': 'response.output_item.added';
                'output_index': number;
                'sequence_number': number;
                'item': object;
            }
            type Done = {
                'type': 'response.output_item.done';
                'output_index': number;
                'sequence_number': number;
                'item': object;
            }
        }
        namespace ContentPart {
            type Added = {
                'type': 'response.content_part.added';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'sequence_number': number;
                'part': {
                    'type': 'output_text';
                    'text': string;
                    'annotations': unknown[]
                };
            }
            type Done = {
                'type': 'response.content_part.done';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'sequence_number': number;
                'part': {
                    'type': 'output_text';
                    'text': string;
                    'annotations': unknown[]
                }
            }
        }
        namespace Text {
            type Delta = {
                // Returned when the text value of a 'text' content part is updated.
                'type': 'response.text.delta';
                'event_id': string;
                'response_id': string;
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'delta': string;
            }
            type Done = {
                // Returned when the text value of a 'text' content part is done streaming. Also emitted when a Response is interrupted, incomplete, or cancelled.
                'type': 'response.text.done';
                'event_id': string;
                'response_id': string;
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'text': string;
            }
        }
        namespace OutputText {
            type Delta = {
                'type': 'response.output_text.annotation.added';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'annotation_index': number;
                'annotation': {
                    'type': 'text_annotation';
                    'text': string;
                    'start': number;
                    'end': number;
                };
                'sequence_number': number;
            }
            type Done = {
                'type': 'response.output_text.done';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'sequence_number': number;
                'text': string;
            }
        }
        namespace Refusal {
            type Delta = {
                'type': 'response.refusal.delta';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'delta': string;
                'sequence_number': number;
            }
            type Done = {
                'type': 'response.refusal.done';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'refusal': string;
                'sequence_number': number;
            }
        }
        namespace Reasoning {
            type Delta = {
                'type': 'response.reasoning.delta';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'sequence_number': number;
                'delta': {
                    'text': string;
                };
            }
            type Done = {
                'type': 'response.reasoning.done';
                'item_id': string;
                'output_index': number;
                'content_index': number;
                'sequence_number': number;
                'text': string;
            }
        }
        namespace ReasoningSummary {
            type Delta = {
                'type': 'response.reasoning_summary.delta';
                'item_id': string;
                'output_index': number;
                'summary_index': number;
                'sequence_number': number;
                'delta': {
                    'text': string;
                }
            }
            type Done = {
                'type': 'response.reasoning_summary.done';
                'item_id': string;
                'output_index': number;
                'sequence_number': number;
                'summary_index': number;
                'text': string;
            }
        }

        type Queued = {
            // Emitted when a response is queued and waiting to be processed.
            'type': 'response.queued';
            'response': ResponsesStreamDataResponse;
            'sequence_number': number;
        }
        type Error = {
            'type': 'error';
            'code': string;
            'sequence_number': number;
            'param': string;
            'message': string;
        }
    }
}

export { };