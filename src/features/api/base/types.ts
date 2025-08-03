export type StreamData = {
    type: 'response_delta';
    delta: string;
} | {
    type: 'response_overwrite';
    text: string;
};