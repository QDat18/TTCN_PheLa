import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentCancel = () => {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('');
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        setMessage('Bạn đã hủy thanh toán. Đơn hàng vẫn được giữ, bạn có thể thanh toán lại sau.');
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-lg text-center max-w-md">
                <svg className="mx-auto h-16 w-16 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1 className="mt-4 text-2xl font-bold text-gray-800">
                    Thanh toán đã bị hủy
                </h1>
                <p className="mt-2 text-gray-600">{message}</p>
                <div className="mt-6 space-y-3">
                    {orderId && (
                        <Link 
                            to={`/my-orders/${orderId}`} 
                            className="block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Xem đơn hàng
                        </Link>
                    )}
                    <Link 
                        to="/cart" 
                        className="block px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Quay lại giỏ hàng
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
