// import { useEffect, useRef, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { socketService } from '@/services/socket-service';
// import { ChatService } from '@/services/chat-service';
// import { AuthHelper } from '@/utils/auth-helper';
// import { ArrowLeft, Send, User } from 'lucide-react';

// interface Message {
//   id: string;
//   content: string;
//   senderId: string;
//   senderRole: string;
//   senderDetails?: {
//     name: string;
//     avatar?: string;
//   };
//   createdAt: string;
// }

// interface Chat {
//   id: string;
//   participants: {
//     userId: string;
//     workerId: string;
//   };
//   participantDetails?: {
//     user?: {
//       id: string;
//       name: string;
//       avatar?: string;
//     };
//     worker?: {
//       id: string;
//       name: string;
//       avatar?: string;
//     };
//   };
//   lastMessage?: string;
//   lastMessageAt?: string;
// }

// export default function ClientMessages() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [isTyping, setIsTyping] = useState(false);
//   const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [loading, setLoading] = useState(true);

//   const user = AuthHelper.getUser();
//   const token = AuthHelper.getAccessToken();
//   const userId = user?.id || user?._id || AuthHelper.getUserId();

//   const { chatId, userId: clientId, workId, workTitle, userName } = location.state || {};

//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Setup socket connection and global listeners ONCE
//   useEffect(() => {
//     if (token && !socketService.isConnected()) {
//       socketService.connect(token);
//     }

//     // Setup global message listener
//     const handleNewMessage = (message: Message) => {
//       setMessages((prev) => {
//         // Prevent duplicates
//         if (prev.some(m => m.id === message.id)) {
//           return prev;
//         }
//         return [...prev, message];
//       });
//     };

//     // Setup global typing listener
//     const handleUserTyping = ({ userId: typingUserId, isTyping }: { userId: string; isTyping: boolean }) => {
//       if (typingUserId !== userId) {
//         setIsTyping(isTyping);
//       }
//     };

//     socketService.onNewMessage(handleNewMessage);
//     socketService.onUserTyping(handleUserTyping);

//     loadChats();

//     if (chatId) {
//       loadChatById(chatId);
//     }

//     return () => {
//       socketService.offNewMessage();
//       socketService.offUserTyping();
//     };
//   }, [token, chatId, userId]);

//   // Handle chat room joining/leaving when selectedChat changes
//   useEffect(() => {
//     if (selectedChat) {
//       loadMessages(selectedChat.id);
//       socketService.joinChat(selectedChat.id);

//       return () => {
//         socketService.leaveChat(selectedChat.id);
//       };
//     }
//   }, [selectedChat?.id]);

//   const loadChats = async () => {
//     try {
//       setLoading(true);
//       const response = await ChatService.getMyChats();
//       setChats(response.data.data || []);
//     } catch (error) {
//       console.error('Failed to load chats:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadChatById = async (chatId: string) => {
//     try {
//       const chat = chats.find(c => c.id === chatId);
//       if (chat) {
//         setSelectedChat(chat);
//       } else {
//         await loadChats();
//         const response = await ChatService.getMyChats();
//         const foundChat = response.data.data.find((c: Chat) => c.id === chatId);
//         if (foundChat) {
//           setSelectedChat(foundChat);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load chat:', error);
//     }
//   };

//   const loadMessages = async (chatId: string) => {
//     try {
//       const response = await ChatService.getMessages(chatId);
//       setMessages(response.data.data || []);
//     } catch (error) {
//       console.error('Failed to load messages:', error);
//     }
//   };

//   const getRecipientId = (chat: Chat) => {
//     const isWorker = user?.role === 'worker';
//     if (isWorker) {
//       return chat.participants.userId;
//     } else {
//       return chat.participants.workerId;
//     }
//   };

//   const handleSendMessage = () => {
//     if (!newMessage.trim() || !selectedChat) return;

//     const recipientId = getRecipientId(selectedChat);

//     socketService.sendMessage({
//       chatId: selectedChat.id,
//       content: newMessage,
//       type: 'text',
//       recipientId: recipientId
//     });

//     setNewMessage('');
//     socketService.sendTyping(selectedChat.id, false);
//   };

//   const handleTyping = (value: string) => {
//     setNewMessage(value);
    
