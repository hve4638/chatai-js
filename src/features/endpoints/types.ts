export type ChatAIRequestOption = {
    stream: boolean;
}

export const EndpointAction = {
    Abort: Symbol(),
    Continue: Symbol(),
    Retry: Symbol(),
} as const;
export type EndpointAction = typeof EndpointAction[keyof typeof EndpointAction];
