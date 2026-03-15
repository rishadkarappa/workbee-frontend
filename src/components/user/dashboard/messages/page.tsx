import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socketService } from '@/services/socket-service';
import { ChatService } from '@/services/chat-service';
import { AuthHelper } from '@/utils/auth-helper';
import { ArrowLeft, Send, User } from 'lucide-react';
import { MediaUploadButton } from '@/components/chat/MediaUploadButton';
import type { UploadedMedia } from '@/components/chat/MediaUploadButton';
import { MediaMessage } from '@/components/chat/MediaMessage';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  senderDetails?: { name: string; avatar?: string };
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  createdAt: string;
}

interface Chat {
  id: string;
  participants: { userId: string; workerId: string };
  participantDetails?: {
    user?:   { id: string; name: string; avatar?: string };
    worker?: { id: string; name: string; avatar?: string };
  };
  lastMessage?: string;
  lastMessageAt?: string;
  myUnreadCount?: number;
}

export default function ClientMessages() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [newMessage,   setNewMessage]   = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats,        setChats]        = useState<Chat[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [sendError,    setSendError]    = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia | null>(null);

  const user   = AuthHelper.getUser();
  const token  = AuthHelper.getAccessToken();
  const userId = user?.id || user?._id || AuthHelper.getUserId();
  const { chatId: navChatId, workTitle, userName } = location.state || {};

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<Chat | null>(null);

  /**
   * true  = chat was just opened / refreshed → next scroll must be instant
   * false = a new message arrived while chat was open → smooth scroll
   */
  const isInitialLoadRef = useRef(false);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fires whenever messages array changes
  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      // First load of this chat — jump instantly so user sees last message
      scrollToBottomInstant();
      isInitialLoadRef.current = false;
    } else {
      // New message arrived while chat was open — smooth scroll
      scrollToBottomSmooth();
    }
  }, [messages, scrollToBottomInstant, scrollToBottomSmooth]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }

    const handleNewMessage = (message: Message) => {
      const incomingChatId = (message as any).chatId;

      if (incomingChatId === selectedChatRef.current?.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        return;
      }

      if (message.senderId !== userId && incomingChatId) {
        setUnreadCounts(prev => ({
          ...prev,
          [incomingChatId]: (prev[incomingChatId] || 0) + 1,
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
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleUserTyping);
    };
  }, [token, navChatId, userId]);

  useEffect(() => {
    if (!selectedChat) return;

    loadMessages(selectedChat.id);
    socketService.joinChat(selectedChat.id);

    setUnreadCounts(prev => ({ ...prev, [selectedChat.id]: 0 }));
    setChats(prev =>
      prev.map(c => c.id === selectedChat.id ? { ...c, myUnreadCount: 0 } : c)
    );

    ChatService.markChatAsRead(selectedChat.id).catch(err =>
      console.error('[Chat] markChatAsRead failed:', err)
    );

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
      const counts: Record<string, number> = {};
      fetchedChats.forEach(c => { counts[c.id] = c.myUnreadCount ?? 0; });
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
      // Mark next scroll as initial — will be instant regardless of images
      isInitialLoadRef.current = true;
      const response = await ChatService.getMessages(chatId);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const getRecipientId = (chat: Chat) =>
    user?.role === 'worker' ? chat.participants.userId : chat.participants.workerId;

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
    setPendingMedia(null);
    setSendError(null);
  };

  const handleMediaUploaded = (media: UploadedMedia) => {
    setPendingMedia(media);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!selectedChat) return;
    setSendError(null);

    try {
      if (pendingMedia) {
        await socketService.sendMessage({
          chatId:        selectedChat.id,
          content:       pendingMedia.resourceType === 'image' ? '📷 Image' : '🎥 Video',
          type:          pendingMedia.resourceType,
          recipientId:   getRecipientId(selectedChat),
          mediaUrl:      pendingMedia.url,
          mediaPublicId: pendingMedia.publicId,
        } as any);
        setPendingMedia(null);
        socketService.sendTyping(selectedChat.id, false);
        return;
      }

      if (!newMessage.trim()) return;
      await socketService.sendMessage({
        chatId:      selectedChat.id,
        content:     newMessage,
        type:        'text',
        recipientId: getRecipientId(selectedChat),
      });
      setNewMessage('');
      socketService.sendTyping(selectedChat.id, false);
    } catch {
      setSendError('Failed to send. Tap retry or check your connection.');
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (selectedChat) socketService.sendTyping(selectedChat.id, !!value.trim());
  };

  const getOtherParticipant = (chat: Chat) =>
    user?.role === 'worker' ? chat.participantDetails?.user : chat.participantDetails?.worker;

  const canSend = !!pendingMedia || !!newMessage.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-250px)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            chats.map(chat => {
              const otherUser  = getOtherParticipant(chat);
              const isSelected = selectedChat?.id === chat.id;
              const unread     = unreadCounts[chat.id] || 0;
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
                      <h3 className="font-semibold">{otherUser?.name || userName || 'Unknown User'}</h3>
                      {workTitle && <p className="text-sm text-gray-500">Regarding: {workTitle}</p>}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isSent = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md px-4 py-2 rounded-lg ${isSent ? 'bg-black text-white' : 'bg-white text-gray-900 border'}`}>
                        {!isSent && msg.senderDetails && (
                          <p className="text-xs text-gray-500 mb-1">{msg.senderDetails.name}</p>
                        )}
                        {(msg.type === 'image' || msg.type === 'video') && msg.mediaUrl ? (
                          <MediaMessage
                            type={msg.type}
                            mediaUrl={msg.mediaUrl}
                            isSent={isSent}
                            onLoaded={scrollToBottomInstant}
                          />
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${isSent ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            <div className="bg-white border-t p-4">
              {sendError && (
                <div className="mb-2 flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  <span>{sendError}</span>
                  <button
                    onClick={() => { setSendError(null); handleSendMessage(); }}
                    className="ml-3 text-red-700 font-medium underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {pendingMedia && (
                <div className="mb-2 flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                  {pendingMedia.resourceType === 'image' ? (
                    <img src={pendingMedia.url} alt="preview" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <video src={pendingMedia.url} className="w-12 h-12 rounded object-cover" />
                  )}
                  <span className="text-sm text-gray-600 flex-1 truncate">
                    {pendingMedia.resourceType === 'image' ? 'Image ready to send' : 'Video ready to send'}
                  </span>
                  <button onClick={() => setPendingMedia(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <MediaUploadButton onUploaded={handleMediaUploaded} disabled={!!pendingMedia} />
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={pendingMedia ? 'Press send to share media…' : 'Type a message…'}
                  disabled={!!pendingMedia}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canSend}
                  className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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