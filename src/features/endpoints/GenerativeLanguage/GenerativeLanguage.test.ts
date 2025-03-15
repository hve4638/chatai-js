import { ChatAIRequestForm, ChatRoleName } from '@/types'
import { GenerativeLanguageEndpoint } from '@/features/endpoints'

import { user, assistant, system } from '@/test/utils'
import { ValidChatRequestForm } from '@/types/request';
import { AsyncQueue } from '@/utils';

const endpoint = new GenerativeLanguageEndpoint();

describe('GenerativeLanguage : request form', () => {
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
            assistant('bot-message')
        ]
    };
    const option = { stream : false };
    // const [testFormUrl, testFormData, testFormConfig] = endpoint.makeRequestData(testForm, {stream:false});

    test('valid url', async () => {
        // URL에 API키와 모델명이 포함됨
        const expected = 'example.com/v1beta/models/model-name:generateContent?key=api-key';
        const actual = await endpoint.makeRequestURL(form, option);
        expect(actual).toBe(expected);
    });
    test('valid body', async () => {
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
        const actual = await endpoint.makeRequestData(form, option);
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            headers : {
                'Content-Type': 'application/json'
            }
        }
        const actual = await endpoint.makeRequestConfig(form, option);
        expect(actual).toEqual(expected);
    });
});


describe('GenerativeLanguage : stream', () => {
    test('stream', async () => {
        const endpoint = new GenerativeLanguageEndpoint();
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
        
        const response = await endpoint.parseStream(streamQueue.consumer(), messageQueue.producer());
        expect(response.content[0]).toBe('Hello\n');
    });
    
});