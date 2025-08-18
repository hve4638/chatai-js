import ResponsesAPI, { type ResponsesData } from '.';

import { user, assistant, system } from '@/test/utils';

describe('ChatCompletions : transform ChatAIRequestForm', () => {
    const body: ResponsesData = {
        url: 'example.com/v1/responses',

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
        const api = new ResponsesAPI(body, option);
        const actual = await api.makeRequestURL();

        const expected = 'example.com/v1/responses';
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
        const expected = {
            model: 'model-name',
            input: [
                {
                    role: 'developer',
                    content: [
                        {
                            type: 'input_text',
                            text: 'system-message',
                        }
                    ]
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: 'user-message',
                        }
                    ]
                },
                {
                    role: 'assistant',
                    content: [
                        {
                            type: 'input_text',
                            text:  'assistant-message',
                        }
                    ]
                }
            ],
            max_output_tokens: 512,
            temperature: 1.2,
            top_p: 0.8,
        }
        const api = new ResponsesAPI(body, option);
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
        const api = new ResponsesAPI(body, option);
        const actual = await api.makeRequestConfig();
        expect(actual).toEqual(expected);
    });
    test('valid header with extra', async () => {
        const expected = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer api-key`,
                'x-extra-header': 'extra-value'
            }
        }
        const api = new ResponsesAPI({
            ...body,
            headers: {
                'x-extra-header': 'extra-value'
            }
        }, option);
        const actual = await api.makeRequestConfig();
        expect(actual).toEqual(expected);
    });
});