import React, { useEffect, useState, useCallback } from 'react';
import api from '~/config/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTimeOutline, IoCopyOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';

interface SePayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  orderId: string;
  amount: number;
  onSuccess: () => void;
}

const SePayQRModal: React.FC<SePayQRModalProps> = ({
  isOpen,
  onClose,
  orderCode,
  orderId,
  amount,
  onSuccess
}) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes by default
  const [isExpired, setIsExpired] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  const accountNumber = "5555501082005";
  const accountName = "HOANG QUANG DAT";
  const bankName = "MB Bank";

  const qrUrl = `https://img.vietqr.io/image/970422-${accountNumber}-compact2.png?amount=${amount || 0}&addInfo=${orderCode || ''}&accountName=${encodeURIComponent(accountName)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`, { 
      autoClose: 1500,
      style: { backgroundColor: '#1B4332', color: '#F9F3EA' }
    });
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isOpen && !isExpired) {
      setIsPolling(true);
      intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/api/order/${orderId}`);
          const order = response.data;
          if (['CONFIRMED', 'DELIVERING', 'DELIVERED'].includes(order.status)) {
            clearInterval(intervalId);
            setIsPolling(false);
            onSuccess();
          } else if (order.status === 'CANCELLED') {
             setIsExpired(true);
             clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error polling order status:', err);
        }
      }, 3000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isOpen, orderId, onSuccess, isExpired]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && timeLeft > 0 && !isExpired) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsExpired(true);
    }
    return () => clearInterval(timer);
  }, [isOpen, timeLeft, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#F9F3EA] rounded-[40px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-[#EAE0D5] max-w-2xl w-full relative"
        >
          {/* Header - Phe La Green */}
          <div className="bg-[#1B4332] p-7 text-center relative border-b-4 border-[#4B2C20]/20">
            <h3 className="text-[#F9F3EA] text-2xl font-black uppercase tracking-widest">
              Xác nhận thanh toán
            </h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 bg-[#F9F3EA] rounded-full animate-pulse"></span>
              <p className="text-[#F9F3EA]/80 text-xs font-bold tracking-tight">Vui lòng quét mã QR bên dưới</p>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute right-6 top-7 p-2 bg-white/10 hover:bg-white/20 rounded-full text-[#F9F3EA] transition-all"
            >
              <IoClose size={24} />
            </button>
          </div>

          <div className="p-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left Column: QR & Timer */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group p-3 bg-white rounded-[32px] shadow-sm border-2 border-[#EAE0D5]">
                  <div className={`transition-all duration-500 ${isExpired ? 'grayscale opacity-20 scale-95' : 'opacity-100'}`}>
                    <img 
                      src={qrUrl} 
                      alt="SePay VietQR" 
                      className="w-full aspect-square rounded-2xl"
                    />
                  </div>

                  {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#4B2C20] text-[#F9F3EA] px-6 py-2.5 rounded-full text-sm font-black shadow-2xl border border-white/20">
                        HẾT HẠN
                      </div>
                    </div>
                  )}

                  {/* Corner Marks for and aesthetic feel */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#1B4332] rounded-tl-2xl -ml-1 -mt-1 pointer-events-none opacity-50"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#1B4332] rounded-br-2xl -mr-1 -mb-1 pointer-events-none opacity-50"></div>
                </div>

                {/* Countdown display */}
                <div className={`flex flex-col items-center gap-1 p-4 w-full rounded-3xl border-2 transition-colors ${
                   isExpired ? 'bg-red-50 border-red-200' : 'bg-white border-[#1B4332]/10 shadow-sm'
                }`}>
                   <span className="text-[10px] uppercase font-black text-[#2D1B14]/40 tracking-widest">Thời gian còn lại</span>
                   <div className="flex items-center gap-2">
                      <IoTimeOutline size={20} className={isExpired ? 'text-red-500' : 'text-[#1B4332]'} />
                      <span className={`font-mono text-3xl font-black ${isExpired ? 'text-red-600' : 'text-[#2D1B14]'}`}>
                        {formatTime(timeLeft)}
                      </span>
                   </div>
                </div>
              </div>

              {/* Right Column: High Contrast Details */}
              <div className="space-y-6 flex flex-col justify-center">
                {/* Amount Box - High Contrast White on Cream */}
                <div className="bg-white p-6 rounded-[32px] border-2 border-[#EAE0D5] relative overflow-hidden shadow-sm group hover:border-[#1B4332]/40 transition-all">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-[#1B4332] opacity-[0.03] -mr-10 -mt-10 rounded-full"></div>
                   <p className="text-[11px] text-[#2D1B14]/60 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#4B2C20] rounded-full"></span>
                     Số tiền cẩn trả
                   </p>
                   <div className="flex items-center justify-between">
                     <span className="text-3xl font-black text-[#2D1B14]">
                        {(amount || 0).toLocaleString()} 
                        <span className="text-sm font-bold text-[#2D1B14]/50 ml-1.5">VND</span>
                     </span>
                     <button 
                       onClick={() => copyToClipboard(amount.toString(), 'Số tiền')}
                       className="p-3 bg-[#1B4332] hover:bg-[#4B2C20] text-white rounded-2xl transition-all shadow-md active:scale-95"
                     >
                       <IoCopyOutline size={20} />
                     </button>
                   </div>
                </div>

                {/* Bank Details Area */}
                <div className="space-y-4">
                  <div className="bg-white px-6 py-4 rounded-3xl border-2 border-[#EAE0D5] shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#2D1B14]/50 uppercase font-black tracking-widest mb-1">Tài khoản MB BANK</span>
                        <span className="text-[#2D1B14] font-mono text-xl font-black tracking-widest">{accountNumber}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(accountNumber, 'Số tài khoản')}
                        className="p-2.5 bg-[#F9F3EA] hover:bg-[#4B2C20] text-[#4B2C20] hover:text-white rounded-xl transition-all active:scale-90"
                      >
                        <IoCopyOutline size={18} />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#2D1B14]/60 font-medium mt-1 uppercase">{accountName}</p>
                  </div>

                  <div className="bg-white px-6 py-4 rounded-3xl border-2 border-[#1B4332]/20 shadow-[0_5px_15px_rgba(27,67,50,0.05)]">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#1B4332] uppercase font-black tracking-widest mb-1">Nội dung bắt buộc</span>
                        <span className="text-[#1B4332] text-xl font-black uppercase">{orderCode}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(orderCode, 'Nội dung')}
                        className="p-2.5 bg-[#1B4332] hover:bg-[#4B2C20] text-white rounded-xl transition-all active:scale-90 shadow-sm"
                      >
                        <IoCopyOutline size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white/50 p-4 rounded-3xl border-2 border-dashed border-[#EAE0D5]">
                   <p className="text-[11px] text-[#2D1B14]/70 leading-relaxed font-bold italic">
                     * Lưu ý: Ghi đúng nội dung để đơn hàng được duyệt tự động sau 1 phút.
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="p-6 bg-white/60 border-t border-[#EAE0D5] flex items-center justify-center gap-4">
            {!isExpired ? (
               <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 items-center">
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2.5 h-2.5 bg-green-600 rounded-full" 
                    />
                  </div>
                  <span className="text-[#1B4332] text-[11px] font-black uppercase tracking-[0.2em]">
                    Đang lắng nghe giao dịch...
                  </span>
               </div>
            ) : (
                <div className="flex gap-2 items-center text-red-600">
                    <IoAlertCircleOutline size={20} />
                    <span className="font-black uppercase text-xs">Phiên thanh toán đã kết thúc</span>
                </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


export default SePayQRModal;
