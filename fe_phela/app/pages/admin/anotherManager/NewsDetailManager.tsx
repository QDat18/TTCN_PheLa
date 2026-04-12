import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getNewsById, createNews, updateNews } from '~/services/newsService';
import Header from '~/components/admin/Header';

const NewsDetailManager = () => {
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(newsId);

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode && newsId) {
            const fetchNewsDetail = async () => {
                try {
                    const data = await getNewsById(newsId);
                    setTitle(data.title);
                    setSummary(data.summary);
                    setContent(data.content);
                    setThumbnailPreview(data.thumbnailUrl);
                } catch (error) {
                    toast.error('Không tìm thấy bài viết!');
                    navigate('/admin/news');
                }
            };
            fetchNewsDetail();
        }
    }, [newsId, isEditMode, navigate]);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !summary || !content) {
            toast.warn('Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('summary', summary);
        formData.append('content', content);
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        try {
            if (isEditMode && newsId) {
                await updateNews(newsId, formData);
                toast.success('Cập nhật bài viết thành công!');
            } else {
                await createNews(formData);
                toast.success('Tạo bài viết mới thành công!');
            }
            navigate('/admin/news');
        } catch (error) {
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại!');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
             <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
                <Header />
            </div>
            <div className="container mx-auto mt-20 p-4">
                <h1 className="text-3xl font-bold mb-6">
                    {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h1>
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                            Tiêu đề
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="summary">
                            Tóm tắt
                        </label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                            Nội dung
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-48"
                        />
                    </div>
                     <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="thumbnail">
                            Ảnh thumbnail
                        </label>
                        <input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                         {thumbnailPreview && <img src={thumbnailPreview} alt="Xem trước" className="mt-4 w-48 h-auto rounded" />}
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/news')}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewsDetailManager;