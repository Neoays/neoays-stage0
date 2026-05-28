import React from 'react';

interface GalleryItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
}

interface GallerySectionProps {
    gallery?: GalleryItem[];
    primaryColor?: string;
    maxItems?: number;
    variant?: 'grid' | 'row' | 'masonry';
}

// YouTube URL to Embed URL converter
const convertToYouTubeEmbed = (url: string): string => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
};

const isYouTubeEmbed = (url: string): boolean => {
    return url.includes('youtube.com/embed/');
};

const GallerySection: React.FC<GallerySectionProps> = ({
    gallery,
    primaryColor = '#6366f1',
    maxItems = 6,
    variant = 'grid'
}) => {
    if (!gallery || gallery.length === 0) return null;

    const items = gallery.slice(0, maxItems);

    return (
        <div className="w-full">
            {variant === 'grid' && (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            {item.type === 'video' || isYouTubeEmbed(item.url) ? (
                                <iframe
                                    src={convertToYouTubeEmbed(item.url)}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`Video ${item.id}`}
                                />
                            ) : (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {variant === 'row' && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {items.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100">
                            {item.type === 'video' || isYouTubeEmbed(item.url) ? (
                                <div className="w-full h-full flex items-center justify-center bg-black">
                                    <span className="text-white text-3xl">▶</span>
                                </div>
                            ) : (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {variant === 'masonry' && (
                <div className="columns-2 gap-2 space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`break-inside-avoid rounded-lg overflow-hidden bg-gray-100 ${idx % 3 === 0 ? 'aspect-square' : 'aspect-video'}`}
                        >
                            {item.type === 'video' || isYouTubeEmbed(item.url) ? (
                                <iframe
                                    src={convertToYouTubeEmbed(item.url)}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`Video ${item.id}`}
                                />
                            ) : (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GallerySection;
