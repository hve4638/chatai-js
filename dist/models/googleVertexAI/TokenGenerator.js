"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _TokenGenerator_base64url, _TokenGenerator_signJWT, _TokenGenerator_str2ab;
Object.defineProperty(exports, "__esModule", { value: true });
class TokenGenerator {
    static async generate({ clientEmail, privateKey, scope }) {
        const header = {
            alg: 'RS256',
            typ: 'JWT',
        };
        const now = Math.floor(Date.now() / 1000);
        const claimSet = {
            iss: clientEmail,
            scope: scope,
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        };
        const encodedHeader = __classPrivateFieldGet(_a, _a, "m", _TokenGenerator_base64url).call(_a, new TextEncoder().encode(JSON.stringify(header)));
        const encodedClaimSet = __classPrivateFieldGet(_a, _a, "m", _TokenGenerator_base64url).call(_a, new TextEncoder().encode(JSON.stringify(claimSet)));
        const signature = await __classPrivateFieldGet(_a, _a, "m", _TokenGenerator_signJWT).call(_a, encodedHeader, encodedClaimSet, privateKey);
        const jwt = `${encodedHeader}.${encodedClaimSet}.${signature}`;
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        });
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`Token Generate Failed : HTTP Error(${response.status})`);
        }
        const data = await response.json();
        const accessToken = data.access_token;
        if (!accessToken) {
            // Handle missing access token
            throw new Error('Token Generate Failed : Fail to get token');
        }
        return accessToken;
    }
}
_a = TokenGenerator, _TokenGenerator_base64url = function _TokenGenerator_base64url(source) {
    // Encode in classical base64
    let encodedSource = btoa(
    //@ts-ignore
    String.fromCharCode.apply(null, new Uint8Array(source)));
    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+$/, '');
    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    return encodedSource;
}, _TokenGenerator_signJWT = async function _TokenGenerator_signJWT(header, claimSet, privateKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${claimSet}`);
    const key = await crypto.subtle.importKey('pkcs8', __classPrivateFieldGet(_a, _a, "m", _TokenGenerator_str2ab).call(_a, privateKey), {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' },
    }, false, ['sign']);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);
    return __classPrivateFieldGet(_a, _a, "m", _TokenGenerator_base64url).call(_a, new Uint8Array(signature));
}, _TokenGenerator_str2ab = function _TokenGenerator_str2ab(str) {
    const binaryString = atob(str.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\\n/g, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
exports.default = TokenGenerator;
