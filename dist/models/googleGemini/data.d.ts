export declare const GENIMIAPI_URL_FORMAT = "https://generativelanguage.googleapis.com/v1beta/models/{{modelname}}:generateContent?key={{apikey}}";
export declare const GENIMI_OPTION_SAFETY: readonly [{
    readonly category: "HARM_CATEGORY_SEXUALLY_EXPLICIT";
    readonly threshold: "BLOCK_NONE";
}, {
    readonly category: "HARM_CATEGORY_HATE_SPEECH";
    readonly threshold: "BLOCK_NONE";
}, {
    readonly category: "HARM_CATEGORY_HARASSMENT";
    readonly threshold: "BLOCK_NONE";
}, {
    readonly category: "HARM_CATEGORY_DANGEROUS_CONTENT";
    readonly threshold: "BLOCK_NONE";
}];
export declare const GENIMI_ROLE_DEFAULT = "USER";
export declare const GENIMI_ROLE: {
    user: string;
    system: string;
    model: string;
    assistant: string;
    bot: string;
};
export declare const ROLE_DEFAULT = "USER";
export declare const ROLE: {
    readonly USER: "USER";
    readonly SYSTEM: "MODEL";
    readonly BOT: "MODEL";
};
export type ROLE = keyof typeof ROLE;
//# sourceMappingURL=data.d.ts.map