"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const message_1 = require("./message");
const models_1 = require("../models");
const geminiAPI = new models_1.GoogleGeminiAPI();
describe('transform RequestForm', () => {
    const testForm = {
        model: __1.MODELS.CLAUDE,
        model_detail: 'model-name',
        secret: {
            api_key: 'api-key',
        },
        temperature: 1.0,
        max_tokens: 512,
        top_p: 1.0,
        message: [
            (0, message_1.system)('system-message'),
            (0, message_1.user)('user-message'),
            (0, message_1.bot)('bot-message')
        ]
    };
    const [testFormUrl, testFormData] = geminiAPI.makeRequestData(testForm);
    test('valid url', async () => {
        // URL에 API키와 모델명이 포함됨
        const expected = 'https://generativelanguage.googleapis.com/v1beta/models/model-name:generateContent?key=api-key';
        expect(testFormUrl).toBe(expected);
    });
    test('valid body', async () => {
        // system이 존재하지 않아 MODEL로 대체됨
        const expected = {
            contents: [
                {
                    role: 'MODEL',
                    parts: [
                        {
                            text: 'system-message'
                        }
                    ]
                },
                {
                    role: 'USER',
                    parts: [
                        {
                            text: 'user-message'
                        }
                    ]
                },
                {
                    role: 'MODEL',
                    parts: [
                        {
                            text: 'bot-message'
                        }
                    ]
                },
            ],
            generation_config: {
                maxOutputTokens: 512,
                temperature: 1.0,
                topP: 1.0,
            },
            safetySettings: expect.any(Object)
        };
        const actual = JSON.parse(testFormData.body);
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            'Content-Type': 'application/json'
        };
        const actual = testFormData.headers;
        expect(actual).toEqual(expected);
    });
});
