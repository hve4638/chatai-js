export { default as AsyncQueue } from './AsyncQueue';
export { guessImageExtFromBase64 } from './guessImageExt';
export { bracketFormat } from './bracketFormat';

export function assertNotNull(data, errorMessage:string) {
    if (data == null) {
        throw new Error(errorMessage);
    }
    return true;
}