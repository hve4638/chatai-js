import AnthropicAPI, { type AnthropicData } from '.'
import { user, assistant, system } from '@/test/utils'
import { AsyncQueue } from '@/utils';

describe('ClaudeEndpoint request form', () => {
    const body: AnthropicData = {
        endpoint_url: 'example.com',
        
        model: 'model-name',
        auth: {
            api_key: 'api-key',
        },
        temperature: 1.2,
        max_tokens: 512,
        top_p: 0.8,
        messages: [
            system('system-message'),
            user('user-message'),
            assistant('bot-message')
        ]
    };
    const option = { stream: false };

    test('valid url', async () => {
        const api = new AnthropicAPI(body, option);
        const actual = await api.makeRequestURL();
        const expected = 'example.com/v1/messages';
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
        const expected = {
            model: 'model-name',
            system: 'system-message',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'user-message'
                        }
                    ]
                },
                {
                    role: 'assistant',
                    content: [
                        {
                            type: 'text',
                            text: 'bot-message'
                        }
                    ]
                }
            ],
            max_tokens: 512,
            temperature: 1.2,
            top_p: 0.8,
            stream: false,
        }
        const api = new AnthropicAPI(body, option);
        const actual = await api.makeRequestData();
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'api-key',
                'anthropic-version': '2023-06-01'
            }
        }
        const api = new AnthropicAPI(body, option);
        const actual = await api.makeRequestConfig();
        expect(actual).toEqual(expected);
    });
});

describe('ClaudeEndpoint response', () => {
    test('valid response', async () => {
        const streamData = [
            "event: message_start",
            "data: {\"type\":\"message_start\",\"message\":{\"id\":\"msg_011zuwKShtEucv9RtrTWVAyb\",\"type\":\"message\",\"role\":\"assistant\",\"model\":\"claude-3-5-haiku-20241022\",\"content\":[],\"stop_reason\":null,\"stop_sequence\":null,\"usage\":{\"input_tokens\":19,\"cache_creation_input_tokens\":0,\"cache_read_input_tokens\":0,\"output_tokens\":1}}  }",
            "",
            "",
            "event: content_block_start",
            "data: {\"type\":\"content_block_start\",\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"\"}     }",
            "",
            "",
            "event: ping",
            "data: {\"type\": \"ping\"}",
            "",
            "event: content_block_delta",
            "data: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"hello\"}    }",
            "",
            "",
            "event: content_block_stop",
            "data: {\"type\":\"content_block_stop\",\"index\":0    }",
            "",
            "event: message_delta",
            "data: {\"type\":\"message_delta\",\"delta\":{\"stop_reason\":\"end_turn\",\"stop_sequence\":null},\"usage\":{\"output_tokens\":4} }",
            "",
            "event: message_stop",
            "data: {\"type\":\"message_stop\"}",
            "",
            "",
        ];

        const streamQueue = new AsyncQueue<string>();
        const messageQueue = new AsyncQueue<string>();
        streamData.forEach((data) => streamQueue.enqueue(data));
        streamQueue.enableBlockIfEmpty(false);

        const api = new AnthropicAPI({} as any, {} as any);
        const response = await api.parseStream(streamQueue.consumer(), messageQueue.producer());
        expect(response.content[0]).toBe('hello');
    });
});