/* fe_phela/app/components/customer/UnifiedSupportWidget.tsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth, isCustomerUser } from '~/AuthContext';
import { API_BASE_URL } from '~/config/axios';
import { getCustomerCart, addToCart as addItemToCart } from '~/services/cartService';
import { toast } from 'react-toastify';

interface ConversationMessage {
    id?: string;
    conversationId?: string;
    senderId: string;
    senderName: string;
    senderType: 'CUSTOMER' | 'ADMIN' | 'AI' | 'SYSTEM';
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'PRODUCT_CARD' | 'VOUCHER_CARD' | 'SYSTEM';
    imageUrl?: string;
    metadataJson?: string;
    createdAt?: string;
    tempId?: string;
}

interface Conversation {
    id: string;
    customerId: string;
    status: 'AI_ACTIVE' | 'HANDOFF_REQUESTED' | 'HUMAN_ACTIVE' | 'RESOLVED';
    source: 'AI' | 'HUMAN' | 'MIXED';
    assignedAdminId?: string;
    assignedAdminName?: string;
}

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dj9m8q7n8/image/upload/v1712920000/phela_placeholder.png';

const UnifiedSupportWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const isOpenRef = useRef(isOpen);
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Initial setup: fetch or create active conversation
    useEffect(() => {
        if (!user || !isCustomerUser(user)) return;

        const token = user.token || localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_BASE_URL}/api/conversations/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.status === 404) {
                // If not found, create new
                return fetch(`${API_BASE_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json());
            }
            return res.json();
        })
        .then((conv: Conversation) => {
            setConversation(conv);
            // Fetch messages
            return fetch(`${API_BASE_URL}/api/conversations/${conv.id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        })
        .then(res => res?.json())
        .then((msgs: ConversationMessage[]) => {
            if (msgs) {
                setMessages(msgs);
            }
        })
        .catch(err => console.error("Error loading chat context:", err));
    }, [user]);

    // WebSocket STOMP Connection
    const connectWebSocket = useCallback((convId: string) => {
        if (stompClientRef.current && stompClientRef.current.connected) return;

        const token = user?.token || localStorage.getItem('token');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
            onConnect: () => {
                console.log('STOMP connected successfully to conversation room:', convId);
                
                // Subscribe to conversation messages
                client.subscribe(`/topic/conversations/${convId}`, (message) => {
                    const receivedMsg: ConversationMessage = JSON.parse(message.body);
                    
                    setMessages((prev) => {
                        // De-duplicate temporary messages sent by this client
                        const tempIndex = prev.findIndex(m => m.tempId && m.tempId === receivedMsg.tempId);
                        if (tempIndex > -1) {
                            const updated = [...prev];
                            updated[tempIndex] = receivedMsg;
                            return updated;
                        }
                        
                        // Check duplicate via real ID
                        if (receivedMsg.id && prev.some(m => m.id === receivedMsg.id)) {
                            return prev;
                        }
                        
                        return [...prev, receivedMsg];
                    });

                    // Manage unread badge when minimized
                    if (!isOpenRef.current && receivedMsg.senderType !== 'CUSTOMER') {
                        setUnreadCount(c => c + 1);
                    }

                    // Turn off typing indicator when bot/agent replies
                    if (receivedMsg.senderType !== 'CUSTOMER') {
                        setIsTyping(false);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP protocol error:', frame.headers['message']);
            },
            reconnectDelay: 5000,
        });

        client.activate();
        stompClientRef.current = client;
    }, [user]);

    // Connect WebSocket once conversation is resolved
    useEffect(() => {
        if (conversation?.id) {
            connectWebSocket(conversation.id);
        }
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [conversation?.id, connectWebSocket]);

    // Handle incoming messages read status
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Scroll to bottom
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Send text message
    const handleSend = async (textToSend?: string) => {
        const text = (textToSend || inputValue).trim();
        if (!text || !conversation || !user || !isCustomerUser(user)) return;

        if (!textToSend) {
            setInputValue('');
        }

        const tempId = `temp_${Date.now()}`;
        const tempMsg: ConversationMessage = {
            tempId,
            senderId: user.customerId,
            senderName: user.fullname || user.username,
            senderType: 'CUSTOMER',
            content: text,
            messageType: 'TEXT',
            createdAt: new Date().toISOString()
        };

        // Instantly append to messages
        setMessages(prev => [...prev, tempMsg]);

        // Publish over WebSocket
        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: `/app/conversations/${conversation.id}/send`,
                body: JSON.stringify(tempMsg)
            });

            // If active conversation status is AI, show a typing indicator for AI delay
            if (conversation.status === 'AI_ACTIVE') {
                setIsTyping(true);
            }
        } else {
            toast.warn("Kết nối gián đoạn. Đang thiết lập lại...");
        }
    };

    // Send Image file
    const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversation || !user || !isCustomerUser(user)) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước tệp không được vượt quá 5MB");
            return;
        }

        const tempId = `temp_${Date.now()}`;
        const tempLocalUrl = URL.createObjectURL(file);
        
        const tempMsg: ConversationMessage = {
            tempId,
            senderId: user.customerId,
            senderName: user.fullname || user.username,
            senderType: 'CUSTOMER',
            content: '',
            messageType: 'IMAGE',
            imageUrl: tempLocalUrl,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMsg]);

        const formData = new FormData();
        formData.append('file', file);

        const token = user?.token || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/uploadImage`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");
            const uploadedUrl = await res.text();

            if (stompClientRef.current?.connected) {
                const finalMsg: ConversationMessage = {
                    tempId,
                    senderId: user.customerId,
                    senderName: user.fullname || user.username,
                    senderType: 'CUSTOMER',
                    content: '',
                    messageType: 'IMAGE',
                    imageUrl: uploadedUrl
                };

                stompClientRef.current.publish({
                    destination: `/app/conversations/${conversation.id}/send`,
                    body: JSON.stringify(finalMsg)
                });
            }
        } catch (err) {
            toast.error("Tải ảnh lên thất bại");
            setMessages(prev => prev.filter(m => m.tempId !== tempId));
        }
    };

    // Trigger human agent handoff
    const handleRequestHandoff = async () => {
        if (!conversation) return;
        const token = user?.token || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/conversations/${conversation.id}/handoff`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedConv = await res.json();
                setConversation(updatedConv);
                toast.info("Đã chuyển kết nối tới nhân viên tư vấn.");
            }
        } catch (err) {
            toast.error("Yêu cầu chuyển hỗ trợ thất bại");
        }
    };

    // Add product to cart helper
    const handleAddToCart = async (productId: string, price: number) => {
        if (!user || !isCustomerUser(user)) return;
        try {
            const cart = await getCustomerCart(user.customerId);
            if (cart?.cartId) {
                await addItemToCart(cart.cartId, {
                    productId,
                    quantity: 1,
                    amount: price
                });
                toast.success("Đã thêm món size PHÊ vào giỏ hàng!");
            }
        } catch (err) {
            toast.error("Không thể thêm vào giỏ hàng");
        }
    };

    // Copy voucher code helper
    const handleCopyVoucher = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã sao chép mã: ${code}`);
    };

    // Parser for JSON strings returned in AI responses
    const parseAiResponse = (content: string) => {
        const jsonStartIndex = content.indexOf('[JSON_START]');
        const jsonEndIndex = content.indexOf('[JSON_END]');
        
        let cleanedText = content;
        let richCards: any[] = [];

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            const jsonStr = content.substring(jsonStartIndex + 12, jsonEndIndex);
            cleanedText = content.substring(0, jsonStartIndex).trim();
            try {
                const parsed = JSON.parse(jsonStr);
                richCards = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                console.error("Error parsing card JSON:", e);
            }
        }
        return { text: cleanedText, richCards };
    };

    // Quick Replies list
    const quickReplies = [
        "Gợi ý đồ uống đặc sản ☕",
        "Có ưu đãi voucher nào không? 🎫",
        "Tìm chi nhánh gần nhất 📍",
        "Hỗ trợ trực tiếp từ nhân viên 👤"
    ];

    const handleQuickReply = (reply: string) => {
        if (reply.includes("Hỗ trợ trực tiếp")) {
            handleRequestHandoff();
        } else {
            handleSend(reply);
        }
    };

    // Filter messages for search feature
    const filteredMessages = messages.filter(m => 
        m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeMessages = searchTerm ? filteredMessages : messages;

    return (
        <div className="ai-concierge-container">
            {/* Float Action Button */}
            <motion.button 
                className="ai-fab" 
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <div className="ai-glow-ring"></div>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
                {/* Camping lantern icon representing Phê La style */}
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </motion.button>

            {/* Chat Box Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="ai-chat-window"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                    >
                        {/* Header */}
                        <div className="ai-chat-header">
                            <div className="ai-header-info">
                                <div className="ai-avatar">
                                    <span className="text-white text-xs font-black">⛺</span>
                                </div>
                                <div>
                                    <div className="text-white text-sm font-bold m-0">Trạm Trợ Lý Phê La</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                        <span className="text-[10px] uppercase tracking-wider text-green-300 font-bold">
                                            {conversation?.status === 'AI_ACTIVE' ? 'Trợ lý AI' : 'Nhân viên hỗ trợ'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Search and close controls */}
                            <div className="flex items-center gap-3">
                                <button 
                                    className="text-white/70 hover:text-white transition-colors"
                                    onClick={() => {
                                        setShowSearch(!showSearch);
                                        if (showSearch) setSearchTerm('');
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                                <button 
                                    className="text-white/70 hover:text-white transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Search bar integration */}
                        {showSearch && (
                            <div className="bg-[#2C1E16]/95 p-3 flex gap-2 border-t border-white/10">
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm nội dung tin nhắn..."
                                    className="flex-1 bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs outline-none border border-white/20 focus:border-[#D2B48C]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Messages Area */}
                        <div ref={messagesContainerRef} className="ai-messages-container">
                            {activeMessages.map((msg, index) => {
                                if ((msg.senderType as string) === 'SYSTEM') {
                                    return (
                                        <div key={msg.id || index} className="text-center my-2">
                                            <span className="bg-[#E5D5C5]/40 text-[#2C1E16] text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }

                                const isBot = msg.senderType !== 'CUSTOMER';
                                const { text, richCards } = parseAiResponse(msg.content);

                                return (
                                    <div key={msg.id || index} className={`ai-message ${isBot ? 'bot' : 'user'}`}>
                                        {msg.messageType === 'IMAGE' ? (
                                            <div className="rounded-lg overflow-hidden max-w-xs">
                                                <img 
                                                    src={msg.imageUrl || PLACEHOLDER_IMAGE} 
                                                    alt="Tệp gửi lên"
                                                    className="max-w-full h-auto object-cover" 
                                                    onLoad={() => {
                                                        if (messagesContainerRef.current) {
                                                            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="m-0 leading-relaxed font-medium">{text}</p>
                                                
                                                {richCards.length > 0 && (
                                                    <div className="ai-carousel mt-3">
                                                        {richCards.map((card, idx) => {
                                                            const isProduct = card.type === 'product';
                                                            const isVoucher = card.type === 'voucher';
                                                            const isBranch = card.type === 'branch';

                                                            return (
                                                                <div key={idx} className={`ai-card ${isVoucher ? 'ai-voucher-card' : ''}`}>
                                                                    {isProduct && (
                                                                        <>
                                                                            <img 
                                                                                src={card.image || PLACEHOLDER_IMAGE} 
                                                                                alt={card.name} 
                                                                                className="ai-product-img"
                                                                            />
                                                                            <div className="ai-product-info text-[#2C1E16]">
                                                                                <span className="ai-product-name">{card.name}</span>
                                                                                <span className="ai-product-price">{(card.price || 0).toLocaleString()}đ</span>
                                                                                <button 
                                                                                    className="ai-card-btn ai-product-btn"
                                                                                    onClick={() => handleAddToCart(card.id, card.price)}
                                                                                >
                                                                                    Đặt món ngay
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {isVoucher && (() => {
                                                                        const val = card.value || card.discount;
                                                                        const exp = card.endDate || card.expiry || 'Vô thời hạn';
                                                                        let displayVal = 'Ưu đãi';
                                                                        if (val) {
                                                                            if (typeof val === 'number') {
                                                                                displayVal = val >= 1000 ? `${(val / 1000)}k` : `${val}%`;
                                                                            } else {
                                                                                displayVal = String(val);
                                                                            }
                                                                        }
                                                                        return (
                                                                            <>
                                                                                <div className="ai-voucher-badge text-[#C2956E]">
                                                                                    {displayVal}
                                                                                </div>
                                                                                <div className="ai-voucher-name text-white">{card.name || card.description}</div>
                                                                                <div className="ai-voucher-expiry text-white/50">HSD: {exp}</div>
                                                                                <button 
                                                                                    className="ai-card-btn ai-voucher-btn"
                                                                                    onClick={() => handleCopyVoucher(card.code)}
                                                                                >
                                                                                    Lưu mã: {card.code}
                                                                                </button>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                    {isBranch && (
                                                                        <div className="flex flex-col h-full p-4 bg-[#FCF8F1] justify-between flex-grow text-[#2C1E16]">
                                                                            <div className="flex flex-col gap-2">
                                                                                <div className="w-10 h-10 rounded-full bg-[#8C5A35]/10 text-[#8C5A35] flex items-center justify-center text-lg self-center mb-1">
                                                                                    📍
                                                                                </div>
                                                                                <div className="font-extrabold text-xs text-center line-clamp-2 min-h-[32px] leading-tight">
                                                                                    {card.name}
                                                                                </div>
                                                                                <div className="text-[10px] text-gray-500 text-center line-clamp-3 min-h-[42px] leading-normal font-medium">
                                                                                    {card.address}
                                                                                </div>
                                                                            </div>
                                                                            <button 
                                                                                className="ai-card-btn ai-product-btn mt-4 cursor-pointer"
                                                                                onClick={() => window.open('/he-thong-cua-hang', '_blank')}
                                                                            >
                                                                                Bản đồ
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="ai-typing-indicator">
                                    <div className="ai-dot"></div>
                                    <div className="ai-dot"></div>
                                    <div className="ai-dot"></div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies chips */}
                        <div className="px-4 py-2 bg-white flex gap-1.5 overflow-x-auto scrollbar-none border-t border-gray-50">
                            {quickReplies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    className="flex-shrink-0 bg-[#FCF8F1] border border-[#E5D5C5] text-[#2C1E16] text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-[#2C1E16] hover:text-white transition-all"
                                    onClick={() => handleQuickReply(reply)}
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        {/* Input Controls */}
                        <div className="ai-input-area">
                            <div className="ai-input-container">
                                <input 
                                    type="text" 
                                    placeholder="Hỏi trợ lý Phê La hoặc nhắn nhân viên..."
                                    className="ai-chat-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <div className="ai-input-actions">
                                    {/* Upload Image button */}
                                    <button 
                                        className="ai-action-btn"
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={imageInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageSend}
                                    />
                                    
                                    {/* Handoff trigger */}
                                    {conversation?.status === 'AI_ACTIVE' && (
                                        <button 
                                            className="ai-action-btn"
                                            title="Yêu cầu nhân viên hỗ trợ"
                                            onClick={handleRequestHandoff}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Send button */}
                                    <button 
                                        className="ai-action-btn"
                                        onClick={() => handleSend()}
                                    >
                                        <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UnifiedSupportWidget;
