import React, { useState, useEffect } from 'react';
import { db } from '../../../services/firebaseConfig';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl?: string;
    category?: string;
}

interface PortfolioBlockProps {
    profileId: string;
    profileName: string;
    primaryColor?: string;
}

const PortfolioBlock: React.FC<PortfolioBlockProps> = ({
    profileId,
    profileName,
    primaryColor = '#4f46e5'
}) => {
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            if (!profileId) return;
            try {
                const q = query(
                    collection(db, `users/${profileId}/portfolio_items`),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
                setItems(data);
            } catch (err) {
                console.error("Error fetching portfolio items:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, [profileId]);

    if (isLoading) return null;
    if (items.length === 0) return null; // Don't show the block if they have no portfolio items

    return (
        <div className="w-full max-w-6xl mx-auto my-12 px-4 sm:px-6">
            <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                    Digital Portfolio
                </h3>
                <p className="text-gray-500 mt-3 font-medium max-w-xl mx-auto">
                    Explore featured work, case studies, and projects by {profileName}.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        onClick={() => setSelectedItem(item)}
                    >
                        {/* Image Container with Aspect Ratio */}
                        <div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-4xl">
                                    📁
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <span className="bg-white/90 text-gray-900 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    View Details
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {item.category && (
                                <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: primaryColor }}>
                                    {item.category}
                                </span>
                            )}
                            <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{item.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Details */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => setSelectedItem(null)}
                    />
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col md:flex-row animate-scale-up">

                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                        >
                            ✕
                        </button>

                        {/* Modal Image (Left Side on Desktop) */}
                        <div className="w-full md:w-1/2 bg-gray-100 flex-shrink-0 relative">
                            {selectedItem.imageUrl ? (
                                <img
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.title}
                                    className="w-full h-full object-cover min-h-[300px]"
                                />
                            ) : (
                                <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gray-50 text-6xl">
                                    📁
                                </div>
                            )}
                        </div>

                        {/* Modal Content (Right Side on Desktop) */}
                        <div className="p-8 md:p-10 w-full md:w-1/2 flex flex-col">
                            {selectedItem.category && (
                                <span className="text-xs font-black uppercase tracking-widest mb-3 block" style={{ color: primaryColor }}>
                                    {selectedItem.category}
                                </span>
                            )}
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                {selectedItem.title}
                            </h3>

                            <div className="w-12 h-1 rounded mb-6" style={{ backgroundColor: primaryColor }} />

                            <div className="prose prose-sm text-gray-600 mb-8 whitespace-pre-wrap flex-grow">
                                {selectedItem.description}
                            </div>

                            {selectedItem.linkUrl && (
                                <a
                                    href={selectedItem.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl text-white font-bold text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg mt-auto"
                                    style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
                                >
                                    Visit Link 🚀
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioBlock;
