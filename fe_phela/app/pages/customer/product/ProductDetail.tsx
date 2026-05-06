import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import HeadOrder from '~/components/customer/HeadOrder';
import api from '~/config/axios';
import { useAuth } from '~/AuthContext';
import { ToastContainer, toast } from 'react-toastify';

interface ProductSize {
    productSizeId: string;
    sizeName: string;
    price: number;
}

interface Product {
    productId: string;
    productName: string;
    description: string;
    originalPrice: number;
    imageUrl: string;
    status: string;
    categoryCode: string;
    sizes: ProductSize[];
}

interface Topping {
    productId: string;
    productName: string;
    originalPrice: number;
}

const ProductDetail = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProductAndToppings = async () => {
            try {
                const productResponse = await api.get(`/api/product/get/${productId}`);
                const productData = productResponse.data;
                setProduct(productData);

                if (productData.sizes && productData.sizes.length > 0) {
                    const regularSize = productData.sizes.find((s: ProductSize) =>
                        ['PHÊ', 'REGULAR', 'VỪA', 'MEDIUM'].includes(s.sizeName.toUpperCase())
                    );
                    setSelectedSizeId(regularSize ? regularSize.productSizeId : productData.sizes[0].productSizeId);
                }

                if (productData.categoryCode !== 'TOPPING') {
                    const toppingResponse = await api.get('/api/product/category/TOPPING');
                    setToppings(toppingResponse.data);
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to fetch product details');
                setLoading(false);
                console.error(err);
            }
        };

        if (productId) fetchProductAndToppings();
    }, [productId]);

    const getSelectedSize = () => {
        return product?.sizes?.find(s => s.productSizeId === selectedSizeId);
    };

    const toggleTopping = (toppingId: string) => {
        setSelectedToppingIds(prev =>
            prev.includes(toppingId)
                ? prev.filter(id => id !== toppingId)
                : [...prev, toppingId]
        );
    };

    const calculateCurrentPrice = () => {
        if (!product) return 0;
        const basePrice = getSelectedSize()?.price || product.originalPrice || 0;
        const toppingsPrice = selectedToppingIds.reduce((sum, id) => {
            const topping = toppings.find(t => t.productId === id);
            return sum + (topping?.originalPrice || 0);
        }, 0);
        return basePrice + toppingsPrice;
    };

    const currentPrice = calculateCurrentPrice();

    const addToCart = async () => {
        if (!user || user.type !== 'customer' || !user.customerId) {
            toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', {
                onClick: () => navigate('/login')
            });
            return;
        }

        if (!product) return;

        try {
            const customerId = user.customerId;
            const cartResponse = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
            const cartId = cartResponse.data.cartId;

            if (cartId) {
                const cartItemDTO = {
                    productId: product.productId,
                    productSizeId: selectedSizeId,
                    toppingIds: selectedToppingIds,
                    quantity: quantity,
                    amount: currentPrice * quantity,
                    note: ''
                };
                await api.post(`/api/customer/cart/${cartId}/items`, cartItemDTO);
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Đã thêm sản phẩm vào giỏ hàng');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            toast.error('Không thể thêm sản phẩm vào giỏ hàng');
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-[#FCF8F1]"><div className="w-10 h-10 border-2 border-[#2C1E16]/20 border-t-[#2C1E16] rounded-full animate-spin"></div></div>;
    if (error) return <div className="flex justify-center items-center min-h-screen bg-[#FCF8F1] text-red-500">{error}</div>;
    if (!product) return <div className="flex justify-center items-center min-h-screen bg-[#FCF8F1] text-[#2C1E16]">Không tìm thấy sản phẩm</div>;

    return (
        <div className="min-h-screen bg-[#FCF8F1] text-[#2C1E16] font-sans pb-20">
            <div className="fixed top-0 left-0 w-full bg-[#FCF8F1] border-b border-[#E5D5C5] shadow-sm z-50">
                <HeadOrder />
            </div>

            <div className='max-w-5xl mx-auto px-6 py-12 pt-32'>
                <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
                    {/* Hình ảnh */}
                    <div className="md:w-1/2">
                        <div className="bg-white p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-[#E5D5C5]/50 sticky top-32">
                            <img
                                src={product.imageUrl || 'https://placehold.co/500x500?text=Chua+co+anh'}
                                alt={product.productName || 'Sản phẩm'}
                                className="w-full rounded-lg object-cover aspect-square"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/500x500?text=Chua+co+anh';
                                }}
                            />
                        </div>
                    </div>

                    {/* Chi tiết & Chọn món */}
                    <div className="md:w-1/2 flex flex-col justify-center">
                        <h1 className="text-4xl lg:text-5xl font-black text-[#2C1E16] mb-4 uppercase tracking-tighter">{product.productName}</h1>
                        <p className="text-[#5C4D43] leading-relaxed mb-8 text-sm md:text-base border-b border-[#E5D5C5] pb-8">{product.description}</p>

                        <div className="text-3xl md:text-4xl font-black text-[#8C5A35] mb-10 tracking-tight">
                            {currentPrice.toLocaleString('vi-VN')} ₫
                        </div>

                        {/* Chọn Size */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#5C4D43] mb-4">Chọn Size</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size.productSizeId}
                                            onClick={() => setSelectedSizeId(size.productSizeId)}
                                            className={`px-8 py-3 rounded-md border transition-all text-sm font-bold uppercase tracking-wider ${selectedSizeId === size.productSizeId
                                                    ? 'border-[#8C5A35] bg-[#8C5A35] text-white shadow-lg shadow-[#8C5A35]/20'
                                                    : 'border-[#E5D5C5] bg-white text-[#5C4D43] hover:border-[#8C5A35]/50'
                                                }`}
                                        >
                                            {size.sizeName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chọn Topping */}
                        {toppings.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#5C4D43] mb-4">Topping (Tuỳ chọn)</h3>
                                <div className="flex flex-wrap gap-3">
                                    {toppings.map((topping) => (
                                        <button
                                            key={topping.productId}
                                            onClick={() => toggleTopping(topping.productId)}
                                            className={`px-5 py-2.5 rounded-md border transition-all text-xs font-bold flex items-center gap-2 ${selectedToppingIds.includes(topping.productId)
                                                    ? 'border-[#8C5A35] bg-[#FDF5E6] text-[#8C5A35]'
                                                    : 'border-[#E5D5C5] bg-white text-[#5C4D43] hover:border-[#8C5A35]/40'
                                                }`}
                                        >
                                            {topping.productName} <span className="opacity-60">(+{topping.originalPrice.toLocaleString()}₫)</span>
                                            {selectedToppingIds.includes(topping.productId) && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Số lượng & Nút thêm giỏ hàng */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto pt-8 border-t border-[#E5D5C5]">
                            <div className="flex items-center justify-between border-2 border-[#2C1E16]/10 rounded-md bg-white w-full sm:w-auto">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-5 py-3 hover:bg-[#FDF5E6] transition-colors text-[#2C1E16] font-bold text-lg disabled:opacity-30"
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="px-6 py-3 font-black text-lg text-[#2C1E16] min-w-[60px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-5 py-3 hover:bg-[#FDF5E6] transition-colors text-[#2C1E16] font-bold text-lg"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                className="w-full flex-1 bg-[#2C1E16] text-white py-4 px-6 rounded-md font-black hover:bg-[#8C5A35] transition-all shadow-xl shadow-[#2C1E16]/10 active:scale-95 flex justify-between items-center group"
                                onClick={addToCart}
                            >
                                <span className="group-hover:translate-x-1 transition-transform uppercase tracking-[0.2em] text-xs">Thêm vào giỏ</span>
                                <span className="bg-white/20 px-4 py-1.5 rounded-sm text-sm font-bold tracking-wider">
                                    {(currentPrice * quantity).toLocaleString('vi-VN')} ₫
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-center" autoClose={3000} theme="light" />
        </div>
    );
};

export default ProductDetail;