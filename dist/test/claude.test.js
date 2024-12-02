"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const message_1 = require("./message");
const models_1 = require("../models");
const claudeAPI = new models_1.ClaudeAPI();
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
    const [testFormUrl, testFormData] = claudeAPI.makeRequestData(testForm);
    test('valid url', async () => {
        const expected = 'https://api.anthropic.com/v1/messages';
        expect(testFormUrl).toBe(expected);
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
            temperature: 1.0,
            top_p: 1.0,
        };
        const actual = JSON.parse(testFormData.body);
        expect(actual).toEqual(expected);
    });
    test('valid header', async () => {
        const expected = {
            'Content-Type': 'application/json',
            'x-api-key': 'api-key',
            'anthropic-version': '2023-06-01'
        };
        const actual = testFormData.headers;
        expect(actual).toEqual(expected);
    });
});
