export const ChatRoleName = {
    User : 'User',
    Assistant : 'Assistant',
    System : 'System',
} as const;
export type ChatRoleName = typeof ChatRoleName[keyof typeof ChatRoleName];

export const ChatType = {
    Text : 'Text',
    ImageURL : 'ImageURL',
    ImageBase64 : 'ImageBase64',
    File : 'File',

    PDFUrl : 'PDFUrl',
    PDFBase64 : 'PDFBase64',
} as const;
export type ChatType = typeof ChatType[keyof typeof ChatType];

export type ChatMessages = ChatRolePart[];

export interface ChatRolePart {
    role: string;
    content: ChatContentPart[];
};

export type ChatContentPart = {
    chatType: typeof ChatType.Text,
    text: string;
} | {
    chatType: typeof ChatType.ImageURL,
    url: string;
} | {
    chatType: typeof ChatType.ImageBase64,
    data: string;
    extension?: string;
} | {
    chatType: typeof ChatType.PDFUrl,
    url: string;
} | {
    chatType: typeof ChatType.PDFBase64,
    filename: string;
    data: string;
};