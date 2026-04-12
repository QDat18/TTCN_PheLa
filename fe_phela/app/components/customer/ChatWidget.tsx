// src/main/java/com/example/fe_phela/src/components/chat/ChatWidget.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getChatHistory } from '~/services/chatServices';
import { useAuth, isCustomerUser } from '~/AuthContext';
import { API_BASE_URL } from '~/config/axios';

interface ChatMessage {
    id?: string;
    content?: string;
    senderId: string;
    recipientId: string;
    senderName: string;
    timestamp?: string;
    imageUrl?: string;
    tempId?: string;
}

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }
    }, []);

    const connect = useCallback((currentCustomerId: string) => {
        if (stompClientRef.current && stompClientRef.current.connected) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
            onConnect: () => {
                console.log('Connected to chat server!');
                client.subscribe(`/topic/chat/${currentCustomerId}`, (message) => {
                    const receivedMessage: ChatMessage = JSON.parse(message.body);
                    console.log('Received message:', receivedMessage);

                    setMessages((prev) => {
                        const tempMessageIndex = prev.findIndex(msg => 
                            msg.tempId && 
                            msg.senderId === receivedMessage.senderId &&
                            msg.recipientId === receivedMessage.recipientId &&
                            (
                                (msg.imageUrl && receivedMessage.imageUrl && msg.imageUrl.includes('blob:')) ||
                                (msg.content === receivedMessage.content)
                            )
                        );

                        if (tempMessageIndex > -1) {
                            const newMessages = [...prev];
                            if (newMessages[tempMessageIndex].imageUrl?.startsWith('blob:')) {
                                URL.revokeObjectURL(newMessages[tempMessageIndex].imageUrl!);
                            }
                            newMessages[tempMessageIndex] = {
                                ...receivedMessage,
                                tempId: undefined
                            };
                            return newMessages;
                        }

                        // Kiểm tra trùng lặp với message đã có (dựa trên ID thật)
                        const existingMessageIndex = prev.findIndex(msg => 
                            msg.id === receivedMessage.id && receivedMessage.id
                        );
                        
                        if (existingMessageIndex > -1) {
                            return prev;
                        }

                        return [...prev, receivedMessage];
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
    }, []);

    useEffect(() => {
        if (isOpen && user && isCustomerUser(user)) {
            const customerId = user.customerId;
            const setupChat = async () => {
                try {
                    const history = await getChatHistory(customerId);
                    setMessages(history);
                } catch (error) {
                    console.error("Failed to load chat history", error);
                    setMessages([]);
                }
                connect(customerId);
            };
            setupChat();
        } else {
            disconnect();
        }

        return () => disconnect();
    }, [isOpen, user, connect, disconnect]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!user || !isCustomerUser(user)) {
        return null;
    }

    const { customerId, username: customerName } = user;

    const handleSendMessage = () => {
        if (!stompClientRef.current?.connected) {
            console.warn("STOMP client not connected.");
            return;
        }

        if (!inputValue.trim()) {
            return;
        }

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const chatMessage: ChatMessage = {
            content: inputValue.trim(),
            senderId: customerId,
            senderName: customerName,
            recipientId: 'ADMIN',
            tempId: tempId,
            timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, chatMessage]);
        const messageToSend = {
            content: chatMessage.content,
            senderId: chatMessage.senderId,
            senderName: chatMessage.senderName,
            recipientId: chatMessage.recipientId
        };

        stompClientRef.current.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(messageToSend),
        });
        setInputValue('');
    };

    const handleImageSend = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!user || !isCustomerUser(user)) {
            console.error("User not authenticated or not a customer.");
            return;
        }

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempImageUrl = URL.createObjectURL(file);
    
        const tempMessage: ChatMessage = {
            tempId: tempId,
            content: "",
            senderId: customerId,
            senderName: customerName,
            recipientId: 'ADMIN',
            imageUrl: tempImageUrl,
            timestamp: new Date().toISOString(),
        };
        
        setMessages((prev) => [...prev, tempMessage]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat/uploadImage`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const imageUrl = await response.text();
            console.log("Uploaded image URL:", imageUrl);

            if (stompClientRef.current?.connected) {
                console.log("Sending image message via STOMP");
                const chatMessage = {
                    content: "",
                    senderId: customerId,
                    senderName: customerName,
                    recipientId: 'ADMIN',
                    imageUrl: imageUrl
                };

                stompClientRef.current.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify(chatMessage),
                });
                
                console.log("Image message sent successfully");
            } else {
                console.error("STOMP client not connected");

                setMessages((prev) => prev.map(msg =>
                    msg.tempId === tempId 
                        ? { 
                            ...msg, 
                            content: "Lỗi: Không kết nối được chat server.",
                            imageUrl: undefined,
                            senderName: "Hệ thống" 
                          } 
                        : msg
                ));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setMessages((prev) => prev.map(msg =>
                msg.tempId === tempId 
                    ? { 
                        ...msg, 
                        content: "Lỗi: Không thể tải ảnh lên.",
                        imageUrl: undefined,
                        senderName: "Hệ thống" 
                      } 
                    : msg
            ));
        } finally {
            event.target.value = '';
        }
    };

    return (
        <>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-5 right-5 bg-[#d4a373] text-white p-4 rounded-full shadow-lg z-50 hover:shadow-xl transition-all duration-300 hover:scale-110"
                    style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            ) : (
                <div className="fixed bottom-5 right-5 w-80 h-[28rem] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200 overflow-hidden">
                    <div className="bg-[#d4a373] text-white p-4 flex justify-between items-center rounded-t-lg">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="font-bold text-lg">Hỗ trợ trực tuyến</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {messages.map((msg, index) => (
                            <div key={msg.id || msg.tempId || index} className={`mb-4 flex ${msg.senderId === customerId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs rounded-lg p-3 ${msg.senderId === customerId ? 'bg-[#d4a373] text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}>
                                    <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                                    {msg.imageUrl && (
                                        <div className="mt-2">
                                            <img 
                                                src={msg.imageUrl} 
                                                alt="Chat attachment" 
                                                className="max-w-full h-auto rounded-md"
                                                onError={(e) => {
                                                    console.error("Failed to load image:", msg.imageUrl);
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            {msg.tempId && (
                                                <div className="text-xs opacity-70 mt-1">Đang gửi...</div>
                                            )}
                                        </div>
                                    )}
                                    {msg.timestamp && (
                                        <p className="text-xs opacity-70 mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-white">
                        <div className="flex items-center space-x-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSend}
                                style={{ display: 'none' }}
                                id="chat-image-upload-customer"
                            />
                            <button
                                onClick={() => document.getElementById('chat-image-upload-customer')?.click()}
                                className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
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
                                className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#d4a373] focus:border-transparent"
                                placeholder="Nhập tin nhắn..."
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-[#d4a373] text-white p-2 rounded-lg hover:bg-[#c19266] transition-colors duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;