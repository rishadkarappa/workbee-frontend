import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socketService } from '@/services/chat-socket-service';
import { ChatService } from '@/services/chat-service';
import { AuthHelper } from '@/utils/auth-helper';
import { ArrowLeft, Send, User, HandshakeIcon, TicketPercent, Search } from 'lucide-react';
import { MediaUploadButton } from '@/components/chat/MediaUploadButton';
import type { UploadedMedia } from '@/components/chat/MediaUploadButton';
import { MediaMessage } from '@/components/chat/MediaMessage';
import { SystemMessage } from '@/components/chat/SystemMessage';
import { parseSystemMessage, isBidCardActionable } from '@/components/chat/system-message-utils';
import AskBetterPriceModal from './modals/ask-better-price-modal';
import { BidService } from '@/services/bid-service';
import UserProfileModal from '@/components/chat/UserProfileModal';

// types
import type { Message, Chat } from './types/messages.types'
import { AuthService } from '@/services/auth-service';
import { Input } from '@/components/ui/input';

type ConfirmStatus = 'none' | 'pending' | 'rejected' | 'accepted' | 'paid';
type BidStatus = 'none' | 'pending' | 'rejected' | 'accepted' | 'paid';

export default function WorkerMessages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pendingMedia, setPendingMedia] = useState<UploadedMedia | null>(null);
  const [askConfirmLoading, setAskConfirmLoading] = useState(false);
  // ask better price bidding
  const [askNewPriceLoading,] = useState(false);
  const [AskNewPriceModalOpen, setAskNewPriceModalOpen] = useState(false);
  // Track which workIds have already had a ask new price request sent in this chat
  const [sentAskNewPriceRequests, setSentAskNewPriceRequests] = useState<Set<string>>(new Set());

  // Confirm-request lifecycle per workId (replaces the old boolean sentConfirmRequests set)
  const [confirmStatusByWork, setConfirmStatusByWork] = useState<Record<string, ConfirmStatus>>({});
  const [bidStatusByWork, setBidStatusByWork] = useState<Record<string, BidStatus>>({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // profile image
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});

  //search
  const [chatSearch, setChatSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<Chat | null>(null);
  const isInitialLoadRef = useRef(false);

  const user = AuthHelper.getUser();
  const token = AuthHelper.getAccessToken();
  const userId = user?.id || AuthHelper.getUserId();
  const { chatId: navChatId, workTitle, workId: navWorkId, currentAmount } = location.state || {};

  // ── Scroll helpers 
  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
  }, []);

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Track the current bid state per workId from message history
  useEffect(() => {
    const sentIds = new Set<string>();
    const workIdToLatestType: Record<string, string> = {};

    messages.forEach(msg => {
      if (msg.type === 'system') {
        const parsed = parseSystemMessage(msg.content);
        if (parsed && 'workId' in parsed && [
          'WORK_BID_OFFER', 'WORK_BID_COUNTER', 'WORK_BID_ACCEPTED', 'WORK_BID_REJECTED', 'WORK_BID_PAID'
        ].includes(parsed.type)) {
          workIdToLatestType[parsed.workId] = parsed.type;
        }
      }
    });

    Object.entries(workIdToLatestType).forEach(([workId, latestType]) => {
      // Only block the button while a negotiation is actively open — 
      // rejected negotiations free up the button to start a new one.
      if (latestType === 'WORK_BID_OFFER' || latestType === 'WORK_BID_COUNTER' || latestType === 'WORK_BID_ACCEPTED') {
        sentIds.add(workId);
      }
    });

    setSentAskNewPriceRequests(sentIds);
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isInitialLoadRef.current) {
      scrollToBottomInstant();
      isInitialLoadRef.current = false;
    } else {
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

    type IncomingChatMessage = Message & { chatId: string };
    const handleNewMessage = (message: IncomingChatMessage) => {
      const incomingChatId = message.chatId;
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
          prev.map(c => c.id === incomingChatId ? { ...c, lastMessage: message.content } : c)
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
  }, [selectedChat]);

  // Derive confirm-request lifecycle per workId from message history.
  // Replaces the two previous (duplicated / broken) "detect sent confirm requests" effects.
  useEffect(() => {
    const workIdToLatestType: Record<string, string> = {};

    messages.forEach(msg => {
      if (msg.type !== 'system') return;
      const parsed = parseSystemMessage(msg.content);
      if (!parsed || !('workId' in parsed)) return;

      if ([
        'WORK_CONFIRM_REQUEST',
        'WORK_CONFIRM_ACCEPTED',
        'WORK_CONFIRM_REJECTED',
        'WORK_CONFIRM_PAID',
      ].includes(parsed.type)) {
        // messages are assumed chronological, so the last match wins as "latest"
        workIdToLatestType[parsed.workId] = parsed.type;
      }
    });

    const nextStatus: Record<string, ConfirmStatus> = {};
    Object.entries(workIdToLatestType).forEach(([workId, latestType]) => {
      switch (latestType) {
        case 'WORK_CONFIRM_REQUEST':
          nextStatus[workId] = 'pending';
          break;
        case 'WORK_CONFIRM_REJECTED':
          nextStatus[workId] = 'rejected';
          break;
        case 'WORK_CONFIRM_ACCEPTED':
          nextStatus[workId] = 'accepted';
          break;
        case 'WORK_CONFIRM_PAID':
          nextStatus[workId] = 'paid';
          break;
      }
    });

    setConfirmStatusByWork(nextStatus);
  }, [messages]);

  // Derive bid lifecycle per workId from message history (parallel to confirmStatusByWork,
  // since a work can also get closed out via the Make Offer / bid-accept-and-pay path).

  useEffect(() => {
    const workIdToLatestType: Record<string, string> = {};

    messages.forEach(msg => {
      if (msg.type !== 'system') return;
      const parsed = parseSystemMessage(msg.content);
      if (!parsed || !('workId' in parsed)) return;

      if ([
        'WORK_BID_OFFER',
        'WORK_BID_COUNTER',
        'WORK_BID_ACCEPTED',
        'WORK_BID_REJECTED',
        'WORK_BID_PAID',
      ].includes(parsed.type)) {
        workIdToLatestType[parsed.workId] = parsed.type;
      }
    });

    const nextStatus: Record<string, BidStatus> = {};
    Object.entries(workIdToLatestType).forEach(([workId, latestType]) => {
      switch (latestType) {
        case 'WORK_BID_OFFER':
        case 'WORK_BID_COUNTER':
          nextStatus[workId] = 'pending';
          break;
        case 'WORK_BID_REJECTED':
          nextStatus[workId] = 'rejected';
          break;
        case 'WORK_BID_ACCEPTED':
          nextStatus[workId] = 'accepted';
          break;
        case 'WORK_BID_PAID':
          nextStatus[workId] = 'paid';
          break;
      }
    });

    setBidStatusByWork(nextStatus);
  }, [messages]);

  const loadChats = async () => {
    try {
      setLoading(true);

      const response = await ChatService.getMyChats();
      const fetchedChats: Chat[] = response.data.data || [];

      setChats(fetchedChats);

      const counts: Record<string, number> = {};

      fetchedChats.forEach(chat => {
        counts[chat.id] = chat.myUnreadCount ?? 0;
      });

      setUnreadCounts(counts);

      // Don't wait for profile images
      const loadProfileImages = async () => {
        const images: Record<string, string> = {};

        await Promise.all(
          fetchedChats.map(async chat => {
            const userId = chat.participants.userId;

            try {
              const response = await AuthService.getUserProfileById(userId);

              const image = response.data.data?.userProfileImage;

              if (image) {
                images[userId] = image;
              }
            } catch (error) {
              console.error(
                `Failed to load profile image for ${userId}`,
                error
              );
            }
          })
        );

        setProfileImages(images);
      };

      // Run separately
      loadProfileImages();

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
      isInitialLoadRef.current = true;
      const response = await ChatService.getMessages(chatId);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

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
    const recipientId = selectedChat.participants.userId;
    try {
      if (pendingMedia) {
        await socketService.sendMessage({
          chatId: selectedChat.id,
          content: pendingMedia.resourceType === 'image' ? '📷 Image' : '🎥 Video',
          type: pendingMedia.resourceType,
          recipientId,
          mediaUrl: pendingMedia.url,
          mediaPublicId: pendingMedia.publicId,
        });
        setPendingMedia(null);
        socketService.sendTyping(selectedChat.id, false);
        return;
      }
      if (!newMessage.trim()) return;
      await socketService.sendMessage({
        chatId: selectedChat.id,
        content: newMessage,
        type: 'text',
        recipientId,
      });
      setNewMessage('');
      socketService.sendTyping(selectedChat.id, false);
    } catch {
      setSendError('Failed to send. Tap retry or check your connection.');
    }
  };

  // ── Ask For Confirm ───────────────────────────────────────────────────────
  const handleAskForConfirm = async () => {
    if (!selectedChat || !navWorkId || askConfirmLoading) return;

    if (confirmStatusByWork[navWorkId] === 'pending') {
      alert('You have already sent a confirmation request for this work. Please wait for the client to respond.');
      return;
    }

    setAskConfirmLoading(true);
    try {
      await socketService.askForConfirm({
        chatId: selectedChat.id,
        workId: navWorkId,
        workTitle: workTitle || 'this work',
        workerId: userId!,
        workerName: user?.name || 'Worker',
        userId: selectedChat.participants.userId,
      });
      setConfirmStatusByWork(prev => ({ ...prev, [navWorkId]: 'pending' }));
    } catch {
      setSendError('Failed to send confirmation request. Please try again.');
    } finally {
      setAskConfirmLoading(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (selectedChat) socketService.sendTyping(selectedChat.id, !!value.trim());
  };

  const getOtherParticipant = (chat: Chat) =>
    user?.role === 'worker' ? chat.participantDetails?.user : chat.participantDetails?.worker;

  const canSend = !!pendingMedia || !!newMessage.trim();

  // Determine if we have a work context (came from a work details page)
  const hasWorkContext = !!navWorkId && !!selectedChat;

  const workConfirmStatus: ConfirmStatus = navWorkId ? (confirmStatusByWork[navWorkId] ?? 'none') : 'none';
  const workBidStatus: BidStatus = navWorkId ? (bidStatusByWork[navWorkId] ?? 'none') : 'none';

  const alreadySentNewPrice = navWorkId ? sentAskNewPriceRequests.has(navWorkId) : false;
  const alreadySentConfirm = workConfirmStatus === 'pending';
  // Work is fully wrapped up (accepted + paid) -> hide both action buttons entirely.
  const workCompleted = workConfirmStatus === 'paid' || workBidStatus === 'paid';

  // Make Offer only makes sense before a confirm request is pending/accepted,
  // or again after the client has rejected the confirm request.
  const showMakeOffer =
    (workConfirmStatus === 'none' || workConfirmStatus === 'rejected') &&
    (workBidStatus === 'none' || workBidStatus === 'rejected');

  //search chat
  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherParticipant(chat);
    const search = chatSearch.trim().toLowerCase();

    if (!search) return true;

    return (
      otherUser?.name?.toLowerCase().includes(search) ||
      chat.lastMessage?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(120vh-350px)] w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col shrink-0">

        {/* Search */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              type="search"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              placeholder="Search chats"
              className="h-10 rounded-md bg-muted/50 pl-9 pr-3 focus-visible:bg-background"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <Search className="mb-2 size-8 text-muted-foreground/50" />

              <p className="text-sm font-medium text-foreground">
                {chatSearch.trim()
                  ? 'No chats found'
                  : 'No conversations yet'}
              </p>

              {chatSearch.trim() && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Try searching for another name
                </p>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isSelected = selectedChat?.id === chat.id;
              const unread = unreadCounts[chat.id] || 0;

              const profileImage =
                profileImages[chat.participants.userId];

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`cursor-pointer border-b border-border p-4 transition-colors hover:bg-accent ${isSelected ? 'bg-accent' : ''
                    }`}
                >
                  <div className="flex items-center gap-3">

                    {/* Avatar */}
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={otherUser?.name || 'User'}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* User info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate ${unread > 0
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground'
                          }`}
                      >
                        {otherUser?.name || 'Unknown User'}
                      </h3>

                      <p
                        className={`truncate text-sm ${unread > 0
                            ? 'font-medium text-foreground/80'
                            : 'text-muted-foreground'
                          }`}
                      >
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread count */}
                    {unread > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-bold text-background">
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
            {/* Header */}
            <div className="bg-card border-b border-border p-4 flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="lg:hidden p-2 hover:bg-accent rounded-full">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              {(() => {
                const otherUser = getOtherParticipant(selectedChat);
                const profileImage = profileImages[selectedChat.participants.userId];

                return (
                  <>
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="flex items-center gap-3 text-left hover:opacity-80 flex-1 min-w-0"
                    >
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={otherUser?.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : otherUser?.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser?.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-semibold truncate text-foreground">
                          {otherUser?.name || 'Unknown User'}
                        </h3>
                      </div>
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-5 md:px-6 lg:px-8 bg-background">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</div>
              ) : (
                messages.map(msg => {
                  const isSent = msg.senderId === userId;

                  // ── System message ───────────────────────────────────────

                  if (msg.type === 'system') {
                    const payload = parseSystemMessage(msg.content);
                    if (payload) {
                      return (
                        <SystemMessage
                          key={msg.id}
                          payload={payload}
                          isSender={isSent}
                          role="worker"
                          isBidActionable={isBidCardActionable(messages, msg.id)}
                          onBidAccept={(p) =>
                            BidService.respondToBid({ bidId: p.bidId, respondedBy: 'worker', action: 'accept' })
                              .catch(() => setSendError('Failed to accept offer. Please try again.'))
                          }
                          onBidReject={(p) =>
                            BidService.respondToBid({ bidId: p.bidId, respondedBy: 'worker', action: 'reject' })
                              .catch(() => setSendError('Failed to reject offer. Please try again.'))
                          }
                        />
                      );
                    }
                  }

                  // ── Regular message ──────────────────────────────────────
                  return (
                    <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[82%] sm:max-w-[75%] md:max-w-[68%] lg:max-w-[62%] break-words shadow-sm ${isSent
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card border border-border text-foreground rounded-bl-none'
                        }`}>
                        {!isSent && msg.senderDetails && (
                          <div className="text-xs text-muted-foreground mb-1 font-medium">
                            {msg.senderDetails.name}
                          </div>
                        )}
                        {(msg.type === 'image' || msg.type === 'video') && msg.mediaUrl ? (
                          <MediaMessage
                            type={msg.type}
                            mediaUrl={msg.mediaUrl}
                            isSent={isSent}
                            onLoaded={scrollToBottomInstant}
                          />
                        ) : (
                          <p className="leading-relaxed">{msg.content}</p>
                        )}
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
                  <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-none text-sm text-muted-foreground">
                    Typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-card border-t border-border p-4">
              {/* Work Actions */}
              {hasWorkContext && !workCompleted && (
                <div className="mb-3 flex items-center gap-2">
                  {/* Make Offer — hidden once a confirm request is pending or accepted,
                      reappears if the client rejects the confirm request */}
                  {showMakeOffer && (
                    <button
                      type="button"
                      onClick={() => setAskNewPriceModalOpen(true)}
                      disabled={alreadySentNewPrice || askNewPriceLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TicketPercent className="w-4 h-4" />

                      {alreadySentNewPrice
                        ? "Offer Sent"
                        : "Make Offer"}
                    </button>
                  )}

                  {/* Ask Confirm */}

                  <button
                    type="button"
                    onClick={handleAskForConfirm}
                    disabled={
                      alreadySentConfirm ||
                      askConfirmLoading ||
                      workConfirmStatus === 'accepted' ||
                      workBidStatus === 'accepted'
                    }
                    className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HandshakeIcon className="w-4 h-4" />

                    {askConfirmLoading
                      ? "Sending..."
                      : alreadySentConfirm
                        ? "Confirmation Sent"
                        : workConfirmStatus === 'accepted' || workBidStatus === 'accepted'
                          ? "Confirmed"
                          : "Ask Confirm"}
                  </button>

                </div>
              )}
              {sendError && (
                <div className="mb-2 flex items-center justify-between bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-3 py-2">
                  <span>{sendError}</span>
                  <button
                    onClick={() => { setSendError(null); handleSendMessage(); }}
                    className="ml-3 text-destructive font-medium underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {pendingMedia && (
                <div className="mb-2 flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2">
                  {pendingMedia.resourceType === 'image' ? (
                    <img src={pendingMedia.url} alt="preview" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <video src={pendingMedia.url} className="w-12 h-12 rounded object-cover" />
                  )}
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {pendingMedia.resourceType === 'image' ? 'Image ready to send' : 'Video ready to send'}
                  </span>
                  <button onClick={() => setPendingMedia(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
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
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!canSend}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>


      {/* Bid Modal */}
      <AskBetterPriceModal
        open={AskNewPriceModalOpen}
        setAskBetterPriceModalOpen={setAskNewPriceModalOpen}
        chatId={selectedChat?.id || ''}
        workId={navWorkId || ''}
        workTitle={workTitle || ''}
        userId={selectedChat?.participants.userId || ''}
        workerId={userId!}
        workerName={user?.name || 'Worker'}
        currentAmount={Number(currentAmount)}
        onSent={() => setSentAskNewPriceRequests(prev => new Set(prev).add(navWorkId))}
      />

      {selectedChat && (
        <UserProfileModal
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          userId={selectedChat.participants.userId}
        />
      )}

    </div>

  );
}