import ChatCompletionsAPI, { type ChatCompletionsData } from '.'

import { user, assistant, system } from '@/test/utils'
import { AsyncQueue } from '@/utils';


describe('ChatCompletions : transform ChatAIRequestForm', () => {
    const body: ChatCompletionsData = {
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
            assistant('assistant-message')
        ]
    };
    const option = { stream: false };

    test('valid url', async () => {
        const api = new ChatCompletionsAPI(body, option);
        const actual = await api.makeRequestURL();

        const expected = 'example.com/v1/chat/completions';
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
        const expected = {
            model: 'model-name',
            messages: [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: 'system-message',
                        }
                    ]
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'user-message',
                        }
                    ]
                },
                {
                    role: 'assistant',
                    content: [
                        {
                            type: 'text',
                            text:  'assistant-message',
                        }
                    ]
                }
            ],
            max_tokens: 512,
            temperature: 1.2,
            top_p: 0.8,
        }
        const api = new ChatCompletionsAPI(body, option);
        const actual = await api.makeRequestData();
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer api-key`
            }
        }
        const api = new ChatCompletionsAPI(body, option);
        const actual = await api.makeRequestConfig();
        expect(actual).toEqual(expected);
    });
});

describe.skip('ChatCompletionsAPI stream', () => {
    test('valid stream data', async () => {
        const streamData = [
            "data: {\"id\":\"example_id\",\"object\":\"chat.completion.chunk\",\"created\":1742052076,\"model\":\"gpt-4o-mini-2024-07-18\",\"service_tier\":\"default\",\"system_fingerprint\":\"fp_06737a9306\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"content\":\"\",\"refusal\":null},\"logprobs\":null,\"finish_reason\":null}],\"usage\":null}",
            "",
            "",
            "data: {\"id\":\"example_id\",\"object\":\"chat.completion.chunk\",\"created\":1742052076,\"model\":\"gpt-4o-mini-2024-07-18\",\"service_tier\":\"default\",\"system_fingerprint\":\"fp_06737a9306\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"Hello\"},\"logprobs\":null,\"finish_reason\":null}],\"usage\":null}",
            "",
            "data: {\"id\":\"example_id\",\"object\":\"chat.completion.chunk\",\"created\":1742052076,\"model\":\"gpt-4o-mini-2024-07-18\",\"service_tier\":\"default\",\"system_fingerprint\":\"fp_06737a9306\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\".\"},\"logprobs\":null,\"finish_reason\":null}],\"usage\":null}",
            "",
            "",
            "data: {\"id\":\"example_id\",\"object\":\"chat.completion.chunk\",\"created\":1742052076,\"model\":\"gpt-4o-mini-2024-07-18\",\"service_tier\":\"default\",\"system_fingerprint\":\"fp_06737a9306\",\"choices\":[{\"index\":0,\"delta\":{},\"logprobs\":null,\"finish_reason\":\"stop\"}],\"usage\":null}",
            "",
            "data: {\"id\":\"example_id\",\"object\":\"chat.completion.chunk\",\"created\":1742052076,\"model\":\"gpt-4o-mini-2024-07-18\",\"service_tier\":\"default\",\"system_fingerprint\":\"fp_06737a9306\",\"choices\":[],\"usage\":{\"prompt_tokens\":18,\"completion_tokens\":3,\"total_tokens\":21,\"prompt_tokens_details\":{\"cached_tokens\":0,\"audio_tokens\":0},\"completion_tokens_details\":{\"reasoning_tokens\":0,\"audio_tokens\":0,\"accepted_prediction_tokens\":0,\"rejected_prediction_tokens\":0}}}",
            "",
            "",
            "data: [DONE]",
            "",
            "",
        ];
        const streamQueue = new AsyncQueue<string>();
        const messageQueue = new AsyncQueue<string>();
        streamData.forEach((data) => streamQueue.enqueue(data));
        streamQueue.enableBlockIfEmpty(false);

        const api = new ChatCompletionsAPI({} as any, {} as any);
        const response = await api.parseStream(streamQueue.consumer(), messageQueue.producer());
        expect(response.content[0]).toBe('Hello.');
    });
});