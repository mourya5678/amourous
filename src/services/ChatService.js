"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateChat = exports.ChatService = void 0;
const typeorm_1 = require("typeorm");
const Chat_1 = require("../entities/Chat");
const Message_1 = require("../entities/Message");
const User_1 = require("../entities/User");
const APP_URL = process.env.APP_URL;
class ChatService {
    createChat(user_1Id, user_2Id) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatRepository = (0, typeorm_1.getRepository)(Chat_1.Chat);
            const user_1Repository = (0, typeorm_1.getRepository)(User_1.User);
            const user_2Repository = (0, typeorm_1.getRepository)(User_1.User);
            const user_1 = yield user_1Repository.findOneBy({ user_id: user_1Id });
            const user_2 = yield user_2Repository.findOneBy({ user_id: user_2Id });
            if (!user_1 || !user_2) {
                throw new Error("user_1 or user_2 not found");
            }
            const chat = chatRepository.create({
                user_1,
                user_2
            });
            if (chat.user_1) {
                if (chat.user_1.profile_image)
                    chat.user_1.profile_image = APP_URL + chat.user_1.profile_image;
            }
            if (chat.user_2) {
                if (chat.user_2.profile_image)
                    chat.user_2.profile_image = APP_URL + chat.user_2.profile_image;
            }
            yield chatRepository.save(chat);
            return chat;
        });
    }
    saveMessage(chatId, sender_id, content, file_url, message_type, is_read, is_flagged) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageRepository = (0, typeorm_1.getRepository)(Message_1.Message);
            const chatRepository = (0, typeorm_1.getRepository)(Chat_1.Chat);
            const userRepository = (0, typeorm_1.getRepository)(User_1.User);
            const chat = yield chatRepository.findOneBy({ chat_id: chatId });
            if (!chat) {
                throw new Error("Chat not found");
            }
            const sender = yield userRepository.findOne({ where: { user_id: sender_id } });
            if (!sender) {
                throw new Error("Sender Not Found");
            }
            const message = messageRepository.create({
                chat,
                sender: sender,
                content: content,
                is_read: is_read,
                file_url: file_url,
                message_type: message_type,
                is_flagged: is_flagged
            });
            const savedMessage = yield messageRepository.save(message);
            return savedMessage;
        });
    }
    upsertPollMessage(senderId, optionId, message_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageRepo = (0, typeorm_1.getRepository)(Message_1.Message);
            const userRepository = (0, typeorm_1.getRepository)(User_1.User);
            const message = yield messageRepo.findOne({ where: { message_id } });
            if (!message) {
                throw new Error("Message not found");
            }
            let contentJSON = JSON.parse(message.content);
            if (!Array.isArray(contentJSON.data.user_votes)) {
                contentJSON.data.user_votes = [];
            }
            const existingVoteIndex = contentJSON.data.user_votes.findIndex((vote) => vote.sender_id === senderId);
            if (existingVoteIndex !== -1) {
                contentJSON.data.user_votes[existingVoteIndex].option_id = optionId;
            }
            else {
                const userData = yield userRepository.findOne({ where: { user_id: senderId } });
                contentJSON.data.user_votes.push({
                    sender_id: senderId,
                    option_id: optionId,
                    sender_name: userData === null || userData === void 0 ? void 0 : userData.full_name,
                    sender_profile_image: userData === null || userData === void 0 ? void 0 : userData.profile_image,
                });
            }
            message.content = JSON.stringify(contentJSON);
            message.updated_at = new Date();
            const savedMessage = yield messageRepo.save(message);
            return savedMessage;
        });
    }
    deleteMessage(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageRepository = (0, typeorm_1.getRepository)(Message_1.Message);
            const message = yield messageRepository.findOneBy({ message_id: messageId });
            if (!message) {
                throw new Error("Message not found");
            }
            yield messageRepository.delete(messageId);
            return { message: "Message deleted successfully" };
        });
    }
}
exports.ChatService = ChatService;
const findOrCreateChat = (user_1Id, user_2Id) => __awaiter(void 0, void 0, void 0, function* () {
    const chatRepository = (0, typeorm_1.getRepository)(Chat_1.Chat);
    const userRepository = (0, typeorm_1.getRepository)(User_1.User);
    const user_1 = yield userRepository.findOne({ where: { user_id: user_1Id } });
    const user_2 = yield userRepository.findOne({ where: { user_id: user_2Id } });
    if (!user_1) {
        throw new Error(`User with ID ${user_1Id} not found`);
    }
    if (!user_2) {
        throw new Error(`User with ID ${user_2Id} not found`);
    }
    let chat = yield chatRepository.findOne({
        where: [
            { user_1: { user_id: user_1.user_id }, user_2: { user_id: user_2.user_id } },
            { user_1: { user_id: user_2.user_id }, user_2: { user_id: user_1.user_id } }
        ]
    });
    if (!chat) {
        chat = chatRepository.create({
            user_1: user_1,
            user_2: user_2
        });
        chat = yield chatRepository.save(chat);
    }
    return chat;
});
exports.findOrCreateChat = findOrCreateChat;
