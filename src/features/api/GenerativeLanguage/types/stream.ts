export type GenerativeLanguageStreamData = {
    'candidates': Array<{
        'content': {
            'parts': Array<{ 'text': string }>;
            'role': 'model';
        };
        'finishReason'?: 'STOP' | 'SAFETY' | 'MAX_TOKENS' | string;
        'safetyRatings'?: Array<{
            'category': 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_DANGEROUS_CONTENT' | 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT';
            'probability': 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
        }>
    }>;
    'usageMetadata': {
        'promptTokenCount': number;
        'candidatesTokenCount'?: number;
        'totalTokenCount': number;
        'promptTokensDetails': Array<{
            'modality': 'TEXT';
            'tokenCount': number;
        }>;
        'candidatesTokensDetails'?: Array<{
            'modality': 'TEXT';
            'tokenCount': number;
        }>;
    },
    'modelVersion': string;
}

// 스트림 예제
// type a = {
//     'candidates': [
//         {
//             'content': {
//                 'parts': [{ 'text': 'Hello' }],
//                 'role': 'model'
//             }
//         }
//     ],
//     'usageMetadata': {
//         'promptTokenCount': 12, 'totalTokenCount': 12, 'promptTokensDetails': [{ 'modality': 'TEXT', 'tokenCount': 12 }]
//     }, 'modelVersion': 'gemini-2.0-flash'
// }

// type b = {
//     'candidates': [
//         {
//             'content': { 'parts': [{ 'text': '\\n' }], 'role': 'model' }, 'finishReason': 'STOP', 'safetyRatings': [{ 'category': 'HARM_CATEGORY_HATE_SPEECH', 'probability': 'NEGLIGIBLE' }, { 'category': 'HARM_CATEGORY_DANGEROUS_CONTENT', 'probability': 'NEGLIGIBLE' }, { 'category': 'HARM_CATEGORY_HARASSMENT', 'probability': 'NEGLIGIBLE' }, { 'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'probability': 'NEGLIGIBLE' }]
//         }],
//     'usageMetadata': {
//         'promptTokenCount': 11,
//         'candidatesTokenCount': 2,
//         'totalTokenCount': 13,
//         'promptTokensDetails': [{
//             'modality': 'TEXT', 'tokenCount': 11
//         }],
//         'candidatesTokensDetails': [
//             { 'modality': 'TEXT', 'tokenCount': 2 }
//         ]
//     }, 'modelVersion': 'gemini-2.0-flash'
// }