export declare const VERTEXAI_URL = "https://{{location}}-aiplatform.googleapis.com/v1/projects/{{projectid}}/locations/{{location}}/publishers/anthropic/models/{{model}}:rawPredict";
export declare const ROLE_DEFAULT = "USER";
export declare const ROLE: {
    readonly USER: "user";
    readonly SYSTEM: "system";
    readonly BOT: "assistant";
};
export type ROLE = typeof ROLE[keyof typeof ROLE];
//# sourceMappingURL=data.d.ts.map