import React, { useState } from 'react';
import { UserProfile, UserLink } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import { GlobeIcon, PhoneIcon, EnvelopeIcon } from '../Icons';
import LinkRenderer from '../LinkRenderer';
import GallerySection from '../GallerySection';

interface StoryVerticalLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const StoryVerticalLayout: React.FC<StoryVerticalLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';
    const { colors, typography } = theme;
    const [activeIndex, setActiveIndex] = useState(0);

    const totalLinks = profileData.links?.length || 0;

    return (
        <div
            className={`h-screen w-full flex flex-col bg-black text-white overflow-hidden relative ${isAr ? 'font-arabic' : ''}`}
            dir={dir}
            style={{ fontFamily: typography.fontFamily }}
        >
            {/* Background Image / Visual */}
            <div className="absolute inset-0 z-0">
                {profileData.photoURL ? (
                    <>
                        <img
                            src={profileData.photoURL}
                            alt={profileData.displayName}
                            className="w-full h-full object-cover opacity-60 blur-sm scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
                    </>
                ) : (
                    <div
                        className="w-full h-full opacity-40"
                        style={{ background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})` }}
                    ></div>
                )}
                {/* Modern Blur Circles */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/30 rounded-full blur-[100px]"></div>
            </div>

            {/* Story Progress Indicators */}
            <div className="relative z-20 flex gap-1 p-4 pt-6">
                <div className="h-0.5 flex-grow bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-full animate-story-progress"></div>
                </div>
                <div className="h-0.5 flex-grow bg-white/20 rounded-full"></div>
                <div className="h-0.5 flex-grow bg-white/20 rounded-full"></div>
            </div>

            {/* Header / Info */}
            <header className="relative z-20 p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border-2 border-white p-0.5 overflow-hidden ring-2 ring-indigo-500 ring-offset-2 ring-offset-black ${isLoading ? 'shimmer' : ''}`}>
                    {!isLoading && (
                        <img
                            src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}`}
                            alt={profileData.username}
                            className="w-full h-full object-cover rounded-full"
                        />
                    )}
                </div>
                <div>
                    <h1 className={`font-black text-lg tracking-tight leading-none mb-1 ${isLoading ? 'shimmer rounded min-h-[20px] w-32' : ''}`}>
                        {profileData.displayName || profileData.username}
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        {profileData.businessCategory || (isAr ? 'ملف شخصي' : 'Personal Profile')}
                    </p>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-20 flex-grow flex flex-col items-center justify-center text-center p-8 px-10">
                <div className="animate-scale-in">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tighter">
                        {isAr ? 'تواصل معي' : 'Let\'s Connect Together'}
                    </h2>
                    {profileData.bio && (
                        <p className="text-base text-white/80 font-medium mb-10 max-w-xs leading-relaxed">
                            {profileData.bio}
                        </p>
                    )}
                </div>

                {/* Unified Link Renderer */}
                <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="h-16 bg-white/10 rounded-full shimmer"></div>
                            <div className="h-16 bg-white/10 rounded-full shimmer"></div>
                        </div>
                    ) : (
                        <LinkRenderer
                            links={profileData.links || []}
                            isAr={isAr}
                            primaryStyle="story"
                        />
                    )}
                </div>

                {/* Gallery Section */}
                {profileData.gallery && profileData.gallery.length > 0 && (
                    <div className="w-full max-w-sm mt-6">
                        <GallerySection gallery={profileData.gallery} primaryColor={colors.primary} maxItems={3} variant="row" />
                    </div>
                )}
            </main>

            {/* Swipe Up Indicator / Footer */}
            <footer className="relative z-20 p-8 pb-12 flex flex-col items-center animate-bounce-subtle">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 animate-pulse">
                    {isAr ? 'اسحب للأعلى للمزيد' : 'Swipe Up For More'}
                </span>
                <div className="flex gap-4">
                    {profileData.email && (
                        <a href={`mailto:${profileData.email}`} className="text-white/40 hover:text-white transition-colors">
                            <EnvelopeIcon className="w-5 h-5" />
                        </a>
                    )}
                    {profileData.mobileNumber && (
                        <a href={`tel:${profileData.mobileNumber}`} className="text-white/40 hover:text-white transition-colors">
                            <PhoneIcon className="w-5 h-5" />
                        </a>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default StoryVerticalLayout;
