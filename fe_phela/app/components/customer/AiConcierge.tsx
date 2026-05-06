/* fe_phela/app/components/customer/AiConcierge.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '~/config/axios';
import { useAuth, isCustomerUser } from '~/AuthContext';
import { getCustomerCart, addToCart as addItemToCart } from '~/services/cartService';
import { toast } from 'react-toastify';
// Styles are imported in root.tsx via links function to avoid hydration mismatch

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type?: 'text' | 'image' | 'audio' | 'rich';
    mediaUrl?: string;
    richData?: any[];
    handoff?: boolean;
}

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dj9m8q7n8/image/upload/v1712920000/phela_placeholder.png'; // Example placeholder

const AiConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHandoffForm, setShowHandoffForm] = useState(false);
    const [handoffData, setHandoffData] = useState({ fullName: '', email: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi là Phê La AI Concierge. Tôi có thể giúp bạn tìm món đồ uống phù hợp hoặc săn voucher ưu đãi hôm nay!',
            sender: 'bot',
            timestamp: new Date(2024, 0, 1, 0, 0, 0) // Static date for hydration stability
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Multimodal States
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // --- Rich Content Helpers ---
    const parseRichContent = (content: string) => {
        const jsonStartIndex = content.indexOf('[JSON_START]');
        const jsonEndIndex = content.indexOf('[JSON_END]');
        const hasHandoff = content.includes('[HANDOFF]');

        let cleanedText = content.replace('[HANDOFF]', '').trim();
        let richData = null;

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            const jsonStr = content.substring(jsonStartIndex + 12, jsonEndIndex);
            cleanedText = cleanedText.substring(0, cleanedText.indexOf('[JSON_START]')).trim();
            try {
                const parsed = JSON.parse(jsonStr);
                richData = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                console.error("Rich parsing error:", e);
            }
        }

        return { text: cleanedText, richData, handoff: hasHandoff };
    };

    const handleHandoffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(handoffData)
            });
            if (response.ok) {
                toast.success('Hệ thống đã nhận thông tin. Phê La sẽ phản hồi bạn sớm nhất!');
                setShowHandoffForm(false);
                setHandoffData({ fullName: '', email: '', content: '' });
            }
        } catch (error) {
            toast.error('Gửi thông tin thất bại. Bạn vui lòng thử lại sau!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddToCart = async (productId: string, price: number) => {
        if (!user || user.type !== 'customer') {
            toast.error('Vui lòng đăng nhập để mua hàng');
            return;
        }
        try {
            const cart = await getCustomerCart(user.customerId);
            if (cart && cart.cartId) {
                await addItemToCart(cart.cartId, {
                    productId,
                    quantity: 1,
                    amount: price
                });
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Đã thêm vào túi!');
            }
        } catch (err) {
            toast.error('Không thể thêm vào túi lúc này');
        }
    };

    const handleCopyVoucher = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(`Đã copy mã: ${code}`);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() && !selectedImage && !audioBlob) return;

        // Capture current values BEFORE clearing state
        const currentInput = inputValue;
        const currentImage = selectedImage;
        const currentAudio = audioBlob;

        const userMsgId = Date.now().toString();
        const userMsg: Message = {
            id: userMsgId,
            text: currentInput,
            sender: 'user',
            timestamp: new Date(),
            type: currentImage ? 'image' : (currentAudio ? 'audio' : 'text'),
            mediaUrl: currentImage ? URL.createObjectURL(currentImage) : (currentAudio ? URL.createObjectURL(currentAudio) : undefined)
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsRecording(false);
        setIsTyping(true);

        try {
            const formData = new FormData();
            // Use captured value (not the already-cleared state)
            formData.append('message', currentInput.trim() || (currentAudio ? "[Voice Message]" : "[Image Message]"));
            if (currentImage) formData.append('image', currentImage);
            if (currentAudio) formData.append('audio', currentAudio, 'voice.webm');

            // Fix type error: Use helper to safely access customerId
            if (user && isCustomerUser(user)) {
                formData.append('customerId', user.customerId);
            }

            const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
                method: 'POST',
                body: formData
            });

            // Guard: parse JSON only if response is OK and content-type is JSON
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server error ${response.status}: ${errText}`);
            }

            const result = await response.json();

            // Guard: fallback to empty string if both fields are missing
            const rawText: string = result.data ?? result.message ?? '';
            const { text, richData, handoff } = parseRichContent(rawText);

            // Special trigger: If AI added something to cart, refresh the UI cart
            // Keywords: "đã thêm ... vào túi hàng", "giỏ hàng", "size PHÊ" (standard tool confirmation)
            const lowText = text.toLowerCase();
            if (lowText.includes("túi hàng") || lowText.includes("giỏ hàng") || lowText.includes("đã thêm")) {
                window.dispatchEvent(new Event('cartUpdated'));
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: text,
                sender: 'bot',
                timestamp: new Date(),
                type: richData ? 'rich' : 'text',
                richData: richData || undefined,
                handoff: handoff
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Xin lỗi, hệ thống AI đang bận kết nối. Bạn vui lòng thử lại sau nhé!',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setSelectedImage(null);
            setAudioBlob(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // The actual handleSend will be triggered by a'useEffect' or manual click for safety
            // but let's make it intuitive: if we stop recording, we likely want to send.
        }
    };

    // Auto-send when audio is ready
    useEffect(() => {
        if (audioBlob && !isRecording) {
            handleSend();
        }
    }, [audioBlob, isRecording]);

    // Final cleanup for media URLs
    useEffect(() => {
        return () => {
            messages.forEach(msg => {
                if (msg.mediaUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(msg.mediaUrl);
                }
            });
        };
    }, [messages]);

    return (
        <div className="ai-concierge-container">
            {/* FAB Button */}
            <motion.button
                className="ai-fab"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <div className="ai-glow-ring"></div>
                {!isOpen ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2V4" />
                        <rect x="4" y="8" width="16" height="12" rx="2" />
                        <circle cx="9" cy="13" r="1" fill="white" />
                        <circle cx="15" cy="13" r="1" fill="white" />
                        <path d="M9 17h6" />
                        <path d="M2 14h2" />
                        <path d="M20 14h2" />
                    </svg>
                ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-chat-window"
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="ai-chat-header">
                            <div className="ai-header-info">
                                <div className="ai-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 4L4 16H20L12 4Z" stroke="#2C1E16" strokeWidth="2" strokeLinejoin="round" />
                                        <path d="M12 8L7 16H17L12 8Z" fill="#8C5A35" opacity="0.6" />
                                        <path d="M4 20C4 20 8 18 12 18C16 18 20 20 20 20" stroke="#2C1E16" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Phê La AI Concierge</div>
                                    <div className="ai-status">Đang trực tuyến</div>
                                </div>
                            </div>
                        </div>

                        <div className="ai-messages-container">
                            {messages.map(msg => (
                                <div key={msg.id} className={`ai-message ${msg.sender}`}>
                                    {msg.mediaUrl && msg.type === 'image' && (
                                        <img src={msg.mediaUrl} alt="User Upload" className="max-w-full rounded-lg mb-2" />
                                    )}
                                    {msg.mediaUrl && msg.type === 'audio' && (
                                        <audio src={msg.mediaUrl} controls className="w-full h-8 mb-2" />
                                    )}

                                    <div className="ai-text-content">{msg.text}</div>

                                    {msg.type === 'rich' && msg.richData && (
                                        <div className="ai-carousel">
                                            {msg.richData.map((item, idx) => (
                                                <div key={idx} className="ai-card">
                                                    {item.type === 'product' && (
                                                        <>
                                                            <img
                                                                className="ai-product-img"
                                                                src={item.image || PLACEHOLDER_IMAGE}
                                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMAGE)}
                                                                alt={item.name}
                                                            />
                                                            <div className="ai-product-info">
                                                                <div className="ai-product-name">{item.name}</div>
                                                                <div className="ai-product-price">

                                                                    {item.price ? `${Number(String(item.price).replace(/\D/g, '')).toLocaleString()} ₫` : 'Giá: Đang cập nhật'}

                                                                </div>
                                                                <button
                                                                    className="ai-card-btn ai-product-btn"
                                                                    onClick={() => handleAddToCart(item.id, item.price)}
                                                                >
                                                                    Thêm vào túi
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                    {item.type === 'voucher' && (
                                                        <div className="ai-voucher-card flex flex-col h-full">
                                                            <div className="ai-voucher-badge">{item.value}</div>
                                                            <div className="ai-voucher-name">{item.name}</div>
                                                            <div className="ai-voucher-expiry">HSD: {item.endDate}</div>
                                                            <button
                                                                className="ai-card-btn ai-voucher-btn"
                                                                onClick={() => handleCopyVoucher(item.code)}
                                                            >
                                                                Copy mã: {item.code}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.handoff && (
                                        <button
                                            className="ai-handoff-btn"
                                            onClick={() => {
                                                setShowHandoffForm(true);
                                                setHandoffData(prev => ({
                                                    ...prev,
                                                    fullName: '',
                                                    email: '',
                                                    content: `Chào Trạm trưởng, mình cần hỗ trợ về: `
                                                }));
                                            }}
                                        >
                                            <i className="fa-solid fa-headset mr-2"></i>
                                            Gửi lời góp ý cho Trạm trưởng
                                        </button>
                                    )}

                                    <div className="text-[10px] opacity-40 mt-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="ai-typing-indicator">
                                    <div className="ai-dot"></div>
                                    <div className="ai-dot"></div>
                                    <div className="ai-dot"></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {showHandoffForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="ai-handoff-overlay"
                            >
                                <div className="ai-handoff-header">
                                    <span>Hàn huyên cùng Phê La</span>
                                    <button onClick={() => setShowHandoffForm(false)} className="text-white/60 hover:text-white">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <form onSubmit={handleHandoffSubmit} className="ai-handoff-form">
                                    <input
                                        type="text"
                                        placeholder="Tên của người đồng âm..."
                                        required
                                        value={handoffData.fullName}
                                        onChange={e => setHandoffData({ ...handoffData, fullName: e.target.value })}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email để mình phản hồi nhé..."
                                        required
                                        value={handoffData.email}
                                        onChange={e => setHandoffData({ ...handoffData, email: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Điều gì làm bạn chưa hài lòng, hãy chia sẻ cùng mình nhé..."
                                        rows={4}
                                        required
                                        value={handoffData.content}
                                        onChange={e => setHandoffData({ ...handoffData, content: e.target.value })}
                                    />
                                    <button type="submit" disabled={isSubmitting} className="ai-handoff-submit">
                                        {isSubmitting ? 'Đang gửi...' : 'Gửi cho Trạm trưởng'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        <div className="ai-input-area">
                            {selectedImage && (
                                <div className="p-2 mb-2 bg-[#F5F5F7] rounded-lg flex items-center justify-between">
                                    <div className="text-xs truncate max-w-[200px]">{selectedImage.name}</div>
                                    <button onClick={() => setSelectedImage(null)} className="text-[#8C5A35] font-bold">X</button>
                                </div>
                            )}
                            {audioBlob && (
                                <div className="p-2 mb-2 bg-[#F5F5F7] rounded-lg flex items-center justify-between">
                                    <div className="text-xs">Đã ghi âm voice...</div>
                                    <button onClick={() => setAudioBlob(null)} className="text-[#8C5A35] font-bold">X</button>
                                </div>
                            )}
                            <div className="ai-input-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={imageInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => e.target.files && setSelectedImage(e.target.files[0])}
                                />
                                <input
                                    type="text"
                                    className="ai-chat-input"
                                    placeholder={isRecording ? "Đang ghi âm..." : "Hỏi AI về menu hoặc voucher..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    disabled={isRecording}
                                />
                                <div className="ai-input-actions">
                                    <button
                                        className="ai-action-btn"
                                        title="Gửi ảnh"
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`ai-action-btn ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                                        title={isRecording ? "Dừng ghi âm" : "Ghi âm"}
                                        onClick={isRecording ? stopRecording : startRecording}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            <line x1="12" y1="19" x2="12" y2="23" />
                                            <line x1="8" y1="23" x2="16" y2="23" />
                                        </svg>
                                    </button>
                                    <button
                                        className="ai-action-btn"
                                        style={{ color: '#2C1E16' }}
                                        onClick={handleSend}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
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

export default AiConcierge;