//     if (selectedChat) {
//       if (value.trim()) {
//         socketService.sendTyping(selectedChat.id, true);
//       } else {
//         socketService.sendTyping(selectedChat.id, false);
//       }
//     }
//   };

//   const getOtherParticipant = (chat: Chat) => {
//     const isWorker = user?.role === 'worker';
//     if (isWorker) {
//       return chat.participantDetails?.user;
//     } else {
//       return chat.participantDetails?.worker;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex  w-full h-[calc(100vh-250px)] bg-gray-50">
//       {/* Chat List Sidebar */}
//       <div className="w-80 bg-white border-r flex flex-col">
//         <div className="flex-1 overflow-y-auto">
//           {chats.length === 0 ? (
//             <div className="p-4 text-center text-gray-500">
//               No conversations yet
//             </div>
//           ) : (
//             chats.map((chat) => {
//               const otherUser = getOtherParticipant(chat);
//               const isSelected = selectedChat?.id === chat.id;
              
//               return (
//                 <div
//                   key={chat.id}
//                   onClick={() => setSelectedChat(chat)}
//                   className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
//                     isSelected ? 'bg-blue-50' : ''
//                   }`}
//                 >
//                   <div className="flex items-center gap-3">
//                     {otherUser?.avatar ? (
//                       <img
//                         src={otherUser.avatar}
//                         alt={otherUser.name}
//                         className="w-12 h-12 rounded-full"
//                       />
//                     ) : (
//                       <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
//                         <User className="w-6 h-6 text-gray-600" />
//                       </div>
//                     )}
//                     <div className="flex-1 min-w-0">
//                       <h3 className="font-medium text-gray-900 truncate">
//                         {otherUser?.name || 'Unknown User'}
//                       </h3>
//                       <p className="text-sm text-gray-500 truncate">
//                         {chat.lastMessage || 'No messages yet'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* Chat Window */}
//       <div className="flex-1 flex flex-col">
//         {selectedChat ? (
//           <>
//             {/* Chat Header */}
//             <div className="bg-white border-b p-4 flex items-center gap-3">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//               </button>
              
//               {(() => {
//                 const otherUser = getOtherParticipant(selectedChat);
//                 return (
//                   <>
//                     {otherUser?.avatar ? (
//                       <img
//                         src={otherUser.avatar}
//                         alt={otherUser.name}
//                         className="w-10 h-10 rounded-full"
//                       />
//                     ) : (
//                       <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
//                         <User className="w-5 h-5 text-gray-600" />
//                       </div>
//                     )}
//                     <div>
//                       <h3 className="font-semibold">{otherUser?.name || userName || 'Unknown User'}</h3>
//                       {workTitle && (
//                         <p className="text-sm text-gray-500">Regarding: {workTitle}</p>
//                       )}
//                     </div>
//                   </>
//                 );
//               })()}
//             </div>

//             {/* Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {messages.length === 0 ? (
//                 <div className="text-center text-gray-500 mt-8">
//                   No messages yet. Start the conversation!
//                 </div>
//               ) : (
//                 messages.map((msg) => {
//                   const isSent = msg.senderId === userId;
//                   return (
//                     <div
//                       key={msg.id}
//                       className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
//                     >
//                       <div
//                         className={`max-w-md px-4 py-2 rounded-lg ${
//                           isSent
//                             ? 'bg-black text-white'
//                             : 'bg-white text-gray-900 border'
//                         }`}
//                       >
//                         {!isSent && msg.senderDetails && (
//                           <p className="text-xs text-gray-500 mb-1">
//                             {msg.senderDetails.name}
//                           </p>
//                         )}
//                         <p>{msg.content}</p>
//                         <p
//                           className={`text-xs mt-1 ${
//                             isSent ? 'text-blue-100' : 'text-gray-500'
//                           }`}
//                         >
//                           {new Date(msg.createdAt).toLocaleTimeString([], {
//                             hour: '2-digit',
//                             minute: '2-digit'
//                           })}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
              
