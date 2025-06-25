import GenerativeLanguageAPI, { type GenerativeLanguageData } from '.'

import { user, assistant, system } from '@/test/utils'
import { AsyncQueue } from '@/utils';

describe('GenerativeLanguage : request form', () => {
    const form: GenerativeLanguageData = {
        url: 'example.com',
        
        model: 'model-name',
        auth : {
            api_key : 'api-key',
        },
        temperature: 1.2,
        max_tokens: 512,
        top_p: 0.8,

        messages : [
            system('system-message'),
            user('user-message'),
            assistant('bot-message')
        ]
    };
    const option = { stream : false };
    // const [testFormUrl, testFormData, testFormConfig] = endpoint.makeRequestData(testForm, {stream:false});

    test('valid url', async () => {
        const api = new GenerativeLanguageAPI(form, option);

        const actual = await api.makeRequestURL();

        // URL에 API키와 모델명이 포함됨        
        const expected = 'example.com?key=api-key';
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
        const api = new GenerativeLanguageAPI(form, option);

        // system이 존재하지 않아 MODEL로 대체됨
        const expected = {
            contents: [
                {
                    role : 'MODEL',
                    parts: [
                        {
                            text: 'system-message'
                        }
                    ]
                },
                {
                    role : 'USER',
                    parts: [
                        {
                            text: 'user-message'
                        }
                    ]
                },
                {
                    role : 'MODEL',
                    parts: [
                        {
                            text: 'bot-message'
                        }
                    ]
                },
            ],
            generationConfig : {
                maxOutputTokens : 512,
                temperature : 1.2,
                topP: 0.8,
            },
            safetySettings : expect.any(Object)
        }
        
        const actual = await api.makeRequestData();
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            headers : {
                'Content-Type': 'application/json'
            }
        }
        
        const api = new GenerativeLanguageAPI(form, option);
        const actual = await api.makeRequestConfig();
        expect(actual).toEqual(expected);
    });
});


describe.skip('GenerativeLanguageAPI: stream', () => {
    test('stream', async () => {
        const streamData = [
            "data: {\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"Hello\"}],\"role\": \"model\"}}],\"usageMetadata\": {\"promptTokenCount\": 12,\"totalTokenCount\": 12,\"promptTokensDetails\": [{\"modality\": \"TEXT\",\"tokenCount\": 12}]},\"modelVersion\": \"gemini-2.0-flash\"}\r",
            "\r",
            "",
            "data: {\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"\\n\"}],\"role\": \"model\"},\"finishReason\": \"STOP\",\"safetyRatings\": [{\"category\": \"HARM_CATEGORY_HATE_SPEECH\",\"probability\": \"NEGLIGIBLE\"},{\"category\": \"HARM_CATEGORY_DANGEROUS_CONTENT\",\"probability\": \"NEGLIGIBLE\"},{\"category\": \"HARM_CATEGORY_HARASSMENT\",\"probability\": \"NEGLIGIBLE\"},{\"category\": \"HARM_CATEGORY_SEXUALLY_EXPLICIT\",\"probability\": \"NEGLIGIBLE\"}]}],\"usageMetadata\": {\"promptTokenCount\": 11,\"candidatesTokenCount\": 2,\"totalTokenCount\": 13,\"promptTokensDetails\": [{\"modality\": \"TEXT\",\"tokenCount\": 11}],\"candidatesTokensDetails\": [{\"modality\": \"TEXT\",\"tokenCount\": 2}]},\"modelVersion\": \"gemini-2.0-flash\"}\r",
            "\r",
            "",
        ];
        const streamQueue = new AsyncQueue<string>();
        const messageQueue = new AsyncQueue<string>();
        streamData.forEach((data) => streamQueue.enqueue(data));
        streamQueue.enableBlockIfEmpty(false);
        
        const api = new GenerativeLanguageAPI({} as any, {} as any);
        const response = await api.parseStream(streamQueue.consumer(), messageQueue.producer());
        expect(response.content[0]).toBe('Hello\n');
    });
    
});