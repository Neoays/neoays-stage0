import React, { useState, useRef, useEffect } from 'react';

interface VideoIntroBubbleProps {
    videoUrl: string;
    profileName: string;
    primaryColor?: string;
}

const VideoIntroBubble: React.FC<VideoIntroBubbleProps> = ({ videoUrl, profileName, primaryColor = '#4f46e5' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Auto-play preview logic (muted)
    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
        }
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        setHasInteracted(true);
        if (videoRef.current) {
            videoRef.current.muted = false; // Unmute on open
            videoRef.current.currentTime = 0; // Restart
            videoRef.current.play();
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.pause();
        }
    };

    if (!videoUrl) return null;

    // Detect if it's a YouTube link or a direct video file (just basic support for direct mp4/webm right now)
    const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i) || videoUrl.includes('firebasestorage.googleapis.com');

    return (
        <div className="fixed bottom-24 left-6 z-40">
            {/* The Expanded View */}
            {isOpen && (
                <div
                    className="absolute bottom-0 left-0 bg-white rounded-3xl shadow-2xl overflow-hidden w-[280px] h-[480px] sm:w-[320px] sm:h-[520px] animate-scale-up-bl transform-origin-bottom-left border border-gray-100/50"
                    style={{ zIndex: 50 }}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white flex items-center justify-center transition-all"
                    >
                        ✕
                    </button>

                    <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-black/40 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Welcome 👋
                    </div>

                    <div className="w-full h-full bg-black relative">
                        {isDirectVideo ? (
                            <video
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                controls
                            />
                        ) : (
                            // Basic iframe fallback for Youtube/Vimeo
                            <iframe
                                src={videoUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            />
                        )}
                    </div>
                </div>
            )}

            {/* The Bubble / Teaser View */}
            {!isOpen && (
                <div
                    className="relative group cursor-pointer animate-bounce-slow"
                    onClick={handleOpen}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Tooltip */}
                    <div className={`absolute top-0 left-full ml-4 whitespace-nowrap bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg border border-gray-100 text-sm font-bold transition-all duration-300 transform origin-left ${isHovered || !hasInteracted ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                        <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-white border-l border-b border-gray-100 transform -translate-y-1/2 rotate-45"></div>
                        <span className="animate-pulse mr-2">👋</span> Hear from {profileName}
                    </div>

                    {/* Circular Bubble Wrapper */}
                    <div className="w-[84px] h-[120px] rounded-[40px] overflow-hidden shadow-xl border-[3px] border-white relative transition-transform duration-300 group-hover:scale-105" style={{ boxShadow: `0 10px 30px -5px ${primaryColor}60` }}>

                        {/* Status Ring */}
                        <div className="absolute inset-0 rounded-[40px] border-2 border-transparent animate-spin-slow pointer-events-none" style={{ borderTopColor: primaryColor, borderRightColor: primaryColor }} />

                        <div className="w-full h-full bg-gray-900 relative">
                            {isDirectVideo ? (
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full h-full object-cover opacity-80"
                                    loop
                                    muted
                                    playsInline
                                    autoPlay
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-3xl">
                                    🎥
                                </div>
                            )}

                            {/* Play Icon Centered Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-gray-900 border-b-[6px] border-b-transparent ml-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoIntroBubble;
