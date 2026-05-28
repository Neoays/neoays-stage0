import React from 'react';
import { UserProfile, UserLink } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import { GlobeIcon, PhoneIcon, EnvelopeIcon } from '../Icons';
import GallerySection from '../GallerySection';

interface BentoGridLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const BentoGridLayout: React.FC<BentoGridLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';
    const { colors, typography } = theme;

    return (
        <div
            className={`min-h-screen p-4 md:p-8 lg:p-12 ${isAr ? 'font-arabic' : ''}`}
            style={{ backgroundColor: colors.background, color: colors.text, fontFamily: typography.fontFamily }}
            dir={dir}
        >
            <div className="max-w-4xl mx-auto">
                {/* Bento Grid Container */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-min">

                    {/* Profile & Info Tile (Large) */}
                    <div className="col-span-2 row-span-2 bg-white rounded-[2rem] p-8 flex flex-col items-center text-center shadow-sm border border-gray-100 animate-scale-in">
                        <div className="relative mb-6">
                            <div className={`absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full ${isLoading ? 'shimmer' : ''}`}></div>
                            {profileData.photoURL ? (
                                <img
                                    src={profileData.photoURL}
                                    alt={profileData.displayName}
                                    className={`w-32 h-32 rounded-3xl relative z-10 object-cover shadow-xl ${isLoading ? 'shimmer' : ''}`}
                                />
                            ) : (
                                <div className={`w-32 h-32 rounded-3xl relative z-10 bg-indigo-600 flex items-center justify-center text-white text-5xl font-black ${isLoading ? 'shimmer' : ''}`}>
                                    {isLoading ? '' : (profileData.displayName?.charAt(0) || profileData.username.charAt(0))}
                                </div>
                            )}
                        </div>
                        <h1 className={`text-3xl font-black tracking-tighter mb-2 ${isLoading ? 'shimmer rounded-lg min-h-[40px] w-2/3' : ''}`} style={{ color: colors.text }}>
                            {profileData.displayName || profileData.username}
                        </h1>
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                            {profileData.businessCategory || 'Creator'}
                        </span>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs transition-all">
                            {profileData.bio || (isAr ? "أهلاً بك في ملفي الشخصي المخصص." : "Welcome to my customized profile.")}
                        </p>
                    </div>

                    {/* Quick Stats/Badges */}
                    <div className="col-span-1 bg-indigo-600 rounded-[2rem] p-6 flex flex-col justify-center items-center text-white shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <span className="text-4xl mb-2">🚀</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{isAr ? 'نشط' : 'Active'}</span>
                    </div>

                    <div className="col-span-1 bg-pink-100 rounded-[2rem] p-6 flex flex-col justify-center items-center text-pink-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <span className="text-4xl mb-2">✨</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{isAr ? 'قسط' : 'Premium'}</span>
                    </div>

                    {/* Links Section (Unified) */}
                    <div className="col-span-2 md:col-span-4 space-y-4">
                        {/* Primary Links Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {profileData.links?.filter(l => l.isPrimary).map((link, idx) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`rounded-[2rem] p-6 flex flex-col items-center justify-center text-center transition-all hover:scale-105 active:scale-95 animate-fade-in-up shadow-sm border border-gray-50 bg-white`}
                                    style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                                >
                                    <span className="text-3xl mb-3">
                                        {link.iconType === 'whatsapp' ? '💬' :
                                            link.iconType === 'instagram' ? '📸' :
                                                link.iconType === 'star' ? '⭐' : '🔗'}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider line-clamp-1">
                                        {isAr ? (link.titleAr || link.title) : link.title}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Standard Links List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profileData.links?.filter(l => !l.isPrimary).map((link, idx) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-white p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md transition-all group animate-fade-in-up"
                                    style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                                >
                                    <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <span>🔗</span>
                                        </div>
                                        <span className="font-bold text-gray-800">
                                            {isAr ? (link.titleAr || link.title) : link.title}
                                        </span>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:border-indigo-100 group-hover:text-indigo-500 transition-all ${isAr ? 'rotate-180' : ''}`}>
                                        →
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Gallery Tile */}
                    {profileData.gallery && profileData.gallery.length > 0 && (
                        <div className="col-span-2 md:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                {isAr ? 'معرض الصور' : 'Gallery'}
                            </h3>
                            <GallerySection gallery={profileData.gallery} primaryColor={colors.primary} />
                        </div>
                    )}

                </div>



            </div>
        </div>
    );
};

export default BentoGridLayout;
