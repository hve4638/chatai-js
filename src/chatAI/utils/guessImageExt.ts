//const pattern = /^/;

const headerWEBP = [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] as const;
const headerPNG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const headerJPEG = [0xFF, 0xD8, 0xFF];
export function guessImageExtFromBase64(base64:string):'jpeg'|'png'|'webp'|undefined {
    const sliced = base64.slice(0, 48);
    const decoded = Buffer.from(sliced, 'base64');
    const isHeaderMatch = (header: readonly (number|null)[]) => {
        if (decoded.length < header.length) return false;
        for(let i=0; i<header.length; i++) {
            if (header[i] === null) continue;
            if (decoded[i] != header[i]) {
                return false;
            }
        }
        return true;
    }
    
    if (isHeaderMatch(headerJPEG)) {
        return 'jpeg';
    }
    else if (isHeaderMatch(headerPNG)) {
        return 'png';
    }
    else if (isHeaderMatch(headerWEBP)) {
        return 'webp';
    }
    else {
        return undefined;
    }
}