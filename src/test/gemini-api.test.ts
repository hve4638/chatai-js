import 'dotenv/config';

import { ChatAI, Chat, ChatRole, ResponseFormat, JSONSchema, FinishReason } from '@/.'

const hasApiKey = !!process.env['GEMINI_KEY'];

// Gemini 모델 목록 : https://ai.google.dev/gemini-api/docs/models/gemini?hl=ko
(hasApiKey ? describe : describe.skip)('Gemini api test', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['GEMINI_KEY'] as string;
    });

    test('preview: request', async () => {
        const result = await ChatAI.previewRequest.generativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'gemini-2.0-flash-lite',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request } = result;
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
        });
        expect(request.data).toEqual({
            'contents': [
                {
                    'parts': [
                        {
                            'text': "Say just 'hello'. Do not answer anything else.",
                        },
                    ],
                    'role': 'USER',
                },
            ],
            'generationConfig': {
                'maxOutputTokens': 10,
                'temperature': 0.1,
            },
            'safetySettings': [],
        });
    });

    test('fetch: request', async () => {
        const result = await ChatAI.requestGenerativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'gemini-2.0-flash-lite',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim()).toEqual('hello')
    });

    test('fetch: vision', async () => {
        const target = './.test/target.png';

        const result = await ChatAI.requestGenerativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.Image.From(target),
                    Chat.Text("What's in this image?"),
                )
            ],
            model: 'gemini-2.0-flash-lite',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json'
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

        const result = await ChatAI.requestGenerativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.PDF.From(target),
                    Chat.Text("Answer questions in the PDF."),
                )
            ],
            model: 'gemini-2.0-flash-lite',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json'
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

    test('fetch: structed output', async () => {
        const uesrMessage = "Say just 'hello'."

        const result = await ChatAI.requestGenerativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.Text(uesrMessage)
                )
            ],
            model: 'gemini-2.5-flash',
            auth: {
                api_key: apiKey
            },
            max_tokens: 128,
            temperature: 0.1,
            thinking_tokens: 0,

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
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json'
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
        const streamResult = await ChatAI.stream.generativeLanguage({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'gemini-2.0-flash-lite',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
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

        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent?alt=sse&key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim()).toEqual('hello')
        expect(response.content[0]).toEqual(streamMessage);
    });
});