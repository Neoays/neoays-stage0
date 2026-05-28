import React from 'react';
import { UserProfile, UserLink } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import { GlobeIcon, PhoneIcon, EnvelopeIcon, MapMarkerIcon } from '../Icons';
import LinkRenderer from '../LinkRenderer';
import GallerySection from '../GallerySection';

interface SplitProLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const SplitProLayout: React.FC<SplitProLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';
    const { colors, typography } = theme;

    return (
        <div
            className={`min-h-screen flex flex-col md:flex-row ${isAr ? 'font-arabic' : ''}`}
            dir={dir}
            style={{ backgroundColor: colors.background, fontFamily: typography.fontFamily }}
        >
            {/* Identity Side (Left on MD+, Top on Mobile) */}
            <div
                className="w-full md:w-5/12 lg:w-4/12 md:h-screen flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
            >
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -translate-x-24 translate-y-24"></div>

                <div className="relative z-10 flex flex-col items-center text-center animate-fade-in">
                    <div className={`w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-white p-2 shadow-2xl mb-8 transform rotate-3 ${isLoading ? 'shimmer' : ''}`}>
                        {profileData.photoURL ? (
                            <img
                                src={profileData.photoURL}
                                alt={profileData.displayName}
                                className={`w-full h-full object-cover rounded-[2rem] ${isLoading ? 'shimmer' : ''}`}
                            />
                        ) : (
                            <div className={`w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-5xl font-black rounded-[2rem] ${isLoading ? 'shimmer' : ''}`}>
                                {isLoading ? '' : (profileData.displayName?.charAt(0) || profileData.username.charAt(0))}
                            </div>
                        )}
                    </div>

                    <h1 className={`text-3xl md:text-4xl font-black mb-2 tracking-tight ${isLoading ? 'shimmer rounded-lg min-h-[50px] w-full' : ''}`}>
                        {profileData.displayName || profileData.username}
                    </h1>

                    {profileData.businessCategory && (
                        <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6">
                            {profileData.businessCategory}
                        </span>
                    )}

                    <p className="text-sm opacity-90 leading-relaxed max-w-xs">
                        {profileData.bio || (isAr ? "نحن نؤمن بالتميز والابتكار في كل ما نقوم به." : "We believe in excellence and innovation in everything we do.")}
                    </p>

                    {/* Social/Quick Icons */}
                    <div className="mt-8 flex gap-4">
                        {profileData.mobileNumber && (
                            <a href={`tel:${profileData.mobileNumber}`} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors">
                                <PhoneIcon className="w-5 h-5" />
                            </a>
                        )}
                        {profileData.email && (
                            <a href={`mailto:${profileData.email}`} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors">
                                <EnvelopeIcon className="w-5 h-5" />
                            </a>
                        )}
                        {profileData.website && (
                            <a href={profileData.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors">
                                <GlobeIcon className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Side (Right on MD+, Bottom on Mobile) */}
            <div className="w-full md:w-7/12 lg:w-8/12 p-6 md:p-12 lg:p-20 overflow-y-auto">
                <div className="max-w-2xl mx-auto animate-fade-in-up">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8">
                        {isAr ? 'روابط الوصول السريع' : 'Quick Access Links'}
                    </h2>

                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="h-40 bg-gray-50 rounded-[2rem] shimmer"></div>
                                <div className="h-40 bg-gray-50 rounded-[2rem] shimmer"></div>
                            </div>
                        </div>
                    ) : (
                        <LinkRenderer
                            links={profileData.links || []}
                            isAr={isAr}
                            primaryStyle="grid"
                        />
                    )}

                    {/* Gallery Section */}
                    {profileData.gallery && profileData.gallery.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4">
                                {isAr ? 'معرض الصور' : 'Gallery'}
                            </h3>
                            <GallerySection gallery={profileData.gallery} primaryColor={colors.primary} maxItems={4} />
                        </div>
                    )}



                </div>
            </div>
        </div>
    );
};

export default SplitProLayout;
