import { CHAT_ROLE } from '../../types/request-form';

export const GENIMIAPI_URL_FORMAT = 'https://generativelanguage.googleapis.com/v1beta/models/{{modelname}}:generateContent?key={{apikey}}';
export const GEMINIAPI_STREAM_URL_FORMAT = 'https://generativelanguage.googleapis.com/v1beta/models/{{modelname}}:streamGenerateContent?alt=sse&key={{apikey}}';

export const GENIMI_OPTION_SAFETY = [
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_NONE"
  },
  {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_NONE"
  },
  {
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_NONE"
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_NONE"
  }
] as const;

export const GENIMI_ROLE_DEFAULT = "USER";
export const GENIMI_ROLE = {
  "user" : "USER",
  "system" : "MODEL",
  "model" : "MODEL",
  "assistant" : "MODEL",
  "bot" : "MODEL"
}
export const ROLE_DEFAULT = "USER";
export const ROLE = {
  [CHAT_ROLE.USER] : 'USER',
  [CHAT_ROLE.SYSTEM] : 'MODEL',
  [CHAT_ROLE.BOT] : 'MODEL',
} as const;
export type ROLE = keyof typeof ROLE;