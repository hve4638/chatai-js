import { CHAT_TYPE, CHAT_ROLE } from "./types";
import { Content } from "./types/request-form";
import { guessImageExtFromBase64 } from "./utils";

export const Chat = {
    Text(text:string) {
        return {
            chatType: CHAT_TYPE.TEXT,
            text: text
        };
    },

    Image: {
        URL : (url:string) => {
            return {
                chatType: CHAT_TYPE.IMAGE_URL,
                image_url: url
            };
        },
        Base64 : (base64:string) => {
            return {
                chatType: CHAT_TYPE.IMAGE_BASE64,
                image_url: base64,
                extension : guessImageExtFromBase64(base64),
                //image: `data:image/jpeg;base64,${base64}`
            };
        }
    }
} as const;

export const ChatRole = {
    User(content:Content[]) {
        return {
            role: CHAT_ROLE.USER,
            content: content
        };
    },

    Assistant(content:Content[]) {
        return {
            role: CHAT_ROLE.BOT,
            content: content
        };
    },

    System(content:Content[]) {
        return {
            role: CHAT_ROLE.SYSTEM,
            content: content
        }
    }
} as const;

