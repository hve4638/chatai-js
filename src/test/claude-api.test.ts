import 'dotenv/config';

import { ChatAI, Chat, ChatRole, ResponseFormat, JSONSchema, FinishReason } from '@/.'

const hasApiKey = !!process.env['CLAUDE_KEY'];

(hasApiKey ? describe : describe.skip)('env test', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['CLAUDE_KEY'] as string;
    });

    test('preview: request', async () => {
        const result = await ChatAI.previewRequest.anthropic({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(request.data).toEqual({
            'max_tokens': 10,
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
            'model': 'claude-3-5-haiku-20241022',
            'temperature': 0.1,
        });
    });

    test('fetch: request', async () => {
        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim()).toEqual('hello');
    }, 10000);

    test('fetch: vision', async () => {
        const target = './.test/target.png';

        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.Image.From(target),
                    Chat.Text("What's in this image?"),
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase()).toContain('apple');
    }, 1000 * 60);

    test('fetch: PDF', async () => {
        // PDF 내용
        // 1. 1+1=?
        // 2. 2+4=?
        // 3. 4*4=?
        // 4. 10/2=?
        const target = './.test/math.pdf';

        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.PDF.From(target),
                    Chat.Text("Answer questions in the PDF."),
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
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

    test('fetch : stream', async () => {
        const streamResult = await ChatAI.stream.anthropic({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'claude-3-5-haiku-20241022',
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

        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
        expect(response.content[0]).toEqual(streamMessage);
    });
});