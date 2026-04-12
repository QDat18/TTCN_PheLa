import React, { useState, useEffect } from 'react';
import Header from '~/components/admin/Header';
import { toast } from 'react-toastify';
import { getLatestActiveBanners } from '~/services/bannerService';

interface Banner {
    bannerId: string;
    imageUrl: string;
}

const HomeAdmin = () => {

    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data: Banner[] = await getLatestActiveBanners();
                setBanners(data.filter(banner => banner.imageUrl));
            } catch (error) {
                console.error("Failed to fetch banners:", error);
                toast.error('Không thể tải banner.');
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const handlePrev = () => {
        setCurrentBannerIndex((prevIndex) =>
            prevIndex === 0 ? banners.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentBannerIndex((prevIndex) =>
            prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
    };


    const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <div className="relative flex-1 w-full bg-black">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-white">Đang tải banner...</div>
                ) : currentBanner ? (
                    <div
                        key={currentBanner.bannerId}
                        className="w-full h-full bg-cover bg-center transition-opacity duration-700 ease-in-out hover:brightness-75"
                        style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
                    >
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white">
                        Không có banner để hiển thị.
                    </div>
                )}

                {/* Nút điều hướng chỉ hiển thị khi có nhiều hơn 1 banner */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-3 z-10 hover:bg-opacity-60 transition-all"
                            aria-label="Previous Banner"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-3 z-10 hover:bg-opacity-60 transition-all"
                            aria-label="Next Banner"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default HomeAdmin;