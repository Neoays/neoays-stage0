import React from 'react';

interface ProfileSkeletonProps {
    themeId?: string;
    layoutStyle?: string;
    primaryColor?: string;
}

/**
 * Theme-aware skeleton loader that matches the actual layout style.
 * Shows immediately while profile data loads from CDN/Firebase.
 * Includes animated loading text for better UX.
 */
const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({
    themeId = 'modern-gradient',
    layoutStyle = 'default',
    primaryColor = '#4f46e5'
}) => {
    // Determine skeleton style based on theme/layout
    const isDark = themeId === 'dark-elegance' || layoutStyle === 'dark' || layoutStyle === 'dark-elegance';
    const isLumia = layoutStyle === 'lumia' || themeId === 'lumia-tiles';
    const isBento = layoutStyle === 'bento' || layoutStyle === 'bento_modern' || themeId === 'bento-grid';
    const isGlass = layoutStyle === 'floating' || layoutStyle === 'glass' || themeId === 'glass-floating';

    // Animated loading text component
    const LoadingText = ({ dark = false }: { dark?: boolean }) => (
        <div className="flex flex-col items-center justify-center py-6 animate-pulse">
            <div className={`text-2xl font-bold mb-2 animate-bounce ${dark ? 'text-white/80' : 'text-gray-400'}`}>
                ✨
            </div>
            <div className={`text-sm font-medium animate-pulse ${dark ? 'text-white/60' : 'text-gray-400'}`}>
                Loading profile...
            </div>
        </div>
    );

    // Lumia-style tiles skeleton
    if (isLumia) {
        return (
            <div className="min-h-screen p-4 md:p-8" style={{ background: '#0f172a' }}>
                <style>{`
                    @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
                    .shimmer-lumia { animation: shimmer 1.5s infinite ease-in-out; }
                `}</style>
                <div className="max-w-4xl mx-auto">
                    {/* Header skeleton */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-slate-700 shimmer-lumia" />
                        <div className="flex-1 space-y-2">
                            <div className="h-8 w-48 bg-slate-700 rounded-lg shimmer-lumia" />
                            <div className="h-4 w-32 bg-slate-800 rounded shimmer-lumia" />
                        </div>
                    </div>
                    {/* Tiles grid skeleton */}
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                        <div className="col-span-2 h-24 bg-green-500/30 rounded-xl shimmer-lumia" />
                        <div className="col-span-2 h-24 bg-emerald-600/30 rounded-xl shimmer-lumia" />
                        <div className="col-span-2 h-24 bg-purple-500/30 rounded-xl shimmer-lumia" />
                        <div className="col-span-2 h-24 bg-amber-500/30 rounded-xl shimmer-lumia" />
                    </div>
                    <LoadingText dark />
                </div>
            </div>
        );
    }

    // Dark Elegance skeleton
    if (isDark) {
        const bgColor = '#0f172a';
        const accentColor = primaryColor || '#d4af37';
        return (
            <div className="min-h-screen p-8" style={{ background: bgColor }}>
                <style>{`
                    @keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 0.6; } 100% { opacity: 0.3; } }
                    .shimmer-dark { animation: shimmer 1.5s infinite ease-in-out; }
                `}</style>
                <div className="max-w-3xl mx-auto text-center">
                    {/* Profile image */}
                    <div
                        className="w-32 h-32 mx-auto rounded-full mb-6 shimmer-dark"
                        style={{ background: 'rgba(255,255,255,0.1)', border: `3px solid ${accentColor}40` }}
                    />
                    {/* Name */}
                    <div className="h-12 w-64 mx-auto mb-4 rounded-lg shimmer-dark" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    {/* Bio */}
                    <div className="h-20 w-full rounded-xl mb-8 shimmer-dark" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    {/* Contact card */}
                    <div className="h-32 rounded-xl shimmer-dark" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${accentColor}40` }} />
                    <LoadingText dark />
                </div>
            </div>
        );
    }

    // Bento grid skeleton
    if (isBento) {
        return (
            <div className="min-h-screen p-4 bg-gray-50">
                <style>{`
                    @keyframes shimmer { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
                    .shimmer-bento { animation: shimmer 1.5s infinite ease-in-out; }
                `}</style>
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 row-span-2 h-48 bg-gray-200 rounded-2xl shimmer-bento" />
                        <div className="col-span-2 h-24 bg-gray-200 rounded-2xl shimmer-bento" />
                        <div className="col-span-1 h-24 bg-gray-200 rounded-2xl shimmer-bento" />
                        <div className="col-span-1 h-24 bg-gray-200 rounded-2xl shimmer-bento" />
                        <div className="col-span-3 h-32 bg-gray-200 rounded-2xl shimmer-bento" />
                    </div>
                    <LoadingText />
                </div>
            </div>
        );
    }

    // Glass floating skeleton
    if (isGlass) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
            >
                <style>{`
                    @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.9; } 100% { opacity: 0.5; } }
                    .shimmer-glass { animation: shimmer 1.5s infinite ease-in-out; }
                `}</style>
                <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
                    <div className="w-28 h-28 mx-auto rounded-full bg-gray-200 mb-6 shimmer-glass" />
                    <div className="h-8 w-48 mx-auto bg-gray-200 rounded-lg mb-3 shimmer-glass" />
                    <div className="h-4 w-32 mx-auto bg-gray-100 rounded mb-6 shimmer-glass" />
                    <div className="space-y-3">
                        <div className="h-14 bg-gray-100 rounded-xl shimmer-glass" />
                        <div className="h-14 bg-gray-100 rounded-xl shimmer-glass" />
                    </div>
                    <LoadingText />
                </div>
            </div>
        );
    }

    // Default Modern Gradient skeleton
    return (
        <div
            className="min-h-screen flex flex-col items-center p-4 pt-8"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)` }}
        >
            <style>{`
                @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.9; } 100% { opacity: 0.5; } }
                .shimmer-default { animation: shimmer 1.5s infinite ease-in-out; }
            `}</style>
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Cover */}
                <div className="h-48 bg-gray-200 shimmer-default" />
                {/* Profile image overlapping */}
                <div className="flex justify-center -mt-16 relative z-10">
                    <div className="w-32 h-32 rounded-[40%] bg-gray-300 border-4 border-white shadow-lg shimmer-default" />
                </div>
                {/* Content */}
                <div className="p-6 text-center">
                    <div className="h-8 w-48 mx-auto bg-gray-200 rounded-lg mb-3 shimmer-default" />
                    <div className="h-4 w-24 mx-auto bg-gray-100 rounded mb-6 shimmer-default" />
                    {/* Social buttons */}
                    <div className="flex justify-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gray-100 shimmer-default" />
                        <div className="w-12 h-12 rounded-full bg-gray-100 shimmer-default" />
                        <div className="w-12 h-12 rounded-full bg-gray-100 shimmer-default" />
                    </div>
                    {/* Links */}
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-100 rounded-xl shimmer-default" />
                        <div className="h-16 bg-gray-100 rounded-xl shimmer-default" />
                    </div>
                    <LoadingText />
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
