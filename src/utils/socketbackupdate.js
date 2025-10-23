"use strict";
// import { Server, Socket } from 'socket.io';
// import { getRepository, IsNull } from 'typeorm';
// import { JwtPayload, verify } from 'jsonwebtoken';
// import { User } from '../entities/User';
// import { ChatService, findOrCreateChat } from '../services/ChatService';
// import { Message } from '../entities/Message';
// import { Chat } from '../entities/Chat';
// const chatService = new ChatService();
// const JWT_SECRET = process.env.JWT_SECRET as string;
// let ChatEventEnum = {
//     JOIN_CHAT_EVENT: "join_room",
//     TYPING_EVENT: "typing_event",
//     STOP_TYPING_EVENT: "stop_typing_event"
// }
// interface AuthenticatedSocket extends Socket {
//     user?: User;
// }
// declare module 'socket.io' {
//     interface Socket {
//         user?: User;
//     }
// }
// const activeChatRooms: Record<string, Set<string>> = {};
// const connectedClients: Record<string, string> = {};
// export const chat_list = (socket: Socket) => {
//     socket.on("get_chat_list", async () => {
//         try {
//             console.log("chat list call event");
//             if (!socket.user) {
//                 socket.emit('unauthorized', {
//                     status: 401,
//                     message: 'User not authenticated',
//                     success: false,
//                 });
//                 return;
//             }
//             const userId = socket.user.user_id;
//             const chats = await getRepository(Chat).find({
//                 where: [
//                     { user_1: { user_id: userId } },
//                     { user_2: { user_id: userId } },
//                 ],
//                 relations: ['user_1', 'user_2'],
//             });
//             const chatList = await Promise.all(chats.map(async (chat) => {
//                 const otherUser = chat.user_1.user_id === userId ? chat.user_2 : chat.user_1;
//                 const lastMessage = await getRepository(Message).findOne({
//                     where: { chat: { chat_id: chat.chat_id } },
//                     order: { created_at: 'DESC' },
//                 });
//                 const unreadCount = await getRepository(Message).count({
//                     where: {
//                         chat: { chat_id: chat.chat_id },
//                         is_read: false,
//                         sender: { user_id: otherUser.user_id },
//                     },
//                 });
//                 return {
//                     chat_id: chat.chat_id,
//                     user: {
//                         user_id: otherUser.user_id,
//                         full_name: otherUser.full_name,
//                         profile_image: otherUser.profile_image,
//                     },
//                     lastMessage: lastMessage ? lastMessage.content : '',
//                     lastMessageTime: lastMessage ? lastMessage.created_at : null,
//                     unreadCount,
//                 };
//             }));
//             socket.emit('chat_list', {
//                 status: 200,
//                 success: true,
//                 data: chatList,
//             });
//         } catch (error: any) {
//             console.error('Error fetching chat list:', error);
//             socket.emit('socket-error', {
//                 status: 500,
//                 message: error.message || 'Something went wrong while fetching the chat list.',
//             });
//         }
//     });
// }
// export const chatJoinEventFunction = (socket: Socket) => {
//     socket.on(ChatEventEnum.JOIN_CHAT_EVENT, ({ roomId }) => {
//         if (socket.user) {
//             const userRooms = activeChatRooms[socket.user.user_id];
//             if (userRooms) {
//                 userRooms.forEach((activeRoomId) => {
//                     socket.leave(activeRoomId);
//                     // console.log(`User left chat. chatId: `, activeRoomId);
//                 });
//                 userRooms.clear();
//             } else {
//                 activeChatRooms[socket.user.user_id] = new Set();
//             }
//             socket.join(roomId);
//             activeChatRooms[socket.user.user_id].add(roomId);
//             // console.log(`User joined the chat. chatId: `, roomId);
//             // console.log(activeChatRooms);
//         }
//     });
// };
// export const configureSocketIO = (io: Server) => {
//     io.on('connection', async (socket: AuthenticatedSocket) => {
//         try {
//             const authHeader = socket.handshake.headers.authorization;
//             if (!authHeader) {
//                 socket.emit('unauthorized', {
//                     status: 401,
//                     message: 'Authorization header is missing',
//                     success: false,
//                 });
//                 return socket.disconnect();
//             }
//             const token = authHeader.replace('Bearer ', '');
//             const decoded = verify(token, JWT_SECRET) as JwtPayload;
//             let user: User | null = null;
//             if (decoded.userId) {
//                 user = await getRepository(User).findOneBy({ user_id: decoded.userId });
//                 connectedClients[decoded.userId] = socket.id;
//                 console.log(socket.id, "user_id", decoded.userId);
//             }
//             if (!user) {
//                 console.log('Unauthorized handshake. Token is invalid');
//                 socket.emit('unauthorized', {
//                     status: 401,
//                     message: 'Unauthorized handshake. Token is invalid',
//                     success: false,
//                 });
//                 return socket.disconnect();
//             }
//             socket.user = user;
//             await getRepository(User).update(socket.user!.user_id, {
//                 is_online: true,
//                 last_seen: null,
//             });
//             console.log(`User ${user.user_id} is online`);
//             chatJoinEventFunction(socket);
//             // typingEventFunction(socket);
//             // stopTypingEventFunction(socket);
//             chat_list(socket);
//             socket.on('send_message', async (payload) => {
//                 if (!payload) {
//                     console.error('Payload is missing!');
//                     return;
//                 }
//                 const { user_2_id, content } = payload;
//                 try {
//                     let user_1_id = Number(socket.user?.user_id)
//                     let sender_id = Number(socket.user?.user_id)
//                     let chat_details = await findOrCreateChat(user_1_id, user_2_id);
//                     const message = await chatService.saveMessage(chat_details.chat_id, sender_id, content);
//                     const message_data = {
//                         user_1_id,
//                         user_2_id,
//                         sender_id,
//                         content: message.content,
//                         created_at: message.created_at,
//                     };
//                     const recipientId = sender_id ? user_2_id : user_1_id;
//                     const recipientSocketId = connectedClients[recipientId];
//                     const senderSocketId = connectedClients[user_1_id];
//                     if (recipientSocketId) {
//                         console.log(recipientSocketId, "recipientSocketId");
//                         console.log(senderSocketId, "senderSocketId");
//                         io.to(recipientSocketId).emit('send_message', message_data);
//                         io.to(recipientSocketId).emit('update_chat_list');
//                         io.to(senderSocketId).emit('update_chat_list');
//                     }
//                     const roomId = `${user_1_id}-${user_2_id}`;
//                     const isRecipientActive = activeChatRooms[recipientId] && activeChatRooms[recipientId].has(roomId);
//                     // if (!isRecipientActive) {
//                     //     console.log("is not connected isRecipientActive")
//                     // } else {
//                     //     console.log('Recipient is active in chat, not incrementing unread count.');
//                     // }
//                 } catch (error) {
//                     console.error('Error saving message: ', error);
//                 }
//             });
//             socket.on("disconnect", async () => {
//                 console.log("disconnet")
//                 delete connectedClients[socket.id];
//                 console.log(`User disconnected Id: ${socket.user?.user_id}`);
//                 if (socket.user) {
//                     const lastSeenTime = new Date();
//                     await getRepository(User).update(socket.user!.user_id, {
//                         last_seen: lastSeenTime,
//                         is_online: false,
//                     });
//                     io.emit('user-status-change', {
//                         userId: socket.user!.user_id,
//                         is_online: false,
//                         last_seen: lastSeenTime,
//                     });
//                     console.log(`User ${socket.user!.user_id} is offline`);
//                     if (socket.user && activeChatRooms[socket.user.user_id]) {
//                         activeChatRooms[socket.user.user_id].forEach(roomId => {
//                             socket.leave(roomId);
//                         });
//                         delete activeChatRooms[socket.user.user_id];
//                         delete connectedClients[socket.id];
//                     }
//                 }
//                 socket.leave(socket.id);
//             });
//         } catch (error: any) {
//             console.error('Error:', error);
//             socket.emit("socket-error", {
//                 status: 500,
//                 message: error.message || 'Something went wrong while connecting to the socket.',
//             });
//         }
//     });
// };
// /////////////////////////////////
// // export const typingEventFunction = (socket: Socket) => {
// //     socket.on(ChatEventEnum.TYPING_EVENT, ({ roomId }) => {
// //         socket.in(roomId).emit(ChatEventEnum.TYPING_EVENT, roomId);
// //         console.log("room id ", roomId)
// //     });
// // };
// // export const stopTypingEventFunction = (socket: Socket) => {
// //     socket.on(ChatEventEnum.STOP_TYPING_EVENT, ({ roomId }) => {
// //         socket.in(roomId).emit(ChatEventEnum.STOP_TYPING_EVENT, roomId);
// //         console.log("room id for stop typing", roomId)
// //     });
// // };
