"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUID = exports.uuidv4 = void 0;
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.uuidv4 = uuidv4;
const generateUID = () => {
    const firstPart = (Math.random() * 46656) | 0;
    const secondPart = (Math.random() * 46656) | 0;
    const newFirstPart = ('000' + firstPart.toString(36)).slice(-3);
    const newSecondPart = ('000' + secondPart.toString(36)).slice(-3);
    return newFirstPart + newSecondPart;
};
exports.generateUID = generateUID;
console.log((0, exports.uuidv4)());
console.log((0, exports.generateUID)());
