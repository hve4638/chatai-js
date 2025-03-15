import { ChatAIRequestForm, ChatRoleName } from '@/types'
import { ChatCompletionsEndpoint } from '@/features/endpoints'

import { user, assistant, system } from '@/test/utils'
import { ValidChatRequestForm } from '@/types/request';
import { AsyncQueue } from '@/utils';


describe('ChatCompletions : transform ChatAIRequestForm', () => {
    const endpoint = new ChatCompletionsEndpoint();
    const form:ValidChatRequestForm = {
        base_url: 'example.com',
        endpoint: '',
        model_name: 'model-name',
        secret : {
            api_key : 'api-key',
        },
        temperature: 1.2,
        max_tokens: 512,
        top_p: 0.8,
        message : [
            system('system-message'),
            user('user-message'),
            assistant('assistant-message')
        ]
    };
    const option = { stream : false };
    
    test('valid url', async () => {
        const expected = 'example.com/v1/chat/completions';
        const actual = await endpoint.makeRequestURL(form, option);
        
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
        const expected = {
            model : 'model-name',
            messages : [
                {
                    role : 'system',
                    content : 'system-message'
                },
                {
                    role : 'user',
                    content : 'user-message'
                },
                {
                    role : 'assistant',
                    content : 'assistant-message'
                }
            ],
            max_tokens : 512,
            temperature : 1.2,
            top_p : 0.8,
        }
        const actual = await endpoint.makeRequestData(form, option);
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            headers : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer api-key`
            }
        }
        const actual = await endpoint.makeRequestConfig(form, option);
        expect(actual).toEqual(expected);
    });
});

describe('ChatCompletionsEndpoint : stream process', () => {
    const endpoint = new ChatCompletionsEndpoint();
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
        
        const response = await endpoint.parseStream(streamQueue.consumer(), messageQueue.producer());
        expect(response.content[0]).toBe('Hello.');
    });
});