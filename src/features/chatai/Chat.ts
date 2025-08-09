import * as fs from 'fs';
import * as path from 'path';
import { ChatType, ChatRoleName } from '@/types';
import { ChatContentPart } from '@/types';
import { guessImageExtFromBase64 } from "@/utils";

export const Chat = {
    Text(text: string) {
        return {
            chatType: ChatType.Text,
            text: text
        };
    },

    Image: {
        URL(url: string): ChatContentPart {
            return {
                chatType: ChatType.ImageURL,
                url: url
            };
        },
        Base64(base64: string): ChatContentPart {
            return {
                chatType: ChatType.ImageBase64,
                data: base64,
                extension: guessImageExtFromBase64(base64),
            };
        },
        From(target: string): ChatContentPart {
            const base64 = fs.readFileSync(target, 'base64');
            return {
                chatType: ChatType.ImageBase64,
                data: base64,
                extension: guessImageExtFromBase64(base64),
            };
        }
    },

    PDF: {
        URL(url: string): ChatContentPart {
            return {
                chatType: ChatType.PDFUrl,
                url: url
            };
        },
        Base64(filename: string, base64: string): ChatContentPart {
            return {
                chatType: ChatType.PDFBase64,
                filename: filename,
                data: base64
            };
        },
        From(target: string): ChatContentPart {
            const base64 = fs.readFileSync(target, 'base64');
            const filename = path.basename(target);

            return {
                chatType: ChatType.PDFBase64,
                filename: filename,
                data: base64
            };
        }
    },

    File: {
        From(target: string): ChatContentPart {
            const base64 = fs.readFileSync(target, 'base64');
            const filename = path.basename(target);

            return {
                chatType: ChatType.File,
                mime: 'application/pdf',
                filename: filename,
                data: base64
            };
        }
    }
} as const;

export const ChatRole = {
    User(...content: ChatContentPart[]) {
        return {
            role: ChatRoleName.User,
            content: content
        };
    },

    Assistant(...content: ChatContentPart[]) {
        return {
            role: ChatRoleName.Assistant,
            content: content
        };
    },

    System(...content: ChatContentPart[]) {
        return {
            role: ChatRoleName.System,
            content: content
        }
    }
} as const;

