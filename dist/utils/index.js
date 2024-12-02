"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNotNull = assertNotNull;
exports.bracketFormat = bracketFormat;
function assertNotNull(data, errorMessage) {
    if (data == null) {
        throw new Error(errorMessage);
    }
    return true;
}
const RE_BRACKET = /^(.*?)\{\{([^\s{}]+?)\}\}(.*)$/ms;
function bracketFormat(text, notes) {
    const splited = [];
    while (text.length != 0) {
        const group = text.match(RE_BRACKET);
        if (group == null) {
            splited.push(text);
            text = '';
        }
        else {
            splited.push(group[1]);
            if (group[2] in notes) {
                splited.push(notes[group[2]]);
            }
            text = group[3];
        }
    }
    return splited.join('');
}
