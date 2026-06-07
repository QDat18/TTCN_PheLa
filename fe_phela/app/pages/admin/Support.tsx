/* fe_phela/app/pages/admin/Support.tsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth, isAdminUser } from '~/AuthContext';
import { 
    getAdminConversations, 
    getConversationMessages, 
    assignConversation as assignConv, 
    resolveConversation as resolveConv 
} from '~/services/chatServices';
import { API_BASE_URL } from '~/config/axios';
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
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    status: 'AI_ACTIVE' | 'HANDOFF_REQUESTED' | 'HUMAN_ACTIVE' | 'RESOLVED';
    source: 'AI' | 'HUMAN' | 'MIXED';
    assignedAdminId?: string;
    assignedAdminName?: string;
    lastMessage?: string;
    lastMessageTimestamp?: string;
}

interface OrderItem {
    productName: string;
    quantity: number;
    amount: number;
}

interface Order {
    orderId: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items?: OrderItem[];
}

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dj9m8q7n8/image/upload/v1712920000/phela_placeholder.png';

const Support = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'RESOLVED'>('ALL');
    const [inputValue, setInputValue] = useState('');
    const [loadingOrders, setLoadingOrders] = useState(false);

    const stompClientRef = useRef<Client | null>(null);
    const globalStompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();

    // Safe helper function to format date times from both LocalDateTime array format and ISO string
    const formatDateTime = (dateVal: any, timeOnly: boolean = false) => {
        if (!dateVal) return '';
        let d: Date;
        if (Array.isArray(dateVal)) {
            const [year, month, day, hour, minute, second] = dateVal;
            // JavaScript Month is 0-indexed
            d = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0);
        } else {
            d = new Date(dateVal);
        }
        
        if (isNaN(d.getTime())) return String(dateVal);
        
        if (timeOnly) {
            return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('vi-VN');
    };

    const parseAiResponse = (content: string) => {
        if (!content) return { text: '', richCards: [] };
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

    const selectedConvRef = useRef<Conversation | null>(null);
    selectedConvRef.current = selectedConv;

    // Fetch conversations list from admin endpoint
    const loadConversations = useCallback(async () => {
        try {
            const list = await getAdminConversations();
            setConversations(list);

            // Keep selected conversation up to date if it matches
            const currentSelected = selectedConvRef.current;
            if (currentSelected) {
                const updated = list.find((c: Conversation) => c.id === currentSelected.id);
                if (updated) {
                    setSelectedConv(updated);
                }
            }
        } catch (err) {
            console.error("Failed to load admin conversations list:", err);
        }
    }, []);

    // Initial load of conversations list
    useEffect(() => {
        if (user && isAdminUser(user)) {
            loadConversations();
        }
    }, [user, loadConversations]);

    // WebSocket subscription for updates
    useEffect(() => {
        if (!user || !isAdminUser(user)) return;

        const token = user.token || localStorage.getItem('token');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
            onConnect: () => {
                console.log('Admin connected to global conversations topic');
                
                // Subscribe to global updates
                client.subscribe('/topic/admin/conversations/update', (msg) => {
                    const updatedConv: Conversation = JSON.parse(msg.body);
                    setConversations(prev => {
                        const index = prev.findIndex(c => c.id === updatedConv.id);
                        if (index > -1) {
                            const next = [...prev];
                            next[index] = updatedConv;
                            return next;
                        }
                        return [updatedConv, ...prev];
                    });

                    // Update selected conversation in real-time
                    setSelectedConv(curr => {
                        if (curr && curr.id === updatedConv.id) {
                            return updatedConv;
                        }
                        return curr;
                    });
                });
            },
            reconnectDelay: 5000,
        });

        client.activate();
        globalStompClientRef.current = client;

        return () => {
            client.deactivate();
            globalStompClientRef.current = null;
        };
    }, [user]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Load selected conversation history & connect individual STOMP topic
    const selectConversation = async (conv: Conversation) => {
        setSelectedConv(conv);
        setMessages([]);
        setOrders([]);

        // Disconnect previous individual STOMP subscription
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }

        try {
            const msgs = await getConversationMessages(conv.id);
            setMessages(msgs);

            // Fetch order history for the customer
            fetchCustomerOrders(conv.customerId);

            // Connect individual topic for real-time messages
            const token = user?.token || localStorage.getItem('token');
            const client = new Client({
                webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
                connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
                onConnect: () => {
                    console.log('Subscribed to individual conversation:', conv.id);
                    client.subscribe(`/topic/conversations/${conv.id}`, (message) => {
                        const receivedMsg: ConversationMessage = JSON.parse(message.body);
                        setMessages((prev) => {
                            const idx = prev.findIndex(m => 
                                (receivedMsg.id && m.id === receivedMsg.id) ||
                                (receivedMsg.tempId && m.tempId === receivedMsg.tempId)
                            );
                            if (idx > -1) {
                                const next = [...prev];
                                next[idx] = receivedMsg;
                                return next;
                            }
                            return [...prev, receivedMsg];
                        });
                    });
                },
                reconnectDelay: 5000,
            });

            client.activate();
            stompClientRef.current = client;
        } catch (err) {
            console.error("Error loading chat history:", err);
            toast.error("Không thể tải lịch sử trò chuyện.");
        }
    };

    // Load recent order history
    const fetchCustomerOrders = async (customerId: string) => {
        setLoadingOrders(true);
        const token = user?.token || localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/order/customer/${customerId}?page=0&size=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.content || []);
            }
        } catch (err) {
            console.error("Error loading order history:", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Send Admin message
    const handleSendMessage = () => {
        if (!selectedConv || !inputValue.trim() || !user || !isAdminUser(user)) return;

        const tempId = `admin_temp_${Date.now()}`;
        const tempMsg: ConversationMessage = {
            tempId,
            senderId: user.username,
            senderName: user.fullname || 'Nhân Viên',
            senderType: 'ADMIN',
            content: inputValue,
            messageType: 'TEXT',
            createdAt: new Date().toISOString()
        };

        // Instant append
        setMessages(prev => [...prev, tempMsg]);
        setInputValue('');

        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: `/app/conversations/${selectedConv.id}/send`,
                body: JSON.stringify(tempMsg)
            });
        } else {
            toast.warn("Kết nối gián đoạn. Vui lòng gửi lại.");
        }
    };

    // Send Image message
    const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConv || !user || !isAdminUser(user)) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }

        const tempId = `admin_temp_${Date.now()}`;
        const tempLocalUrl = URL.createObjectURL(file);
        
        const tempMsg: ConversationMessage = {
            tempId,
            senderId: user.username,
            senderName: user.fullname || 'Nhân Viên',
            senderType: 'ADMIN',
            content: '',
            messageType: 'IMAGE',
            imageUrl: tempLocalUrl,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMsg]);

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
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
                    senderId: user.username,
                    senderName: user.fullname || 'Nhân Viên',
                    senderType: 'ADMIN',
                    content: '',
                    messageType: 'IMAGE',
                    imageUrl: uploadedUrl
                };

                stompClientRef.current.publish({
                    destination: `/app/conversations/${selectedConv.id}/send`,
                    body: JSON.stringify(finalMsg)
                });
            }
        } catch (err) {
            toast.error("Tải ảnh thất bại.");
            setMessages(prev => prev.filter(m => m.tempId !== tempId));
        }
    };

    // Assign to me
    const handleAssign = async () => {
        if (!selectedConv) return;
        try {
            await assignConv(selectedConv.id);
            toast.success("Đã tiếp nhận cuộc trò chuyện này.");
            loadConversations();
        } catch (err) {
            toast.error("Tiếp nhận cuộc trò chuyện thất bại.");
        }
    };

    // Resolve conversation
    const handleResolve = async () => {
        if (!selectedConv) return;
        try {
            await resolveConv(selectedConv.id);
            toast.success("Cuộc trò chuyện đã kết thúc.");
            loadConversations();
        } catch (err) {
            toast.error("Kết thúc cuộc trò chuyện thất bại.");
        }
    };

    // Filter logic
    const filteredConversations = conversations.filter(conv => {
        if (filter === 'PENDING') return conv.status === 'HANDOFF_REQUESTED';
        if (filter === 'ACTIVE') return conv.status === 'HUMAN_ACTIVE';
        if (filter === 'RESOLVED') return conv.status === 'RESOLVED';
        return true; // ALL
    });

    const getStatusText = (status: string) => {
        if (status === 'AI_ACTIVE') return 'AI hoạt động';
        if (status === 'HANDOFF_REQUESTED') return 'Chờ hỗ trợ';
        if (status === 'HUMAN_ACTIVE') return 'Đang hỗ trợ';
        return 'Đã giải quyết';
    };

    const getStatusColor = (status: string) => {
        if (status === 'AI_ACTIVE') return 'bg-blue-100 text-blue-800 border-blue-200';
        if (status === 'HANDOFF_REQUESTED') return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
        if (status === 'HUMAN_ACTIVE') return 'bg-green-100 text-green-800 border-green-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="py-8 bg-[#FCF8F1] min-h-screen">
            <div className="max-w-[1600px] mx-auto px-4">
                <div className="flex gap-6 h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    
                    {/* Left Sidebar: Conversations List */}
                    <aside className="w-96 flex flex-col border-r border-gray-100 bg-white">
                        <div className="p-4 border-b border-gray-100 bg-[#2C1E16] text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="text-xl">⛺</span> Hộp Thư Hỗ Trợ Phê La
                            </h2>
                        </div>

                        {/* Filters Panel */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50 flex gap-1">
                            {['ALL', 'PENDING', 'ACTIVE', 'RESOLVED'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab as any)}
                                    className={`flex-1 text-[11px] font-extrabold py-2 px-1 rounded-lg transition-all ${
                                        filter === tab 
                                        ? 'bg-[#8C5A35] text-white shadow-sm' 
                                        : 'text-[#2C1E16] hover:bg-gray-200'
                                    }`}
                                >
                                    {tab === 'ALL' && 'Tất cả'}
                                    {tab === 'PENDING' && 'Chờ hỗ trợ'}
                                    {tab === 'ACTIVE' && 'Đang hỗ trợ'}
                                    {tab === 'RESOLVED' && 'Đã giải'}
                                </button>
                            ))}
                        </div>

                        {/* Conversations list container */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm font-medium">
                                    Không tìm thấy cuộc trò chuyện nào.
                                </div>
                            ) : (
                                <ul>
                                    {filteredConversations.map(conv => (
                                        <li
                                            key={conv.id}
                                            onClick={() => selectConversation(conv)}
                                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-[#FCF8F1] transition-all relative ${
                                                selectedConv?.id === conv.id ? 'bg-[#FCF8F1] border-l-4 border-l-[#8C5A35]' : ''
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800 text-sm truncate">{conv.customerName}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(conv.status)}`}>
                                                    {getStatusText(conv.status)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 truncate mb-1 font-sans">
                                                {conv.lastMessage ? parseAiResponse(conv.lastMessage).text : 'Chưa có tin nhắn'}
                                            </p>

                                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
                                                <span>Admin: {conv.assignedAdminName || 'Chưa chỉ định'}</span>
                                                {conv.lastMessageTimestamp && (
                                                    <span>{new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </aside>

                    {/* Middle Panel: Active Conversation Window */}
                    <main className="flex-1 flex flex-col bg-[#FCF8F1]/40 border-r border-gray-100">
                        {selectedConv ? (
                            <>
                                {/* Conversation Header */}
                                <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#8C5A35] text-white flex items-center justify-center font-bold text-lg">
                                            {selectedConv.customerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm">Hội thoại: {selectedConv.customerName}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`w-2 h-2 rounded-full ${selectedConv.status === 'RESOLVED' ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`}></span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    {getStatusText(selectedConv.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex gap-2">
                                        {selectedConv.status === 'HANDOFF_REQUESTED' && (
                                            <button
                                                onClick={handleAssign}
                                                className="bg-[#8C5A35] text-white text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-[#2C1E16] shadow-sm transition-all"
                                            >
                                                Tiếp nhận cuộc gọi
                                            </button>
                                        )}
                                        {selectedConv.status !== 'RESOLVED' && (
                                            <button
                                                onClick={handleResolve}
                                                className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-all"
                                            >
                                                Kết thúc phiên
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Messages list log */}
                                <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                                    {messages.map((msg, index) => {
                                        if ((msg.senderType as string) === 'SYSTEM') {
                                            return (
                                                <div key={msg.id || index} className="text-center my-1">
                                                    <span className="bg-gray-200/70 text-gray-600 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                                                        {msg.content}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const isStoreSide = msg.senderType === 'ADMIN' || msg.senderType === 'AI';
                                        const { text, richCards } = parseAiResponse(msg.content);

                                        return (
                                            <div key={msg.id || index} className={`flex ${isStoreSide ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-md rounded-2xl p-3 shadow-sm ${
                                                    isStoreSide 
                                                    ? 'bg-[#8C5A35] text-white rounded-tr-none' 
                                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                                }`}>
                                                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-bold font-sans">
                                                        <span>{msg.senderName}</span>
                                                        {msg.createdAt && (
                                                            <span>{formatDateTime(msg.createdAt, true)}</span>
                                                        )}
                                                    </div>

                                                    {msg.messageType === 'IMAGE' ? (
                                                        <img 
                                                            src={msg.imageUrl} 
                                                            alt="Chat attachment" 
                                                            className="max-w-[240px] max-h-[180px] object-cover rounded-lg mt-1 shadow-inner animate-fade-in"
                                                            onLoad={() => {
                                                                if (messagesContainerRef.current) {
                                                                    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="font-sans">
                                                            <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{text}</p>
                                                            
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
                                                                                                className="ai-card-btn ai-product-btn cursor-default"
                                                                                                disabled
                                                                                            >
                                                                                                Đặc sản Phê La
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
                                                                                                className="ai-card-btn ai-voucher-btn cursor-default"
                                                                                                disabled
                                                                                            >
                                                                                                Mã: {card.code}
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
                                                                                            className="ai-card-btn ai-product-btn mt-4 cursor-default"
                                                                                            disabled
                                                                                        >
                                                                                            Chi nhánh
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
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message inputs panel */}
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="bg-gray-100 text-gray-500 p-3 rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
                                            title="Gửi hình ảnh"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={imageInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageSend}
                                        />

                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#8C5A35] focus:bg-white transition-all font-medium text-gray-800"
                                            placeholder={`Gửi phản hồi tới ${selectedConv.customerName}...`}
                                        />

                                        <button
                                            onClick={handleSendMessage}
                                            className="bg-[#8C5A35] hover:bg-[#2C1E16] text-white p-3 rounded-xl transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                <span className="text-5xl mb-4">⛺</span>
                                <h3 className="text-base font-bold text-gray-600 mb-1">Chưa chọn cuộc hội thoại nào</h3>
                                <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed font-medium">
                                    Vui lòng chọn một cuộc trò chuyện từ danh sách hộp thư bên trái để bắt đầu hỗ trợ khách hàng.
                                </p>
                            </div>
                        )}
                    </main>

                    {/* Right Panel: Customer Profile Details & Order History */}
                    <aside className="w-80 flex flex-col bg-white">
                        {selectedConv ? (
                            <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full">
                                {/* Profile overview */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#8C5A35] uppercase tracking-wider mb-3">Thông Tin Khách Hàng</h4>
                                    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Họ và Tên</div>
                                            <div className="text-xs font-bold text-gray-800">{selectedConv.customerName}</div>
                                        </div>
                                        {selectedConv.customerEmail && (
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">Email</div>
                                                <div className="text-xs font-bold text-gray-800 break-all">{selectedConv.customerEmail}</div>
                                            </div>
                                        )}
                                        {selectedConv.customerPhone && (
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">Số Điện Thoại</div>
                                                <div className="text-xs font-bold text-gray-800">{selectedConv.customerPhone}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assignment details */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#8C5A35] uppercase tracking-wider mb-3">Quản Lý Phân Công</h4>
                                    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-bold text-gray-700">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">Người tiếp nhận:</span>
                                            <span>{selectedConv.assignedAdminName || 'Chưa chỉ định'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold">Nguồn hội thoại:</span>
                                            <span>{selectedConv.source === 'AI' ? 'Trợ lý AI' : selectedConv.source === 'MIXED' ? 'AI + Nhân viên' : 'Nhân viên'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent orders list */}
                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-xs font-bold text-[#8C5A35] uppercase tracking-wider mb-3">Lịch Sử Đơn Hàng Gần Đây</h4>
                                    
                                    {loadingOrders ? (
                                        <div className="text-center py-4 text-xs font-medium text-gray-400 animate-pulse">
                                            Đang tải lịch sử đơn...
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-4 text-xs font-medium text-gray-400">
                                            Chưa có đơn hàng nào.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 overflow-y-auto">
                                            {orders.map(order => (
                                                <div key={order.orderId} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-medium flex flex-col gap-1.5">
                                                    <div className="flex justify-between font-bold">
                                                        <span className="text-gray-700">Mã đơn: #{order.orderId.substring(0, 8)}</span>
                                                        <span className="text-[#8C5A35]">{(order.totalAmount || 0).toLocaleString()}đ</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-gray-400">{formatDateTime(order.createdAt, false)}</span>
                                                        <span className={`px-2 py-0.5 rounded-full border ${
                                                            order.status === 'DELIVERED' 
                                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs font-bold p-6">
                                Chọn một cuộc trò chuyện để xem chi tiết khách hàng
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default Support;