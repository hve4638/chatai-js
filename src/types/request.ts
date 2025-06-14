import { AxiosRequestConfig } from 'axios';
import type { ResponseFormat } from './response-format'

export const KnownProvider = {
    Google : 'google',
    OpenAI : 'openai',
    Anthropic : 'anthropic',
    VertexAI : 'vertexai',
} as const;
export type KnownProvider = typeof KnownProvider[keyof typeof KnownProvider];

export const EndpointName = {
    ChatCompletions : 'chat_completions',
    Claude : 'claude',
    GenerativeLanguage : 'generative_language',
    VertexAI : 'vertexai',
} as const;
export type EndpointName = typeof EndpointName[keyof typeof EndpointName];

export type ChatAIRequest = {
    form: ChatAIRequestForm;
    url: string;
    data: object;
    config: AxiosRequestConfig;
}

export const ChatRoleName = {
    User : 'User',
    Assistant : 'Assistant',
    System : 'System',
} as const;
export type ChatRoleName = typeof ChatRoleName[keyof typeof ChatRoleName];

export const ChatType = {
    'TEXT' : 'TEXT',
    'IMAGE_URL' : 'IMAGE_URL',
    'IMAGE_BASE64' : 'IMAGE_BASE64',
    'FILE' : 'FILE',
} as const;
export type ChatType = typeof ChatType[keyof typeof ChatType];

export interface ChatAIRequestForm {
    /**
     * 요청 URL 지정
     *
     * provider 지정 시 자동 생성됨
    */
    base_url? : string;
    
    /**
     * endpoint 지정
     * 
     * provider 지정 시 자동 생성됨
     */
    endpoint? : string;
    
    provider? : KnownProvider;
    model_name : string;
    
    message : ChatMessage[];

    temperature? : number;
    max_tokens? : number;
    top_p? : number;
    top_k? : number;
    
    secret : {
        api_key? : string;
        [key:string] : any;
    },
    
    /** 응답 포맷을 강제하기 위해 사용 */
    response_format? : ResponseFormat;

    /** 각 모델 별 적용되는 추가 기능 */
    additional? : any;
}

export type ValidChatRequestForm = ChatAIRequestForm & {
    base_url : string;
    endpoint : string;
    temperature : number;
    max_tokens : number;
    top_p : number;
}

export type ChatAIRequestOption = {
    stream: boolean;
}

export type ChatMessage = {
    role : ChatRoleName;
    content: Content[];
}

export type Content = {
    chatType : ChatType;
    text? : string;
    image_url? : string;
    image? : string;
    extension? : string;
}

export type RequestDebugOption = {
    /** 응답 결과에서 API키 등 민감정보를 마스킹하지 않음 */
    disableMasking? : boolean;
    /** 내부 fetch 동작을 대신함 */
    // customFetch? : (url:string, data:object, config:AxiosRequestConfig<any>) => Promise<boolean>;
    /** stream 활성화 시, raw 데이터 가져오기 */
    rawStream? : boolean;
}
