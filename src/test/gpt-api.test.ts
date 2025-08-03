import 'dotenv/config';

import { ChatAI, Chat, ChatRole, ResponseFormat, JSONSchema, FinishReason } from '@/.'

const hasApiKey = !!process.env['OPENAI_KEY'];

// OpenAI 모델 목록 : https://platform.openai.com/docs/models
(hasApiKey ? describe : describe.skip)('GPT API test', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['OPENAI_KEY'] as string;
    });

    test('preview request', async () => {
        const result = await ChatAI.previewRequest.chatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(request.data).toEqual({
            'max_completion_tokens': 10,
            'messages': [
                {
                    'content': [
                        {
                            'text': "Say just 'hello'. Do not answer anything else.",
                            'type': 'text',
                        },
                    ],
                    'role': 'user',
                },
            ],
            'model': 'gpt-4o-mini-2024-07-18',
            'temperature': 0.1,
        });
    });

    test('fetch: request', async () => {
        const result = await ChatAI.requestChatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
    });

    test('fetch: vision', async () => {
        const target = './.test/target.png';

        const result = await ChatAI.requestChatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Image.From(target),
                    Chat.Text("What's in this image?"),
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase()).toContain('apple');
    });

    test('fetch: PDF', async () => {
        // PDF 내용
        // 1. 1+1=?
        // 2. 2+4=?
        // 3. 4*4=?
        // 4. 10/2=?
        const target = './.test/math.pdf';

        const result = await ChatAI.requestChatCompletion({
            messages: [
                ChatRole.User(
                    Chat.PDF.From(target),
                    Chat.Text("Answer questions in the PDF."),
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);

        const answer = response.content[0].trim().toLowerCase();
        expect(answer).toContain('2'); // 1+1
        expect(answer).toContain('6'); // 2+4
        expect(answer).toContain('16'); // 4*4
        expect(answer).toContain('5'); // 10/2
    });

    test('fetch: thinking', async () => {
        const result = await ChatAI.requestChatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Text("광합성과 성장을 비유해줘")
                )
            ],
            model: 'o3-mini',
            auth: {
                api_key: apiKey
            },
            // max_tokens: 2048,
            // temperature: 0.8,
            thinking_effort: 'low',
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
    }, 1000 * 15);

    test('fetch: structed output', async () => {
        const uesrMessage = "Say just 'hello'. Do not answer anything else."

        const result = await ChatAI.requestChatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Text(uesrMessage)
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 128,
            temperature: 0.1,

            response_format: ResponseFormat.JSONSchema(
                JSONSchema.Object({
                    user_message: JSONSchema.String({
                        description: 'The user message that was sent to the AI.'
                    }),
                    user_intent: JSONSchema.String({
                        description: 'The intent of the user message, such as greeting, question, etc.'
                    }),
                    response: JSONSchema.String({
                        description: "Responding to a user's question"
                    }),
                }, {}),
            )
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);

        const data = JSON.parse(response.content[0]);
        const { user_message, response: aiResponse } = data;
        expect(user_message).toEqual(uesrMessage);
        expect(aiResponse.trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
    });

    test('fetch: stream', async () => {
        const uesrMessage = "Say just 'hello'. Do not answer anything else."

        const streamResult = await ChatAI.stream.chatCompletion({
            messages: [
                ChatRole.User(
                    Chat.Text(uesrMessage)
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 128,
            temperature: 0.1,
        });
        const {
            messages
        } = streamResult;
        const {
            request, response
        } = await streamResult.result;

        const ls: string[] = [];
        for await (const m of messages) {
            ls.push(m);
        }
        const streamMessage = ls.join('');

        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
        expect(response.content[0]).toEqual(streamMessage);
    }, 1000 * 15);
});
