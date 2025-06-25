import 'dotenv/config';

import { ChatAI, Chat, ChatRole } from '@/.'
import { FinishReason } from '@/types';

const hasApiKey = !!process.env['OPENAI_KEY'];

// OpenAI 모델 목록 : https://platform.openai.com/docs/models
(hasApiKey ? describe : describe.skip)('GPT API test', () => {
    let apiKey: string;
    let chatAI: ChatAI;

    beforeAll(() => {
        apiKey = process.env['OPENAI_KEY'] as string;
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
        const target = './.test/target.jpg';
        
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
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
    });

    // test('fetch : stream', async () => {
    //     const [stream, resultPromise] = await chatAI.stream({
    //         message: [
    //             ChatRole.User(
    //                 Chat.Text("Say just 'hello'. Do not answer anything else.")
    //             )
    //         ],
    //         provider: KnownProvider.OpenAI,
    //         model_name: 'gpt-4o-mini-2024-07-18',
    //         secret: {
    //             api_key: apiKey
    //         },
    //         max_tokens: 128,
    //         temperature: 1.0,
    //     }, { rawStream: true });

    //     let messageList: string[] = [];
    //     for await (const fragment of stream) {
    //         messageList.push(fragment);
    //     }
    //     let message: string = messageList.join('');
    //     const result = await resultPromise;
    //     expect(result.response.content[0]).toEqual(message);
    // });
});