//               {isTyping && (
//                 <div className="flex justify-start">
//                   <div className="bg-gray-200 px-4 py-2 rounded-lg">
//                     <span className="text-sm text-gray-600">Typing...</span>
//                   </div>
//                 </div>
//               )}
              
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Input Area */}
//             <div className="bg-white border-t p-4">
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   value={newMessage}
//                   onChange={(e) => handleTyping(e.target.value)}
//                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                   placeholder="Type a message..."
//                   className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   disabled={!newMessage.trim()}
//                   className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                 >
//                   <Send className="w-4 h-4" />
            
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             Select a conversation to start messaging
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socketService } from '@/services/socket-service';
import { ChatService } from '@/services/chat-service';
import { AuthHelper } from '@/utils/auth-helper';
import { ArrowLeft, Send, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  senderDetails?: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface Chat {
  id: string;
  participants: {
    userId: string;
    workerId: string;
  };
  participantDetails?: {
    user?: {
      id: string;
      name: string;
      avatar?: string;
    };
    worker?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  lastMessage?: string;
  lastMessageAt?: string;
}

export default function ClientMessages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-chat unread counts: { [chatId]: number }
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const user = AuthHelper.getUser();
  const token = AuthHelper.getAccessToken();
  const userId = user?.id || user?._id || AuthHelper.getUserId();

  const { chatId, userId: clientId, workId, workTitle, userName } = location.state || {};

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Keep a ref to selectedChat so the socket handler always sees the latest value
  const selectedChatRef = useRef<Chat | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Setup socket connection and global listeners ONCE
  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // If the message is from someone else AND it's NOT in the currently open chat,
      // increment unread count for that chat
      if (message.senderId !== userId) {
        // We need the chatId from the message — socket payloads usually include it
        const incomingChatId = (message as any).chatId;
        if (incomingChatId && incomingChatId !== selectedChatRef.current?.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [incomingChatId]: (prev[incomingChatId] || 0) + 1,
          }));

          // Also update lastMessage preview in chat list
          setChats(prev =>
            prev.map(c =>
              c.id === incomingChatId
                ? { ...c, lastMessage: message.content }
                : c
            )
          );
        }
      }
    };

    const handleUserTyping = ({ userId: typingUserId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) {
        setIsTyping(isTyping);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    loadChats();

    if (chatId) {
      loadChatById(chatId);
    }

    return () => {
      socketService.offNewMessage();
      socketService.offUserTyping();
    };
  }, [token, chatId, userId]);

  // Handle chat room joining/leaving when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      socketService.joinChat(selectedChat.id);

      // Clear unread count for the chat we just opened
      setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));

      return () => {
        socketService.leaveChat(selectedChat.id);
      };
    }
  }, [selectedChat?.id]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await ChatService.getMyChats();
      setChats(response.data.data || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatById = async (chatId: string) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
      } else {
        await loadChats();
        const response = await ChatService.getMyChats();
        const foundChat = response.data.data.find((c: Chat) => c.id === chatId);
        if (foundChat) {
          setSelectedChat(foundChat);
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await ChatService.getMessages(chatId);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const getRecipientId = (chat: Chat) => {
    const isWorker = user?.role === 'worker';
    return isWorker ? chat.participants.userId : chat.participants.workerId;
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Clear unread badge immediately on click
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const recipientId = getRecipientId(selectedChat);

    socketService.sendMessage({
      chatId: selectedChat.id,
      content: newMessage,
      type: 'text',
      recipientId: recipientId
    });

    setNewMessage('');
    socketService.sendTyping(selectedChat.id, false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (selectedChat) {
      socketService.sendTyping(selectedChat.id, value.trim() ? true : false);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const isWorker = user?.role === 'worker';
    return isWorker ? chat.participantDetails?.user : chat.participantDetails?.worker;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-250px)] bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isSelected = selectedChat?.id === chat.id;
              const unread = unreadCounts[chat.id] || 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}

                    {/* Name + last message */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`truncate ${unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                        {otherUser?.name || 'Unknown User'}
                      </h3>
                      <p className={`text-sm truncate ${unread > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-black text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {(() => {
                const otherUser = getOtherParticipant(selectedChat);
                return (
                  <>
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{otherUser?.name || userName || 'Unknown User'}</h3>
                      {workTitle && (
                        <p className="text-sm text-gray-500">Regarding: {workTitle}</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isSent = msg.senderId === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          isSent
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-900 border'
                        }`}
                      >
                        {!isSent && msg.senderDetails && (
                          <p className="text-xs text-gray-500 mb-1">
                            {msg.senderDetails.name}
                          </p>
                        )}
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-600">Typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}