import React, { useState, useEffect, useMemo } from 'react';
import Header from '~/components/customer/Header';
import Footer from '~/components/customer/Footer';
import imgStore from "~/assets/images/store.png";
import { getPublicBranches } from '~/services/branchService';
import { FiMapPin, FiPhone, FiSearch, FiChevronRight, FiNavigation, FiMusic, FiAward } from 'react-icons/fi';
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
}

const useMapComponents = () => {
    const [mapComponents, setMapComponents] = useState<{
        MapContainer?: any;
        TileLayer?: any;
        Marker?: any;
        useMapEvents?: any;
        L?: any;
    }>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-leaflet'),
                import('leaflet'),
                import('leaflet/dist/leaflet.css'),
            ]).then(([{ MapContainer, TileLayer, Marker, useMapEvents }, L]) => {
                // Fix default icon issue in Leaflet
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                });

                setMapComponents({
                    MapContainer,
                    TileLayer,
                    Marker,
                    useMapEvents,
                    L,
                });
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
    const customer = user && user.type === 'customer' ? user : null;

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await getPublicBranches();
                setBranches(branchesData);
                if (branchesData.length > 0) {
                    setSelectedBranch(branchesData[0]);
                }
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

    const cities = useMemo(() => {
        return ['Tất cả', ...new Set(branches.map(b => b.city))];
    }, [branches]);

    const customIcon = useMemo(() => {
        if (!L) return null;
        return new L.DivIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #8C5A35; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(140, 90, 53, 0.5);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    }, [L]);

    const getMemberTier = (points: number = 0) => {
        if (points >= 400) return 'La';
        if (points >= 149) return 'Sol';
        if (points >= 10) return 'Fa';
        return 'Nốt Nhạc';
    };

    const getTierStep = (points: number = 0) => {
        if (points < 10) return { current: points, next: 10, nextTier: 'Fa' };
        if (points < 149) return { current: points - 10, next: 139, nextTier: 'Sol' };
        if (points < 400) return { current: points - 149, next: 251, nextTier: 'La' };
        return { current: 1, next: 1, nextTier: 'Max' };
    };

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
                zoom={14}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />
                
                {filteredBranches.map(branch => (
                    <Marker
                        key={branch.branchCode}
                        position={[branch.latitude, branch.longitude]}
                        icon={customIcon}
                        eventHandlers={{
                            click: () => setSelectedBranch(branch),
                        }}
                    />
                ))}
            </MapContainer>
        );
    };

    const tierStep = getTierStep(customer?.pointUse);
    const progressWidth = tierStep.nextTier === 'Max' ? 100 : Math.min(100, (tierStep.current / tierStep.next) * 100);

    return (
        <div className="min-h-screen bg-[#FCF8F1] flex flex-col">
            <Header />

            <main className="flex-1 flex flex-col pt-[70px]">
                <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)]">
                    
                    {/* Left: Sidebar & List */}
                    <div className="w-full lg:w-[450px] bg-white border-r border-[#E5D5C5] flex flex-col overflow-hidden shadow-2xl z-20 relative">
                        {/* Loyalty Card UI */}
                        {customer && (
                            <div className="p-8 bg-[#2C1E16] text-white relative overflow-hidden shrink-0 border-b border-white/5">
                                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                                    <FiMusic size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 border border-[#8C5A35] rounded-full flex items-center justify-center p-1 bg-[#8C5A35]/10">
                                                <span className="text-[#8C5A35] font-black italic text-xs">Ph</span>
                                            </div>
                                            <h4 className="text-lg font-black uppercase tracking-widest italic">{getMemberTier(customer.pointUse)}</h4>
                                        </div>
                                        
                                        <div className="flex items-end gap-4">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Nốt nhạc tích lũy</p>
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-6xl font-black text-[#FDF5E6] tracking-tighter">
                                                        {Math.floor(customer.pointUse)}
                                                    </span>
                                                    <span className="text-sm font-black text-[#8C5A35] uppercase italic pb-1">Nốt nhạc</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-8 relative z-10 w-full">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 opacity-60">
                                            <span>{tierStep.nextTier === 'Max' ? 'Hạng tối đa' : `Tiến trình thăng hạng (${tierStep.nextTier})`}</span>
                                            <span>
                                                {tierStep.nextTier === 'Max' 
                                                    ? '100%' 
                                                    : `${Math.floor(customer.pointUse)}/${tierStep.nextTier === 'Fa' ? 10 : tierStep.nextTier === 'Sol' ? 149 : 400} Nốt nhạc`}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-[#8C5A35] transition-all duration-1000"
                                                style={{ width: `${progressWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8 pb-4">
                            <h1 className="text-3xl font-black text-[#2C1E16] uppercase tracking-tighter italic">
                                Hệ thống <span className="text-[#C2956E]">cửa hàng</span>
                            </h1>
                            <p className="text-[10px] font-bold text-[#8C5A35] uppercase tracking-widest mt-1 opacity-60">
                                Phê La - Nốt Nhạc Đặc Sản
                            </p>
                        </div>

                        <div className="px-8 pb-6 space-y-4">
                            <div className="relative group">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C1E16]/30 group-focus-within:text-[#8C5A35] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="TÌM KIẾM THEO ĐỊA CHỈ, TÊN QUẬN..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-[#FCF8F1] border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[#8C5A35]/20 focus:outline-none transition-all placeholder:opacity-30"
                                />
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {cities.map(city => (
                                    <button
                                        key={city}
                                        onClick={() => setActiveCity(city)}
                                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                            activeCity === city 
                                            ? 'bg-[#2C1E16] text-[#FDF5E6] shadow-xl shadow-[#2C1E16]/20' 
                                            : 'bg-[#FCF8F1] text-[#2C1E16]/60 hover:bg-[#E5D5C5]/30'
                                        }`}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="w-8 h-8 border-2 border-[#8C5A35]/20 border-t-[#8C5A35] rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-[9px] font-black text-[#8C5A35] uppercase tracking-widest opacity-40">Đang tải dữ liệu...</p>
                                </div>
                            ) : filteredBranches.length === 0 ? (
                                <div className="p-20 text-center">
                                    <p className="text-[10px] font-black text-[#2C1E16]/20 uppercase tracking-widest">Không tìm thấy cửa hàng</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredBranches.map(branch => (
                                        <button
                                            key={branch.branchCode}
                                            onClick={() => setSelectedBranch(branch)}
                                            className={`w-full text-left p-6 transition-all rounded-[2rem] border-2 group relative overflow-hidden ${
                                                selectedBranch?.branchCode === branch.branchCode 
                                                ? 'bg-[#2C1E16] border-[#2C1E16] shadow-2xl shadow-[#2C1E16]/20' 
                                                : 'bg-white border-transparent hover:border-[#E5D5C5] hover:bg-[#FCF8F1]/50'
                                            }`}
                                        >
                                            <div className="flex gap-4 relative z-10">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                                                    selectedBranch?.branchCode === branch.branchCode 
                                                    ? 'bg-[#C2956E] text-[#2C1E16] rotate-12' 
                                                    : 'bg-[#FCF8F1] text-[#8C5A35]'
                                                }`}>
                                                    <FiMapPin size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col">
                                                        <h3 className={`text-sm font-black uppercase tracking-tighter mb-1 transition-colors ${
                                                            selectedBranch?.branchCode === branch.branchCode ? 'text-[#FDF5E6]' : 'text-[#2C1E16]'
                                                        }`}>
                                                            {branch.branchName}
                                                        </h3>
                                                        <p className={`text-[11px] leading-relaxed transition-colors line-clamp-2 ${
                                                            selectedBranch?.branchCode === branch.branchCode ? 'text-white/60' : 'text-[#5C4D43]'
                                                        }`}>
                                                            {branch.address}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                                            selectedBranch?.branchCode === branch.branchCode ? 'text-[#C2956E]' : 'text-[#8C5A35]'
                                                        }`}>
                                                            <FiPhone size={12} /> 1900 3013
                                                        </span>
                                                        {selectedBranch?.branchCode === branch.branchCode && (
                                                            <motion.span 
                                                                layoutId="active-tag"
                                                                className="text-[8px] font-black bg-[#FDF5E6]/10 text-[#FDF5E6] px-2 py-1 rounded-full uppercase tracking-widest"
                                                            >
                                                                Đang chọn
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Map Container */}
                    <div className="flex-1 bg-[#FDF5E6] relative overflow-hidden">
                        <AnimatePresence mode='wait'>
                            <motion.div 
                                key={selectedBranch?.branchCode || 'empty'}
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full"
                            >
                                <MapView />
                            </motion.div>
                        </AnimatePresence>
                        
                        {selectedBranch && (
                            <div className="absolute top-8 right-8 z-[1000] hidden md:block">
                                <motion.div 
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="bg-[#2C1E16] text-white p-8 rounded-[3rem] shadow-2xl border border-white/5 w-80 backdrop-blur-xl bg-opacity-90"
                                >
                                    <h4 className="text-xl font-black uppercase text-[#C2956E] mb-2">{selectedBranch.branchName}</h4>
                                    <p className="text-xs text-white/70 mb-6 leading-relaxed font-medium">{selectedBranch.address}</p>
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Đang mở cửa</p>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBranch.latitude},${selectedBranch.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#C2956E] hover:bg-[#D4A67F] text-[#2C1E16] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C2956E]/20"
                                    >
                                        <FiNavigation /> Chỉ đường
                                    </a>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5D5C5;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #8C5A35;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .leaflet-container {
                    background: #FCF8F1 !important;
                }
                .custom-div-icon {
                    background: transparent;
                    border: none;
                }
            `}} />
        </div>
    );
};

export default Store;