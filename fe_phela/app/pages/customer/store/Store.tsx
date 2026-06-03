import React, { useState, useEffect, useMemo } from 'react';
import Header from '~/components/customer/Header';
// Bỏ import Footer vì trang dạng Map Locator không dùng Footer
import { getPublicBranches } from '~/services/branchService';
import { FiMapPin, FiPhone, FiSearch, FiChevronRight, FiNavigation } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '~/AuthContext';

interface Branch {
    branchCode: string;
    branchName: string;
    latitude: number;
    longitude: number;
    city: string;
    district: string;
    address: string;
    status: string;
    openingTime?: string;
    closingTime?: string;
}

const useMapComponents = () => {
    const [mapComponents, setMapComponents] = useState<{
        MapContainer?: any; TileLayer?: any; Marker?: any; useMapEvents?: any; L?: any;
    }>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-leaflet'),
                import('leaflet'),
                import('leaflet/dist/leaflet.css'),
            ]).then(([{ MapContainer, TileLayer, Marker, useMapEvents }, L]) => {
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                });
                setMapComponents({ MapContainer, TileLayer, Marker, useMapEvents, L });
            });
        }
    }, []);
    return mapComponents;
};

const Store = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCity, setActiveCity] = useState<string>('Tất cả');
    const { MapContainer, TileLayer, Marker, L } = useMapComponents();
    const { user } = useAuth();

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await getPublicBranches();
                setBranches(branchesData);
                if (branchesData.length > 0) setSelectedBranch(branchesData[0]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching branches:', error);
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const mapKey = useMemo(() => selectedBranch ? `${selectedBranch.branchCode}-${selectedBranch.latitude}` : 'none', [selectedBranch]);

    const filteredBranches = useMemo(() => {
        return branches.filter(branch => {
            const matchesSearch = branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                branch.address.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCity = activeCity === 'Tất cả' || branch.city === activeCity;
            return matchesSearch && matchesCity;
        });
    }, [branches, searchTerm, activeCity]);

    const cities = useMemo(() => ['Tất cả', ...new Set(branches.map(b => b.city))], [branches]);

    const isOpen = (branch: Branch | null) => {
        if (!branch || !branch.openingTime || !branch.closingTime) {
            const hour = new Date().getHours();
            return hour >= 7 && hour < 23;
        }
        try {
            const [openH, openM] = branch.openingTime.split(':').map(Number);
            const [closeH, closeM] = branch.closingTime.split(':').map(Number);
            const now = new Date();
            const openTime = new Date(now);
            openTime.setHours(openH, openM, 0, 0);
            const closeTime = new Date(now);
            closeTime.setHours(closeH, closeM, 0, 0);
            return now >= openTime && now < closeTime;
        } catch (e) {
            const hour = new Date().getHours();
            return hour >= 7 && hour < 23;
        }
    };

    const customIcon = useMemo(() => {
        if (!L) return null;
        return new L.DivIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #8C5A35; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 15px rgba(140, 90, 53, 0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
    }, [L]);

    const MapView = () => {
        if (!MapContainer || !TileLayer || !selectedBranch || !Marker) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#2C1E16]/20 bg-[#FCF8F1]">
                    <div className="w-12 h-12 border-2 border-[#8C5A35]/20 border-t-[#8C5A35] rounded-full animate-spin mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Đang chuẩn bị bản đồ...</p>
                </div>
            );
        }

        return (
            <MapContainer
                key={mapKey}
                center={[selectedBranch.latitude, selectedBranch.longitude]}
                zoom={15} zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='© CARTO' />
                {filteredBranches.map(branch => (
                    <Marker
                        key={branch.branchCode} position={[branch.latitude, branch.longitude]} icon={customIcon}
                        eventHandlers={{ click: () => setSelectedBranch(branch) }}
                    />
                ))}
            </MapContainer>
        );
    };

    return (
        // 1. ROOT WRAPPER: Khóa chặt bằng h-screen và overflow-hidden
        <div className="h-screen w-full bg-[#FCF8F1] flex flex-col overflow-hidden selection:bg-[#8C5A35] selection:text-white">

            <Header />

            {/* 2. MAIN: Tự động chiếm phần diện tích còn lại sau Header */}
            <main className="flex-1 flex flex-col pt-[60px] lg:pt-[70px] overflow-hidden">
                <div className="flex-1 flex flex-col-reverse lg:flex-row overflow-hidden relative">

                    {/* --- LEFT SIDEBAR --- */}
                    <div className="w-full h-[55%] lg:h-full lg:w-[480px] bg-white flex flex-col flex-shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-2xl overflow-hidden rounded-t-[2rem] lg:rounded-none -mt-6 lg:mt-0 transition-all duration-300">

                        {/* Mobile Handle */}
                        <div className="w-full flex flex-shrink-0 justify-center pt-3 pb-1 lg:hidden">
                            <div className="w-12 h-1.5 bg-[#E5D5C5]/50 rounded-full"></div>
                        </div>

                        {/* Static Header Section (Search & Filter) */}
                        <div className="flex-shrink-0 p-5 lg:p-8 pb-3 lg:pb-4 space-y-4 lg:space-y-6 border-b border-[#E5D5C5]/20">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-black text-[#2C1E16] uppercase tracking-tighter leading-none italic">
                                        Hệ thống <br />
                                        <span className="text-[#C2956E] not-italic">Cửa hàng</span>
                                    </h1>
                                    <div className="h-1 w-8 lg:w-12 bg-[#8C5A35] mt-3 lg:mt-4 rounded-full"></div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] lg:text-[10px] font-black text-[#8C5A35] uppercase tracking-[0.2em] mb-1">Cập nhật</p>
                                    <p className="text-xs font-bold text-[#2C1E16]">{branches.length} Chi nhánh</p>
                                </div>
                            </motion.div>

                            <div className="space-y-3 lg:space-y-4">
                                <div className="relative group">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C1E16]/30 group-focus-within:text-[#8C5A35] transition-colors" />
                                    <input
                                        type="text" placeholder="Tìm theo địa chỉ, tên quận..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 lg:py-4 bg-[#FCF8F1] border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#8C5A35]/10 focus:outline-none transition-all placeholder:text-[#2C1E16]/20"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {cities.map(city => (
                                        <button
                                            key={city} onClick={() => setActiveCity(city)}
                                            className={`px-4 lg:px-6 py-2 lg:py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-2 ${activeCity === city
                                                ? 'bg-[#2C1E16] border-[#2C1E16] text-[#FDF5E6] shadow-lg shadow-[#2C1E16]/10'
                                                : 'bg-white border-[#E5D5C5]/30 text-[#2C1E16]/50 hover:border-[#8C5A35] hover:text-[#8C5A35]'
                                                }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. SCROLLABLE LIST: flex-1 + min-h-0 giải quyết triệt để lỗi bung Flexbox */}
                        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-4 lg:px-6 py-4">
                            <AnimatePresence>
                                {loading ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center">
                                        <div className="w-8 h-8 border-2 border-[#8C5A35]/10 border-t-[#8C5A35] rounded-full animate-spin mx-auto mb-4"></div>
                                    </motion.div>
                                ) : filteredBranches.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center border-2 border-dashed border-[#E5D5C5] rounded-[2rem]">
                                        <FiSearch className="mx-auto text-3xl text-[#E5D5C5] mb-4" />
                                        <p className="text-[10px] font-black text-[#2C1E16]/40 uppercase tracking-widest leading-relaxed">
                                            Không tìm thấy cửa hàng
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-4 pb-20 lg:pb-6">
                                        {filteredBranches.map((branch, index) => (
                                            <motion.button
                                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                                key={branch.branchCode} onClick={() => setSelectedBranch(branch)}
                                                className={`w-full text-left p-4 lg:p-6 transition-all rounded-[2rem] lg:rounded-[2.5rem] border-2 group relative overflow-hidden ${selectedBranch?.branchCode === branch.branchCode
                                                    ? 'bg-[#2C1E16] border-[#8C5A35] shadow-xl shadow-[#2C1E16]/40'
                                                    : 'bg-[#5C4D43] border-transparent hover:border-[#8C5A35]/30'
                                                    }`}
                                            >
                                                <div className={`absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-[#8C5A35] rounded-full -mr-12 -mt-12 blur-2xl lg:blur-3xl transition-opacity duration-500 ${selectedBranch?.branchCode === branch.branchCode ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                                                    }`}></div>

                                                <div className="flex gap-4 lg:gap-5 relative z-10">
                                                    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm ${selectedBranch?.branchCode === branch.branchCode
                                                        ? 'bg-[#8C5A35] text-white rotate-6' : 'bg-white/10 text-white group-hover:rotate-3'
                                                        }`}>
                                                        <FiMapPin size={20} className="lg:w-[22px] lg:h-[22px]" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1.5 lg:mb-2">
                                                            <h3 className="text-[13px] lg:text-[15px] font-black uppercase tracking-tight text-[#C2956E] pr-2">
                                                                {branch.branchName}
                                                            </h3>
                                                            {selectedBranch?.branchCode === branch.branchCode && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#8C5A35] animate-ping flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] lg:text-[12px] leading-relaxed font-medium text-white/60 line-clamp-2">
                                                            {branch.address}
                                                        </p>
                                                        <div className="mt-3 lg:mt-5 flex items-center justify-between">
                                                            <div className="flex items-center gap-3 lg:gap-4">
                                                                <span className="flex items-center gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white/40">
                                                                    <FiPhone size={12} className="lg:w-[14px] lg:h-[14px]" /> 1900 3013
                                                                </span>
                                                                <span className={`h-3 w-px bg-white/10 ${selectedBranch?.branchCode === branch.branchCode ? 'block' : 'hidden'}`} />
                                                                <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest ${isOpen(branch) ? 'text-green-400' : 'text-red-400'
                                                                    } ${selectedBranch?.branchCode === branch.branchCode ? 'block' : 'hidden'}`}>
                                                                    {isOpen(branch) ? 'Mở cửa' : 'Đóng cửa'}
                                                                </span>
                                                            </div>
                                                            <FiChevronRight className={`transition-all duration-300 ${selectedBranch?.branchCode === branch.branchCode ? 'text-white translate-x-1' : 'text-white/10 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                                                                }`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* --- RIGHT MAP CONTAINER --- */}
                    <div className="w-full h-[50%] lg:h-full flex-1 relative bg-[#FDF5E6]">
                        <div className="absolute inset-0 z-[1]"><MapView /></div>
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(44,30,22,0.05)] z-[2]"></div>

                        {/* Info Panel Floating */}
                        <AnimatePresence>
                            {selectedBranch && (
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                                    className="absolute top-4 left-4 right-4 lg:top-auto lg:bottom-10 lg:right-10 lg:left-auto lg:w-[400px] z-[1000]"
                                >
                                    <div className="bg-[#2C1E16] text-white p-4 lg:p-10 rounded-[1.5rem] lg:rounded-[3.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 lg:w-40 lg:h-40 bg-[#8C5A35] opacity-10 rounded-full -mr-12 -mt-12 lg:-mr-20 lg:-mt-20 blur-2xl lg:blur-3xl transition-transform duration-700 group-hover:scale-150"></div>

                                        <div className="relative z-10">
                                            <div className="hidden lg:flex items-center gap-3 mb-6">
                                                <div className="px-3 py-1 bg-[#8C5A35] text-[9px] font-black uppercase tracking-widest rounded-full">Đang chọn</div>
                                                <div className="h-px flex-1 bg-white/10"></div>
                                            </div>

                                            <div className="flex justify-between items-center lg:block gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-lg lg:text-2xl font-black uppercase tracking-tight text-[#C2956E] mb-1 lg:mb-3 leading-none italic pr-4 lg:pr-0 truncate lg:whitespace-normal drop-shadow-sm">
                                                        {selectedBranch.branchName}
                                                    </h4>
                                                    <p className="text-[11px] lg:text-sm text-white/60 mb-0 lg:mb-8 leading-relaxed font-medium line-clamp-1 lg:line-clamp-none lg:max-w-[90%]">
                                                        {selectedBranch.address}
                                                    </p>
                                                </div>

                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBranch.latitude},${selectedBranch.longitude}`} target="_blank" rel="noopener noreferrer"
                                                    className="lg:hidden w-10 h-10 bg-[#C2956E] hover:bg-[#D4A67F] text-[#2C1E16] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#C2956E]/20"
                                                >
                                                    <FiNavigation size={18} />
                                                </a>
                                            </div>

                                            <div className="hidden lg:grid grid-cols-2 gap-4 mb-10">
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Trạng thái</p>
                                                    <p className={`text-xs font-bold ${isOpen(selectedBranch) ? 'text-green-500' : 'text-red-500'}`}>{isOpen(selectedBranch) ? 'Đang mở cửa' : 'Đã đóng cửa'}</p>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Giờ hoạt động</p>
                                                    <p className="text-xs font-bold text-white">{selectedBranch?.openingTime || '07:00'} - {selectedBranch?.closingTime || '23:00'}</p>
                                                </div>
                                            </div>

                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBranch.latitude},${selectedBranch.longitude}`} target="_blank" rel="noopener noreferrer"
                                                className="hidden lg:flex w-full bg-[#C2956E] hover:bg-[#D4A67F] text-[#2C1E16] py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] text-center transition-all items-center justify-center gap-3 shadow-xl shadow-[#C2956E]/10"
                                            >
                                                <FiNavigation className="text-[16px]" /> Chỉ đường ngay
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5D5C5; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8C5A35; }
                .leaflet-container { background: #FDF5E6 !important; filter: grayscale(0.2) contrast(1.1) sepia(0.2); }
                .custom-div-icon { background: transparent; border: none; }
                .leaflet-marker-icon { transition: transform 0.3s ease-out; }
                .leaflet-marker-icon:hover { transform: scale(1.5) !important; z-index: 1000 !important; }
            `}} />
        </div>
    );
};

export default Store;