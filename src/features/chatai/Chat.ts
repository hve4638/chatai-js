import { ChatType, ChatRoleName } from "../../types";
import { Content } from "../../types/request";
import { guessImageExtFromBase64 } from "../../utils";

export const Chat = {
    Text(text:string) {
        return {
            chatType: ChatType.TEXT,
            text: text
        };
    },

    Image: {
        URL : (url:string) => {
            return {
                chatType: ChatType.IMAGE_URL,
                image_url: url
            };
        },
        Base64 : (base64:string) => {
            return {
                chatType: ChatType.IMAGE_BASE64,
                image_url: base64,
                extension : guessImageExtFromBase64(base64),
                //image: `data:image/jpeg;base64,${base64}`
            };
        }
    }
} as const;

export const ChatRole = {
    User(...content:Content[]) {
        return {
            role: ChatRoleName.User,
            content: content
        };
    },

    Assistant(...content:Content[]) {
        return {
            role: ChatRoleName.Assistant,
            content: content
        };
    },

    System(...content:Content[]) {
        return {
            role: ChatRoleName.System,
            content: content
        }
    }
} as const;

