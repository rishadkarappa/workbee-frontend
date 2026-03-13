import { useEffect, useState, useRef } from 'react';
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
  myUnreadCount?: number; // comes from backend
}

export default function WorkerMessages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = AuthHelper.getUser();
  const token = AuthHelper.getAccessToken();
  const userId = user?.id || user?._id || AuthHelper.getUserId();

  const { chatId: navChatId, workTitle } = location.state || {};

  // Keep ref in sync so socket handler never sees stale selectedChat
  const selectedChatRef = useRef<Chat | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleNewMessage = (message: Message) => {
      const incomingChatId = (message as any).chatId;

      // Message belongs to open chat — just append
      if (incomingChatId === selectedChatRef.current?.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        return;
      }

      // Message for a different chat — increment badge
      if (message.senderId !== userId && incomingChatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [incomingChatId]: (prev[incomingChatId] || 0) + 1
        }));
        setChats(prev =>
          prev.map(c =>
            c.id === incomingChatId ? { ...c, lastMessage: message.content } : c
          )
        );
      }
    };

    const handleUserTyping = ({ userId: typingUserId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) setIsTyping(isTyping);
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    const init = async () => {
      await loadChats();
      if (navChatId) await loadChatById(navChatId);
    };
    init();

    return () => {
      socketService.offNewMessage();
      socketService.offUserTyping();
    };
  }, [token, navChatId, userId]);

  // When selected chat changes: load messages, join room, reset unread in DB
  useEffect(() => {
    if (!selectedChat) return;

    loadMessages(selectedChat.id);
    socketService.joinChat(selectedChat.id);

    // Clear badge in memory immediately
    setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));
    setChats(prev =>
      prev.map(c => c.id === selectedChat.id ? { ...c, myUnreadCount: 0 } : c)
    );

    // Reset in DB — persists across refreshes
    ChatService.markChatAsRead(selectedChat.id)
      .then(() => console.log('[Chat] marked as read:', selectedChat.id))
      .catch(err => console.error('[Chat] markChatAsRead failed:', err));

    return () => {
      socketService.leaveChat(selectedChat.id);
    };
  }, [selectedChat?.id]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await ChatService.getMyChats();
      const fetchedChats: Chat[] = response.data.data || [];
      setChats(fetchedChats);

      // Seed unread counts from DB on every load — survives refresh
      const counts: Record<string, number> = {};
      fetchedChats.forEach(c => {
        counts[c.id] = c.myUnreadCount ?? 0;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatById = async (chatId: string) => {
    try {
      const response = await ChatService.getMyChats();
      const found = (response.data.data as Chat[]).find(c => c.id === chatId);
      if (found) setSelectedChat(found);
    } catch (error) {
      console.error('Failed to load chat by id:', error);
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

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const recipientId = selectedChat.participants.userId; // worker sends to user

    socketService.sendMessage({
      chatId: selectedChat.id,
      content: newMessage,
      type: 'text',
      recipientId
    });

    setNewMessage('');
    socketService.sendTyping(selectedChat.id, false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (selectedChat) {
      socketService.sendTyping(selectedChat.id, !!value.trim());
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const isWorker = user?.role === 'worker';
    return isWorker ? chat.participantDetails?.user : chat.participantDetails?.worker;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(120vh-350px)] w-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            chats.map(chat => {
              const otherUser = getOtherParticipant(chat);
              const isSelected = selectedChat?.id === chat.id;
              const unread = unreadCounts[chat.id] || 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
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
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {(() => {
                const otherUser = getOtherParticipant(selectedChat);
                return (
                  <>
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{otherUser?.name || 'Unknown User'}</h3>
                      {workTitle && <p className="text-sm text-gray-500">Regarding: {workTitle}</p>}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 py-5 md:px-6 lg:px-8 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isSent = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] sm:max-w-[75%] md:max-w-[68%] lg:max-w-[62%] break-words shadow-sm ${
                        isSent
                          ? 'bg-black text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                      }`}>
                        {!isSent && msg.senderDetails && (
                          <div className="text-xs text-gray-500 mb-1 font-medium">
                            {msg.senderDetails.name}
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                        <div className="text-xs mt-1.5 opacity-75 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-none text-sm text-gray-600">
                    Typing...
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
                  onChange={e => handleTyping(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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