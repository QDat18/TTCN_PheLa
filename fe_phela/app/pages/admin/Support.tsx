import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth, isAdminUser } from '~/AuthContext';
import { getConversations, getChatHistory } from '~/services/chatServices';
import { API_BASE_URL } from '~/config/axios';

interface ChatMessage {
    id?: string;
    content?: string; // Có thể null nếu chỉ gửi ảnh
    senderId: string;
    recipientId: string;
    senderName: string;
    timestamp: string;
    imageUrl?: string; // Thêm trường này
}

interface Conversation {
    customerId: string;
    customerName: string;
    messages: ChatMessage[];
    lastMessage?: string;
}

const Support = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const location = useLocation();
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && isAdminUser(user)) {
            const loadInitialConversations = async () => {
                try {
                    const convsSummary = await getConversations();
                    setConversations(prev => {
                        const newConvsMap = new Map(prev);
                        for (const conv of convsSummary) {
                            if (!newConvsMap.has(conv.customerId)) {
                                newConvsMap.set(conv.customerId, {
                                    customerId: conv.customerId,
                                    customerName: conv.customerName,
                                    lastMessage: conv.lastMessage,
                                    messages: [],
                                });
                            }
                        }
                        return newConvsMap;
                    });
                } catch (error) {
                    console.error("Failed to load initial conversations", error);
                }
            };
            loadInitialConversations();

            const client = new Client({
                webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
                onConnect: () => {
                    console.log('Admin connected!');
                    client.subscribe('/topic/chat/**', (message) => {
                        const receivedMessage: ChatMessage = JSON.parse(message.body);
                        // Xác định customerId dựa trên senderId và recipientId
                        const customerId = receivedMessage.senderId !== 'ADMIN' ? receivedMessage.senderId : receivedMessage.recipientId;

                        setConversations(prev => {
                            const newConvs = new Map(prev);
                            const conv = newConvs.get(customerId);
                            if (conv) {
                                // Kiểm tra trùng lặp tin nhắn dựa trên id nếu có
                                if (!receivedMessage.id || !conv.messages.some(msg => msg.id === receivedMessage.id)) {
                                    conv.messages.push(receivedMessage);
                                    conv.lastMessage = receivedMessage.content || receivedMessage.imageUrl ? "Đã gửi ảnh" : ""; // Cập nhật lastMessage
                                }
                            } else {
                                newConvs.set(customerId, {
                                    customerId,
                                    customerName: receivedMessage.senderName, // Lấy tên từ tin nhắn đầu tiên
                                    messages: [receivedMessage],
                                    lastMessage: receivedMessage.content || receivedMessage.imageUrl ? "Đã gửi ảnh" : "",
                                });
                            }
                            // Sắp xếp lại cuộc hội thoại để cuộc hội thoại mới nhất lên đầu
                            return new Map([...newConvs.entries()].sort((a, b) => {
                                const lastMsgA = a[1].messages[a[1].messages.length - 1]?.timestamp;
                                const lastMsgB = b[1].messages[b[1].messages.length - 1]?.timestamp;
                                if (!lastMsgA || !lastMsgB) return 0;
                                return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
                            }));
                        });
                    });
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
                reconnectDelay: 5000,
            });

            client.activate();
            stompClientRef.current = client;

            return () => {
                client.deactivate();
                stompClientRef.current = null;
                console.log('Admin disconnected!');
            };
        }
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations, selectedCustomerId]);

    // Handle automatic selection from notification
    useEffect(() => {
        const customerIdFromState = (location.state as any)?.customerId;
        if (customerIdFromState && conversations.size > 0 && customerIdFromState !== selectedCustomerId) {
            selectConversation(customerIdFromState);
            // Clear state to avoid re-triggering if component re-mounts
            window.history.replaceState({}, document.title);
        }
    }, [location.state, conversations, selectedCustomerId]);

    const selectConversation = async (customerId: string) => {
        setSelectedCustomerId(customerId);
        const currentConv = conversations.get(customerId);
        // Chỉ tải lịch sử nếu cuộc hội thoại chưa có tin nhắn hoặc có lỗi
        if (currentConv && currentConv.messages.length === 0) {
            try {
                const history = await getChatHistory(customerId);
                setConversations(prev => {
                    const newConvs = new Map(prev);
                    const conv = newConvs.get(customerId);
                    if (conv) conv.messages = history;
                    return newConvs;
                });
            } catch (error) {
                console.error("Failed to load chat history for selected conversation", error);
                // Xử lý lỗi, có thể thông báo cho người dùng
            }
        }
    };

    const handleSendMessage = () => {
        if (!user || !isAdminUser(user) || !inputValue.trim() || !selectedCustomerId || !stompClientRef.current?.connected) {
            return;
        }

        const chatMessage: ChatMessage = {
            content: inputValue,
            senderId: 'ADMIN',
            senderName: user.fullname || 'Admin',
            recipientId: selectedCustomerId,
            timestamp: new Date().toISOString(), // Server sẽ ghi đè, nhưng hữu ích cho hiển thị tạm thời
        };

        stompClientRef.current.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(chatMessage),
        });
        setInputValue('');
    };

    const handleImageSend = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!user || !isAdminUser(user) || !selectedCustomerId) {
            console.error("Admin user not authenticated or no customer selected.");
            return;
        }

        // Hiển thị ảnh tạm thời trong UI ngay lập tức
        const tempImageUrl = URL.createObjectURL(file);
        const tempMessage: ChatMessage = {
            id: `temp_${Date.now()}`, // ID tạm thời
            content: "Đang gửi ảnh...",
            senderId: 'ADMIN',
            senderName: user.fullname || 'Admin',
            recipientId: selectedCustomerId,
            imageUrl: tempImageUrl,
            timestamp: new Date().toISOString(),
        };
        setConversations(prev => {
            const newConvs = new Map(prev);
            const conv = newConvs.get(selectedCustomerId);
            if (conv) {
                conv.messages.push(tempMessage);
            }
            return newConvs;
        });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/uploadImage`, { // Cập nhật URL API
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const imageUrl = await response.text(); // Backend trả về URL từ Cloudinary
            console.log("Uploaded image URL:", imageUrl);

            if (stompClientRef.current?.connected) {
                const chatMessage: ChatMessage = {
                    content: "",
                    senderId: 'ADMIN',
                    senderName: user.fullname || 'Admin',
                    recipientId: selectedCustomerId,
                    imageUrl: imageUrl, // Sử dụng URL từ Cloudinary
                    timestamp: new Date().toISOString(),
                };
                stompClientRef.current.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify(chatMessage),
                });
            }
            // Xóa ảnh tạm thời sau khi gửi thành công
            setConversations(prev => {
                const newConvs = new Map(prev);
                const conv = newConvs.get(selectedCustomerId);
                if (conv) {
                    conv.messages = conv.messages.filter(msg => msg.id !== tempMessage.id);
                }
                return newConvs;
            });


        } catch (error) {
            console.error("Error uploading image for admin:", error);
            // Xóa tin nhắn tạm thời và hiển thị lỗi
            setConversations(prev => {
                const newConvs = new Map(prev);
                const conv = newConvs.get(selectedCustomerId);
                if (conv) {
                    conv.messages = conv.messages.filter(msg => msg.id !== tempMessage.id);
                    conv.messages.push({
                        id: `error_${Date.now()}`,
                        content: "Gửi ảnh thất bại.",
                        senderId: 'SYSTEM',
                        senderName: "Hệ thống",
                        recipientId: selectedCustomerId,
                        timestamp: new Date().toISOString(),
                    });
                }
                return newConvs;
            });
        } finally {
            event.target.value = ''; // Reset input file
        }
    };

    const selectedConversation = selectedCustomerId ? conversations.get(selectedCustomerId) : null;

    return (
        <div className="py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar - Danh sách hội thoại */}
                        <aside className="w-80 border-r border-gray-200 bg-white overflow-y-auto shadow-sm">
                            <div className="p-4 border-b border-gray-200 bg-[#d4a373] text-white">
                                <h2 className="text-xl font-bold flex items-center space-x-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <span>Cuộc hội thoại</span>
                                </h2>
                            </div>
                            <ul>
                                {Array.from(conversations.values()).map(conv => (
                                    <li
                                        key={conv.customerId}
                                        onClick={() => selectConversation(conv.customerId)}
                                        className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-[#f8f1e9] transition-colors duration-200 ${
                                            selectedCustomerId === conv.customerId ? 'bg-[#f8f1e9] border-l-4 border-l-[#d4a373]' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-gray-800">{conv.customerName}</p>
                                            {conv.lastMessage && conv.messages.length > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(conv.messages[conv.messages.length - 1]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate mt-1">{conv.lastMessage}</p>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        {/* Main chat area */}
                        <main className="flex-1 flex flex-col bg-white">
                            {selectedConversation ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 bg-[#f8f1e9]">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-[#d4a373] text-white p-2 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-800">Chat với {selectedConversation.customerName}</h2>
                                                <p className="text-xs text-gray-500">Đang hoạt động</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto bg-[#faf6f2]">
                                        {selectedConversation.messages.map((msg, index) => (
                                            <div
                                                key={msg.id || index}
                                                className={`mb-4 flex ${msg.senderId === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-lg rounded-lg p-3 ${
                                                    msg.senderId === 'ADMIN'
                                                        ? 'bg-[#d4a373] text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-semibold">{msg.senderName}</p>
                                                        <span className="text-xs opacity-80">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                                                    {msg.imageUrl && (
                                                        <img src={msg.imageUrl} alt="Chat attachment" className="max-w-full h-auto rounded-md mt-2" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSend}
                                                style={{ display: 'none' }}
                                                id="chat-image-upload-admin" // ID duy nhất
                                            />
                                            <button
                                                onClick={() => document.getElementById('chat-image-upload-admin')?.click()}
                                                className="bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                                title="Gửi ảnh"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <input
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#d4a373] focus:border-transparent"
                                                placeholder={`Nhắn tin cho ${selectedConversation.customerName}...`}
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                className="bg-[#d4a373] text-white p-3 rounded-lg hover:bg-[#c19266] transition-colors duration-200"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="text-xl font-medium mb-2">Không có cuộc hội thoại nào được chọn</h3>
                                    <p className="text-center max-w-md">Vui lòng chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trò chuyện.</p>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;