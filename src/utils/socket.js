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
exports.handleAudioVideoCallCheck = exports.handleBlockUnblockUserStatus = exports.configureSocketIO = void 0;
const typeorm_1 = require("typeorm");
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("../entities/User");
const Message_1 = require("../entities/Message");
const Chat_1 = require("../entities/Chat");
const ChatService_1 = require("../services/ChatService");
const firebaseUser_1 = require("../notificaion/firebaseUser");
const BlockedUser_1 = require("../entities/BlockedUser");
const Poll_1 = require("../entities/Poll");
const PollOption_1 = require("../entities/PollOption");
const UserReward_1 = require("../entities/UserReward");
const UserSubcription_1 = require("../entities/UserSubcription");
const PlanLimits_1 = require("../entities/PlanLimits");
const CallLogs_1 = require("../entities/CallLogs");
const UserDailyUsage_1 = require("../entities/UserDailyUsage");
const chatService = new ChatService_1.ChatService();
const JWT_SECRET = process.env.JWT_SECRET;
let activeChatRooms = {};
let connectedClients = {};
const getChatRoomId = (id1, id2) => {
    const [first, second] = [id1, id2].sort((a, b) => a - b);
    return `room_${first}_${second}`;
};
const ChatEventEnum = {
    JOIN_CHAT_EVENT: 'join_room',
    LEAVE_CHAT_EVENT: 'leave_room',
    TYPING_EVENT: 'typing_event',
    STOP_TYPING_EVENT: 'stop_typing_event',
};
const configureSocketIO = (io) => {
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authHeader = socket.handshake.headers.authorization;
            if (!authHeader) {
                return socket.disconnect();
            }
            const token = authHeader.replace('Bearer ', '');
            const decoded = (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
            let user = yield (0, typeorm_1.getRepository)(User_1.User).findOneBy({ user_id: decoded.userId });
            if (!user) {
                return socket.disconnect();
            }
            socket.user = user;
            connectedClients[decoded.userId] = socket.id;
            io.emit('user_status_change', {
                user_id: user.user_id,
                full_name: user.full_name,
                profile_image: user.profile_image,
                is_online: true
            });
            console.log("user connected with id ", user.user_id);
            yield (0, typeorm_1.getRepository)(User_1.User).update(user.user_id, {
                is_online: true,
                last_seen: null,
            });
            socket.on(ChatEventEnum.JOIN_CHAT_EVENT, yield handleChatJoin(socket, io));
            socket.on("get_unread_users_count", yield handleUnreadUserCount(socket, io));
            const unreadCountFn = yield handleUnreadUserCount(socket, io);
            yield unreadCountFn();
            socket.on('delete_message', handleDeleteMessage(socket, io));
            socket.on('send_message', handleChatMessage(socket, io));
            socket.on('get_chat_list', handleChatList(socket, io));
            socket.on('get_call_status', (0, exports.handleAudioVideoCallCheck)(io, "call"));
            socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
                yield handleDisconnect(socket, io);
            }));
        }
        catch (error) {
            console.error('Socket connection error:', error);
        }
    }));
};
exports.configureSocketIO = configureSocketIO;
const handleGetMessages = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    return (_a) => __awaiter(void 0, [_a], void 0, function* ({ receiverId, markAsRead = false }) {
        if (socket.user) {
            const userId = socket.user.user_id;
            if (!receiverId) {
                socket.emit('error', { message: 'Receiver ID is required' });
                return;
            }
            try {
                const messagesRepository = (0, typeorm_1.getRepository)(Message_1.Message);
                const messages = yield messagesRepository.find({
                    where: [
                        {
                            chat: {
                                user_1: { user_id: userId },
                                user_2: { user_id: receiverId }
                            }
                        },
                        {
                            chat: {
                                user_1: { user_id: receiverId },
                                user_2: { user_id: userId }
                            }
                        }
                    ],
                    relations: ["chat", "chat.user_1", "chat.user_2", "sender"]
                });
                if (!messages || messages.length === 0) {
                    // socket.emit('error', { message: 'Chat Not Found' });
                    socket.emit('messages_retrieved', {
                        status: 404,
                        success: false,
                        message: 'Chat Not Found',
                        data: []
                    });
                    return;
                }
                let messageData = [];
                for (const message of messages) {
                    if (!message.chat ||
                        !message.chat.user_1 ||
                        !message.chat.user_2 ||
                        !message.sender) {
                        console.warn("Incomplete message relation found", message);
                        continue;
                    }
                    // Push to client
                    messageData.push({
                        message_id: message.message_id,
                        user_1_id: message.chat.user_1.user_id,
                        user_2_id: message.chat.user_2.user_id,
                        sender_id: message.sender.user_id,
                        content: message.content,
                        file_url: message.file_url,
                        message_type: message.message_type,
                        is_read: message.is_read,
                        created_at: message.created_at,
                        is_flagged: message.is_flagged
                    });
                    // 👇 Only mark as read if flag is set
                    if (markAsRead && message.sender.user_id !== userId && !message.is_read) {
                        message.is_read = true;
                        yield messagesRepository.save(message);
                    }
                }

            
                socket.emit('messages_retrieved', {
                    status: 200,
                    success: true,
                    message: 'Chat messages retrieved successfully',
                    data: messageData
                });
            }
            catch (error) {
                socket.emit('error', { message: error.message });
            }
        }
    });
});
const handleChatJoin = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    return (_a) => __awaiter(void 0, [_a], void 0, function* ({ receiverId }) {
        var _b, _c, _d, _e;
        if (!socket.user)
            return;
        const userId = socket.user.user_id;
        const targetUserId = receiverId;
        const userKey = userId.toString();
        const receiverKey = receiverId.toString();
        if (!activeChatRooms[userKey]) {
            activeChatRooms[userKey] = new Set();
        }
        const roomId = getChatRoomId(userId, receiverId);
        socket.join(roomId);
        activeChatRooms[userKey].add(roomId);
        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const recipientUser = yield userRepo.findOne({ where: { user_id: receiverId } });
        if (!recipientUser)
            return;
        const isRecipientActiveInRoom = (_c = (_b = activeChatRooms[receiverKey]) === null || _b === void 0 ? void 0 : _b.has(roomId)) !== null && _c !== void 0 ? _c : false;
        const isCurrentUserActiveInRoom = (_e = (_d = activeChatRooms[userKey]) === null || _d === void 0 ? void 0 : _d.has(roomId)) !== null && _e !== void 0 ? _e : false;
        const recipientSocketId = connectedClients[receiverKey];
        const currentUserSocketId = connectedClients[userKey];
        if (isRecipientActiveInRoom && recipientSocketId) {
            const recipientSocket = io.sockets.sockets.get(recipientSocketId);
            if (recipientSocket) {
                const getMessagesFromRecipient = yield handleGetMessages(recipientSocket, io);
                yield getMessagesFromRecipient({ receiverId: userId, markAsRead: true });
                yield new Promise((resolve) => setTimeout(resolve, 200));
                const getMessagesFromRecipientDouble = yield handleGetMessages(recipientSocket, io);
                yield getMessagesFromRecipientDouble({ receiverId: userId, markAsRead: true });
                yield (0, exports.handleBlockUnblockUserStatus)(io)({ user_id: userId, target_user_id: targetUserId });
                yield (0, exports.handleAudioVideoCallCheck)(io, "message")({ user_id: userId, target_user_id: targetUserId });
            }
        }
        else {
            if (recipientSocketId) {
                const recipientSocket = io.sockets.sockets.get(recipientSocketId);
                if (recipientSocket) {
                    const unreadCountFn = yield handleUnreadUserCount(recipientSocket, io);
                    yield unreadCountFn();
                }
            }
        }
        if (isCurrentUserActiveInRoom) {
            if (currentUserSocketId) {
                const currentUserSocket = io.sockets.sockets.get(currentUserSocketId);
                if (currentUserSocket) {
                    yield (0, exports.handleBlockUnblockUserStatus)(io)({ user_id: userId, target_user_id: targetUserId });
                    yield (0, exports.handleAudioVideoCallCheck)(io, "message")({ user_id: userId, target_user_id: targetUserId });
                    const getMessagesFromCurrentUser = yield handleGetMessages(currentUserSocket, io);
                    yield getMessagesFromCurrentUser({ receiverId: targetUserId, markAsRead: true });
                }
            }
        }
        else {
            if (currentUserSocketId) {
                const currentUserSocket = io.sockets.sockets.get(currentUserSocketId);
                if (currentUserSocket) {
                    const unreadCountFn = yield handleUnreadUserCount(currentUserSocket, io);
                    yield unreadCountFn();
                }
            }
        }
        console.log(`User ${userId} joined room ${roomId}`);
        io.emit('user_status_change', {
            user_id: userId,
            full_name: recipientUser.full_name,
            profile_image: recipientUser.profile_image,
            is_online: true
        });
    });
});
const handleChatMessage = (socket, io) => {
    return (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            if (!((_a = socket.user) === null || _a === void 0 ? void 0 : _a.user_id)) {
                console.log("Unauthorized socket");
                return;
            }
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                }
                catch (err) {
                    console.log("Invalid JSON");
                    return;
                }
            }
            if (!payload || !payload.user_2_id || !payload.message_type) {
                console.log("Invalid payload");
                return;
            }
            const senderId = socket.user.user_id;
            const { user_2_id: recipientId, content, file_url, message_type, message_id, poll_id, option_id, is_flagged } = payload;
            const senderSocketId = connectedClients[senderId];
            const recipientSocketId = connectedClients[recipientId];
            const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
            let userSubscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: socket.user.user_id }, isActive: true }, relations: ["plan"] });
            if (!userSubscription) {
                userSubscription = yield userSubscriptionRepo.create({
                    user: socket.user,
                    plan: { subscription_plan_id: 1 },
                    isActive: true,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                });
                userSubscription = yield userSubscriptionRepo.save(userSubscription);
            }
            userSubscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: socket.user.user_id }, isActive: true }, relations: ["plan"] });
            if ((userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.plan.subscription_plan_id) == 1) {
                const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
                const planLimits = yield planLimitsRepo.findOne({ where: { plan: { subscription_plan_id: userSubscription.plan.subscription_plan_id } } });
                if (!planLimits) {
                    console.log("Plan limits not found");
                    return;
                }
                const userDailyUsageRepo = (0, typeorm_1.getRepository)(UserDailyUsage_1.UserDailyUsage);
                let formatedDate = new Date().toISOString().split('T')[0];
                const userDailyUsage = yield userDailyUsageRepo.findOne({ where: { user: { user_id: senderId }, date: new Date(formatedDate) } });
                if (!userDailyUsage) {
                    const newUserDailyUsage = userDailyUsageRepo.create({
                        user: { user_id: senderId },
                        date: formatedDate,
                        messages_used: 1
                    });
                    yield userDailyUsageRepo.save(newUserDailyUsage);
                }
                else {
                    userDailyUsage.messages_used = Number(userDailyUsage.messages_used) + 1;
                    yield userDailyUsageRepo.save(userDailyUsage);
                }
                if (userDailyUsage && userDailyUsage.messages_used > planLimits.daily_messages_limit) {
                    if (senderSocketId) {
                        io.to(senderSocketId).emit("limit_reached", { limit_reached: true, message: "Daily message limit exceeded" });
                    }
                    console.log("User daily usage limit exceeded");
                    return;
                }
            }
            const chatRoom = getChatRoomId(senderId, recipientId);
            const isRecipientInRoom = ((_b = activeChatRooms[recipientId]) === null || _b === void 0 ? void 0 : _b.has(chatRoom)) || false;
            if (message_type == "poll")
                yield handleIsFirstGame(socket, io)({ recipient_id: recipientId });
            if (!isRecipientInRoom) {
                const userRepository = (0, typeorm_1.getRepository)(User_1.User);
                const recipientData = yield userRepository.findOne({
                    where: { user_id: recipientId },
                });
                if (!recipientData)
                    return;
                const notificationTitle = `${(_c = socket.user) === null || _c === void 0 ? void 0 : _c.full_name}`;
                let notificationMessage = "";
                switch (message_type) {
                    case "text":
                        notificationMessage = content;
                        break;
                    case "poll":
                        notificationMessage = "sent a poll";
                        break;
                    default:
                        notificationMessage = "sent an attachment";
                        break;
                }
                const data = {
                    user_id: String(senderId),
                    notification_type: "chat",
                };
                if (recipientData.is_push_notification_on && !message_id) {
                    yield (0, firebaseUser_1.sendNotificationUser)(recipientData.fcm_token, notificationTitle, notificationMessage, data);
                }
            }
            const chat = yield (0, ChatService_1.findOrCreateChat)(senderId, recipientId);
            const message = message_id
                ? yield chatService.upsertPollMessage(senderId, option_id, message_id)
                : yield chatService.saveMessage(chat.chat_id, senderId, content, file_url, message_type, isRecipientInRoom, is_flagged);
            const messageData = {
                message_id: message.message_id,
                user_1_id: senderId,
                user_2_id: recipientId,
                sender_id: senderId,
                content: message.content,
                file_url: message.file_url,
                message_type: message.message_type,
                is_read: isRecipientInRoom,
                created_at: message.created_at,
                is_flagged: is_flagged
            };
            if (message_type == "poll" && message_id) {
                const roomId = getChatRoomId(senderId, recipientId);
                if (socket && socket.user) {
                    if (!activeChatRooms[senderId])
                        activeChatRooms[senderId] = new Set();
                    activeChatRooms[senderId].add(roomId);
                }
                const isRecipientActiveInRoom = (_d = activeChatRooms[recipientId === null || recipientId === void 0 ? void 0 : recipientId.toString()]) === null || _d === void 0 ? void 0 : _d.has(roomId);
                if (isRecipientActiveInRoom && recipientSocketId) {
                    const recipientSocket = io.sockets.sockets.get(recipientSocketId);
                    if (recipientSocket) {
                        const getMessagesForRecipient = yield handleGetMessages(recipientSocket, io);
                        yield getMessagesForRecipient({ receiverId: senderId, markAsRead: true });
                    }
                }
                const getMessagesFunction = yield handleGetMessages(socket, io);
                yield getMessagesFunction({ receiverId: recipientId, markAsRead: false });
            }
            const eventName = "send_message";
            if (senderSocketId && !message_id) {
                io.to(senderSocketId).emit(eventName, messageData);
            }
            if (recipientSocketId && !message_id) {
                io.to(recipientSocketId).emit(eventName, messageData);
                const recipientSocket = io.sockets.sockets.get(recipientSocketId);
                if (recipientSocket) {
                    yield handleChatList(recipientSocket, io)();
                    const unreadCountFn = yield handleUnreadUserCount(recipientSocket, io);
                    yield unreadCountFn();
                }
                yield handleChatList(socket, io)();
            }
            yield (0, exports.handleAudioVideoCallCheck)(io, "message")({ user_id: senderId, target_user_id: recipientId });
            if (poll_id && option_id) {
                const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
                const pollOptionRepo = (0, typeorm_1.getRepository)(PollOption_1.PollOption);
                const userRewardRepo = (0, typeorm_1.getRepository)(UserReward_1.UserReward);
                const userRepo = (0, typeorm_1.getRepository)(User_1.User);
                const poll = yield pollRepo.findOne({ where: { poll_id } });
                if (!poll)
                    return;
                const poll_option = yield pollOptionRepo.findOne({ where: { poll_option_id: option_id } });
                if (!poll_option)
                    return;
                const with_user_data = yield userRepo.findOne({ where: { user_id: Number(payload.user_2_id) } });
                if (with_user_data && socket.user) {
                    const newReward = userRewardRepo.create({
                        poll,
                        user: socket.user,
                        with_user: with_user_data,
                        points_awarded: poll_option.is_correct ? 1 : 0,
                    });
                    yield userRewardRepo.save(newReward);
                }
            }
        }
        catch (error) {
            console.error("Error saving chat message:", error);
        }
    });
};
const handleDeleteMessage = (socket, io) => {
    return (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        let user_1_id = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            }
            catch (err) {
                console.log("Invalid JSON");
                return;
            }
        }
        const { message_id, recipient_id } = payload;
        const recipientSocketId = connectedClients[recipient_id];
        const senderSocketId = connectedClients[user_1_id];
        const roomId = getChatRoomId(user_1_id, recipient_id);
        if (senderSocketId)
            io.to(senderSocketId).emit('delete_message', { message_id, recipient_id });
        yield chatService.deleteMessage(message_id);
        if (socket && socket.user) {
            if (!activeChatRooms[user_1_id])
                activeChatRooms[user_1_id] = new Set();
            activeChatRooms[user_1_id].add(roomId);
        }
        const isRecipientActiveInRoom = (_b = activeChatRooms[recipient_id === null || recipient_id === void 0 ? void 0 : recipient_id.toString()]) === null || _b === void 0 ? void 0 : _b.has(roomId);
        if (isRecipientActiveInRoom && recipientSocketId) {
            const recipientSocket = io.sockets.sockets.get(recipientSocketId);
            if (recipientSocket) {
                const getMessagesForRecipient = yield handleGetMessages(recipientSocket, io);
                yield getMessagesForRecipient({ receiverId: user_1_id, markAsRead: true });
            }
        }
        const getMessagesFunction = yield handleGetMessages(socket, io);
        yield getMessagesFunction({ receiverId: recipient_id, markAsRead: false });
        if (recipientSocketId) {
            const recipientSocket = io.sockets.sockets.get(recipientSocketId);
            if (recipientSocket) {
                handleChatList(recipientSocket, io)();
            }
            handleChatList(socket, io)();
        }
    });
};
const handleChatList = (socket, io) => {
    return () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!socket.user)
                return;
            const userId = socket.user.user_id;
            const chats = yield (0, typeorm_1.getRepository)(Chat_1.Chat).find({
                where: [
                    { user_1: { user_id: userId } },
                    { user_2: { user_id: userId } },
                ],
                relations: ['user_1', 'user_2'],
            });
            const chatList = yield Promise.all(chats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
                const otherUser = chat.user_1.user_id === userId ? chat.user_2 : chat.user_1;
                const lastMessage = yield (0, typeorm_1.getRepository)(Message_1.Message).findOne({
                    where: { chat: { chat_id: chat.chat_id } },
                    order: { created_at: 'DESC' },
                });
                const unreadCount = yield (0, typeorm_1.getRepository)(Message_1.Message).count({
                    where: {
                        chat: { chat_id: chat.chat_id },
                        is_read: false,
                        sender: { user_id: otherUser.user_id },
                    },
                });
                let lastMessageContent = '';
                if (lastMessage) {
                    if (lastMessage.message_type === 'text') {
                        lastMessageContent = lastMessage.content;
                    }
                    else if (lastMessage.message_type === 'poll') {
                        lastMessageContent = 'sent a poll';
                    }
                    else {
                        lastMessageContent = 'sent an attachment';
                    }
                }
                return {
                    chat_id: chat.chat_id,
                    user: {
                        user_id: otherUser.user_id,
                        full_name: otherUser.full_name,
                        profile_image: otherUser.profile_image,
                    },
                    lastMessage: lastMessageContent,
                    lastMessageTime: lastMessage ? lastMessage.created_at : null,
                    unreadCount,
                };
            })));
            chatList.sort((a, b) => {
                const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return timeB - timeA;
            });
            io.emit('user_status_change', {
                user_id: userId,
                full_name: socket.user.full_name,
                profile_image: socket.user.profile_image,
                is_online: true
            });
            socket.emit('chat_list', {
                status: 200,
                success: true,
                data: chatList,
            });
        }
        catch (error) {
            console.error('Error fetching chat list:', error);
        }
    });
};
const handleUnreadUserCount = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    return () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = socket.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!userId)
            return;
        try {
            const messagesRepository = (0, typeorm_1.getRepository)(Message_1.Message);
            const unreadMessages = yield messagesRepository.find({
                where: {
                    is_read: false,
                    chat: [
                        { user_1: { user_id: userId }, user_2: (0, typeorm_1.Not)(userId) },
                        { user_2: { user_id: userId }, user_1: (0, typeorm_1.Not)(userId) }
                    ],
                },
                relations: ["chat", "chat.user_1", "chat.user_2", "sender"]
            });
            const sendersSet = new Set();
            for (const msg of unreadMessages) {
                if (!msg.sender || msg.sender.user_id === userId)
                    continue;
                sendersSet.add(msg.sender.user_id);
            }
            io.to(socket.id).emit('unread_users_count', {
                status: 200,
                success: true,
                message: "Unread user count fetched",
                data: {
                    unread_user_count: sendersSet.size
                }
            });
        }
        catch (error) {
            socket.emit("unread_users_count", {
                success: false,
                status: 500,
                message: error.message
            });
        }
    });
});
const handleBlockUnblockUserStatus = (io) => {
    return (_a) => __awaiter(void 0, [_a], void 0, function* ({ user_id, target_user_id }) {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        try {
            let socket_id = connectedClients[user_id];
            if (socket_id) {
                let is_blocked = false;
                const isBlocked = yield blockedUserRepo.findOne({
                    where: {
                        blocker: { user_id },
                        blocked: { user_id: target_user_id },
                        is_blocked: true
                    }
                });
                if (isBlocked) {
                    is_blocked = true;
                }
                let is_other_user_blocked = false;
                const isOtherUserBlocked = yield blockedUserRepo.findOne({
                    where: {
                        blocker: { user_id: target_user_id },
                        blocked: { user_id },
                        is_blocked: true
                    }
                });
                if (isOtherUserBlocked) {
                    is_other_user_blocked = true;
                }
                io.to(socket_id).emit("block_unblock_status", {
                    user_id: user_id,
                    target_user_id: target_user_id,
                    is_blocked: is_blocked,
                    is_other_user_blocked: is_other_user_blocked,
                });
            }
            let target_user_id_socket = connectedClients[target_user_id];
            if (target_user_id_socket) {
                let is_blocked = false;
                const isBlocked = yield blockedUserRepo.findOne({
                    where: {
                        blocker: { user_id: target_user_id },
                        blocked: { user_id },
                        is_blocked: true
                    }
                });
                if (isBlocked) {
                    is_blocked = true;
                }
                let is_other_user_blocked = false;
                const isOtherUserBlocked = yield blockedUserRepo.findOne({
                    where: {
                        blocker: { user_id },
                        blocked: { user_id: target_user_id },
                        is_blocked: true
                    }
                });
                if (isOtherUserBlocked) {
                    is_other_user_blocked = true;
                }
                io.to(target_user_id_socket).emit("block_unblock_status", {
                    user_id: user_id,
                    target_user_id: target_user_id,
                    is_blocked: is_blocked,
                    is_other_user_blocked: is_other_user_blocked,
                });
            }
        }
        catch (error) {
            console.log(error.message);
        }
    });
};
exports.handleBlockUnblockUserStatus = handleBlockUnblockUserStatus;
const handleAudioVideoCallCheck = (io, type) => {
    return (_a) => __awaiter(void 0, [_a], void 0, function* ({ user_id, target_user_id }) {
        const messageRepo = (0, typeorm_1.getRepository)(Message_1.Message);
        const callLogRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        let is_audio_call_allowed = false;
        let is_video_call_allowed = false;
        try {
            const messageFromUserToTarget = yield messageRepo.findOne({
                where: {
                    sender: { user_id },
                    chat: [
                        { user_1: { user_id }, user_2: { user_id: target_user_id } },
                        { user_1: { user_id: target_user_id }, user_2: { user_id } }
                    ]
                }
            });
            const messageFromTargetToUser = yield messageRepo.findOne({
                where: {
                    sender: { user_id: target_user_id },
                    chat: [
                        { user_1: { user_id }, user_2: { user_id: target_user_id } },
                        { user_1: { user_id: target_user_id }, user_2: { user_id } }
                    ]
                }
            });
            if (messageFromUserToTarget && messageFromTargetToUser) {
                is_audio_call_allowed = true;
                const callLog = yield callLogRepo.findOne({
                    where: [
                        { caller: { user_id: user_id }, receiver: { user_id: target_user_id }, type: "audio", status: "completed" },
                        { caller: { user_id: target_user_id }, receiver: { user_id: user_id }, type: "audio", status: "completed" },
                    ]
                });
                if (callLog) {
                    is_video_call_allowed = true;
                }
            }
            const emitData = (toUserId, fromUserId) => {
                const socketId = connectedClients[toUserId];
                if (!socketId)
                    return;
                const data = {
                    type,
                    user_id: toUserId,
                    target_user_id: fromUserId,
                    audio_call: {
                        is_audio_call_allowed,
                        message: is_audio_call_allowed
                            ? "You can now start an audio call with this user."
                            : "Audio calling is available only for Elite Plan users who have started a conversation."
                    },
                    video_call: {
                        is_video_call_allowed,
                        message: is_video_call_allowed
                            ? "You can now start a video call with this user."
                            : "Video calling is available only for Elite Plan users who have already messaged and voice-called this user."
                    }
                };
                io.to(socketId).emit("audio_video_call_check", data);
            };
            emitData(user_id, target_user_id);
            emitData(target_user_id, user_id);
        }
        catch (error) {
            console.log(error.message);
        }
    });
};
exports.handleAudioVideoCallCheck = handleAudioVideoCallCheck;
const handleIsFirstGame = (socket, io) => {
    return (_a) => __awaiter(void 0, [_a], void 0, function* ({ recipient_id }) {
        try {
            if (!socket.user) {
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }
            const messageRepository = (0, typeorm_1.getRepository)(Message_1.Message);
            const message = yield messageRepository.findOne({
                where: [
                    {
                        chat: {
                            user_1: { user_id: socket.user.user_id },
                            user_2: { user_id: recipient_id }
                        },
                        message_type: "poll"
                    },
                    {
                        chat: {
                            user_1: { user_id: recipient_id },
                            user_2: { user_id: socket.user.user_id }
                        },
                        message_type: "poll"
                    }
                ]
            });
            let target_user_id_socket = connectedClients[recipient_id];
            if (target_user_id_socket) {
                io.to(target_user_id_socket).emit('is_first_game_response', {
                    success: true,
                    status: 200,
                    message: !message ? "First poll game" : "Not first poll game",
                    data: {
                        is_first_game: !message
                    }
                });
            }
            let user_id_socket = connectedClients[socket.user.user_id];
            if (user_id_socket) {
                io.to(user_id_socket).emit('is_first_game_response', {
                    success: true,
                    status: 200,
                    message: !message ? "First poll game" : "Not first poll game",
                    data: {
                        is_first_game: !message
                    }
                });
            }
        }
        catch (error) {
            socket.emit('error', { message: error.message });
        }
    });
};
const handleDisconnect = (socket, io) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("User disconnected", (_a = socket.user) === null || _a === void 0 ? void 0 : _a.user_id);
    if (socket.user) {
        const lastSeenTime = new Date();
        yield (0, typeorm_1.getRepository)(User_1.User).update(socket.user.user_id, {
            is_online: false,
            last_seen: lastSeenTime,
        });
        if (activeChatRooms[socket.user.user_id]) {
            activeChatRooms[socket.user.user_id].forEach(roomId => socket.leave(roomId));
            delete activeChatRooms[socket.user.user_id];
        }
        delete connectedClients[socket.user.user_id];
    }
});
