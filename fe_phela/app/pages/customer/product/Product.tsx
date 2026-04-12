import React, { useState, useEffect, useRef } from 'react';
import Header from '~/components/customer/Header';
import Footer from '~/components/customer/Footer';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '~/AuthContext';
import { FiChevronRight, FiSearch, FiFilter } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import { getPublicCategories } from '~/services/categoryService';
import { getPublicProductsByCategory, getPublicProductById } from '~/services/productService';
import { getCustomerCart, addToCart as addItemToCart } from '~/services/cartService';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '~/components/common/ScrollReveal';

// --- Interfaces ---
interface Product {
    productId: string;
    productName: string;
    description: string;
    originalPrice: number;
    imageUrl: string;
    status: string;
}

interface Category {
    categoryCode: string;
    categoryName: string;
    products: Product[];
}

const Product = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const categoryRefs = useRef<{ [key: string]: HTMLElement }>({});
    const { user } = useAuth();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [activeCategory, setActiveCategory] = useState<string>('');

    useEffect(() => {
        const fetchCategoriesAndProducts = async () => {
            try {
                const categoriesResponse = await getPublicCategories();
                const categoriesData = categoriesResponse.content.filter(
                    (category: { categoryCode: string; categoryName: string }) =>
                        category.categoryCode.toUpperCase() !== 'TOPPING'
                );

                const categoriesWithProducts = await Promise.all(
                    categoriesData.map(async (category: { categoryCode: string; categoryName: string }) => {
                        const productsData = await getPublicProductsByCategory(category.categoryCode);
                        return {
                            categoryCode: category.categoryCode,
                            categoryName: category.categoryName,
                            products: productsData
                        };
                    })
                );

                setCategories(categoriesWithProducts);
                if (categoriesWithProducts.length > 0) setActiveCategory(categoriesWithProducts[0].categoryCode);
                setLoading(false);
            } catch (err) {
                setError('Không thể tải danh mục sản phẩm');
                setLoading(false);
            }
        };

        fetchCategoriesAndProducts();
    }, []);

    const scrollToCategory = (categoryCode: string) => {
        setActiveCategory(categoryCode);
        const element = categoryRefs.current[categoryCode];
        if (element) {
            const offset = 120;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
        }
    };

    const addToCart = async (productId: string) => {
        if (!user || user.type !== 'customer' || !user.customerId) {
            toast.error('Vui lòng đăng nhập để mua hàng');
            return;
        }

        try {
            const product = await getPublicProductById(productId);
            const customerId = user.customerId;
            const cart = await getCustomerCart(customerId);
            if (cart.cartId) {
                const cartItemDTO = {
                    productId: product.productId,
                    quantity: 1,
                    amount: product.originalPrice * 1,
                    note: ''
                };
                await addItemToCart(cart.cartId, cartItemDTO);
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Đã thêm sản phẩm vào túi');
            }
        } catch (err) {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    const getFilteredCategories = () => {
        return categories.map(category => {
            let filteredProducts = category.products.filter(product => {
                const matchSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
                let matchPrice = true;
                if (priceFilter === 'under30') matchPrice = product.originalPrice < 30000;
                else if (priceFilter === '30to50') matchPrice = product.originalPrice >= 30000 && product.originalPrice <= 50000;
                else if (priceFilter === 'over50') matchPrice = product.originalPrice > 50000;
                return matchSearch && matchPrice;
            });

            if (sortBy === 'priceAsc') filteredProducts.sort((a, b) => a.originalPrice - b.originalPrice);
            else if (sortBy === 'priceDesc') filteredProducts.sort((a, b) => b.originalPrice - a.originalPrice);

            return { ...category, products: filteredProducts };
        }).filter(category => category.products.length > 0);
    };

    const filteredCategories = getFilteredCategories();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FCF8F1]">
                <div className="w-10 h-10 border-2 border-[#2C1E16]/20 border-t-[#2C1E16] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF8F1]">
            <Header />

            {/* Banner */}
            <div className="bg-[#2C1E16] py-32 md:py-48 mt-[70px] text-center border-b border-[#2C1E16]/10 relative overflow-hidden">
                <ScrollReveal>
                    <h1 className="text-white text-5xl md:text-[8rem] font-black uppercase tracking-tighter italic leading-none drop-shadow-2xl relative z-10">
                        Thực Đơn <span className="text-[#C2956E]">Phê La</span>
                    </h1>
                    <div className="h-1.5 w-24 bg-[#C2956E] mx-auto mt-10 rounded-full relative z-10"></div>
                </ScrollReveal>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Sidebar Danh mục */}
                    <aside className="lg:w-1/4 sticky top-28 h-fit hidden lg:block bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#E5D5C5]/50">
                        <h3 className="text-[12px] font-black text-[#2C1E16] mb-8 uppercase tracking-[0.5em] border-b-2 border-[#E5D5C5]/50 pb-4">Danh mục</h3>
                        <nav className="space-y-5">
                            {filteredCategories.map((category) => (
                                <button
                                    key={category.categoryCode}
                                    onClick={() => scrollToCategory(category.categoryCode)}
                                    className={`block w-full text-left py-2 px-4 rounded-xl text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeCategory === category.categoryCode
                                            ? 'bg-[#8C5A35] text-white shadow-md shadow-[#8C5A35]/20 translate-x-2'
                                            : 'text-[#5C4D43] hover:bg-[#FDF5E6] hover:text-[#8C5A35]'
                                        }`}
                                >
                                    {category.categoryName} <span className={`ml-2 text-[10px] font-bold ${activeCategory === category.categoryCode ? 'text-white/70' : 'text-[#2C1E16]/30'}`}>/ {category.products.length}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Nội dung chính */}
                    <div className="lg:w-3/4">

                        {/* Thanh Công cụ Bo tròn */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 pb-10 border-b-2 border-[#E5D5C5]/60">
                            {/* Khung search bo tròn */}
                            <div className="relative w-full md:w-96 group bg-white rounded-full px-6 py-1.5 border border-[#E5D5C5] focus-within:border-[#8C5A35] focus-within:shadow-[0_5px_20px_rgba(140,90,53,0.1)] transition-all">
                                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-[#2C1E16]/40 group-focus-within:text-[#8C5A35]" />
                                <input
                                    type="text"
                                    placeholder="TÌM TÊN SẢN PHẨM..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none focus:outline-none pl-8 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#2C1E16] placeholder:text-[#2C1E16]/30"
                                />
                            </div>

                            {/* Khung Filter bo tròn */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 border border-[#E5D5C5] hover:border-[#8C5A35]/50 transition-colors w-full md:w-auto">
                                    <FiFilter className="text-[#2C1E16]/40" />
                                    <select
                                        value={priceFilter}
                                        onChange={(e) => setPriceFilter(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold uppercase tracking-widest text-[#2C1E16] focus:outline-none appearance-none cursor-pointer w-full"
                                    >
                                        <option value="all">MỨC GIÁ</option>
                                        <option value="under30">Dưới 30k</option>
                                        <option value="30to50">30k - 50k</option>
                                        <option value="over50">Trên 50k</option>
                                    </select>
                                </div>
                                <div className="bg-white rounded-full px-5 py-3 border border-[#E5D5C5] hover:border-[#8C5A35]/50 transition-colors w-full md:w-auto">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold uppercase tracking-widest text-[#2C1E16] focus:outline-none appearance-none cursor-pointer w-full"
                                    >
                                        <option value="default">SẮP XẾP</option>
                                        <option value="priceAsc">Giá tăng dần</option>
                                        <option value="priceDesc">Giá giảm dần</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách Sản phẩm */}
                        <AnimatePresence mode="popLayout">
                            {filteredCategories.length === 0 ? (
                                <div className="py-40 text-center bg-white rounded-[2rem] border border-[#E5D5C5]/50">
                                    <h3 className="text-xl font-bold text-[#2C1E16]/30 uppercase tracking-[0.3em]">Không tìm thấy món này</h3>
                                </div>
                            ) : (
                                filteredCategories.map((category) => (
                                    <section
                                        key={category.categoryCode}
                                        ref={(el) => { if (el) categoryRefs.current[category.categoryCode] = el; }}
                                        className="mb-24"
                                    >
                                        <div className="flex items-center gap-6 mb-12">
                                            <h4 className="text-3xl font-black text-[#2C1E16] uppercase tracking-tighter italic">
                                                {category.categoryName}
                                            </h4>
                                            <div className="h-0.5 flex-grow bg-[#E5D5C5]"></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {category.products.map((product) => (
                                                <ScrollReveal key={product.productId}>
                                                    {/* Thẻ Sản phẩm Bo tròn nhiều hơn */}
                                                    <div className="group bg-white flex flex-col h-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(140,90,53,0.15)] transition-all duration-500 relative overflow-hidden rounded-[2rem] border border-[#E5D5C5]/50 hover:-translate-y-2">

                                                        {product.status === 'HOT' && (
                                                            <div className="absolute top-5 left-5 z-10 bg-[#8C5A35] text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-md shadow-[#8C5A35]/30">
                                                                Hot Item
                                                            </div>
                                                        )}

                                                        <Link to={`/san-pham/${product.productId}`} className="block aspect-[4/5] overflow-hidden bg-[#FDF5E6]/50">
                                                            <img
                                                                src={product.imageUrl || 'https://placehold.co/400x500?text=Product'}
                                                                alt={product.productName}
                                                                className="w-full h-full object-cover grayscale-[5%] group-hover:grayscale-0 group-hover:scale-110 transition-transform duration-700 ease-out"
                                                            />
                                                        </Link>

                                                        <div className="p-6 flex flex-col flex-grow text-center">
                                                            <Link to={`/san-pham/${product.productId}`} className="text-[14px] font-bold text-[#2C1E16] uppercase tracking-[0.05em] mb-2 hover:text-[#8C5A35] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                                                                {product.productName}
                                                            </Link>
                                                            <div className="text-lg font-black text-[#8C5A35] mb-6 tracking-tight">
                                                                {product.originalPrice.toLocaleString('vi-VN')}₫
                                                            </div>
                                                            {/* Nút lơ lửng, bo tròn */}
                                                            <button
                                                                onClick={() => addToCart(product.productId)}
                                                                className="mt-auto w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white bg-[#2C1E16] hover:bg-[#8C5A35] rounded-full transition-all duration-300 shadow-md shadow-[#2C1E16]/10 hover:shadow-lg hover:shadow-[#8C5A35]/30 active:scale-95"
                                                            >
                                                                THÊM VÀO TÚI
                                                            </button>
                                                        </div>
                                                    </div>
                                                </ScrollReveal>
                                            ))}
                                        </div>
                                    </section>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Footer />
            <ToastContainer position="bottom-right" theme="light" />
        </div>
    );
};

export default Product;