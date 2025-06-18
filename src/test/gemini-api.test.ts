import 'dotenv/config';

import { ChatAI, Chat, ChatRole } from '@/.'
import { FinishReason } from '@/types';

const hasApiKey = !!process.env['GEMINI_KEY'];

// Gemini 모델 목록 : https://ai.google.dev/gemini-api/docs/models/gemini?hl=ko
(hasApiKey ? describe : describe.skip)('Gemini api test', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['GEMINI_KEY'] as string;
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
            'Content-Type': 'application/json'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim()).toEqual('hello')
    });

    test('fetch: vision', async () => {
        const target = './.test/target.jpg';

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
    // test('fetch : stream', async ()=>{
    //     const [stream, resultPromise] = await chatAI.stream({
    //         message : [
    //             ChatRole.User(
    //                 Chat.Text("Say just 'hello'. Do not answer anything else.")
    //             )
    //         ],
    //         provider : KnownProvider.Google,
    //         model_name : 'gemini-2.0-flash',
    //         secret : {
    //             api_key : apiKey
    //         },
    //         max_tokens : 128,
    //         temperature : 1.0,
    //     }, { rawStream: true });


    //     let messageList:string[] = [];
    //     for await (const fragment of stream) {
    //         messageList.push(fragment);
    //     }

    //     let message:string = messageList.join('');
    //     const result = await resultPromise;
    //     const response = result.response;

    //     // 스트리밍 텍스트와 결과 텍스트가 동일한지 확인
    //     expect(response.content[0]).toEqual(message);

    //     expect(response.ok).toBe(true);
    //     expect(response.http_status).toBe(200);
    //     expect(response.finish_reason).toBe('STOP');
    //     expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello')
    // });
});