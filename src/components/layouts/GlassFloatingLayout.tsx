import React from 'react';
import { UserProfile, UserLink } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import { GlobeIcon, PhoneIcon, EnvelopeIcon, MapMarkerIcon } from '../Icons';
import { getContrastText } from '../../utils/colorUtils';
import LinkRenderer from '../LinkRenderer';
import GallerySection from '../GallerySection';

interface GlassFloatingLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const GlassFloatingLayout: React.FC<GlassFloatingLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';
    const { colors, typography, layout } = theme;

    const contrastText = getContrastText(colors.primary);

    return (
        <div
            className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 ${isAr ? 'font-arabic' : ''}`}
            style={{ backgroundColor: colors.background, color: colors.text }}
            dir={dir}
        >
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: colors.primary, animationDuration: '8s' }}
                ></div>
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px] animate-pulse"
                    style={{ backgroundColor: colors.secondary, animationDuration: '12s', animationDelay: '2s' }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full opacity-10 blur-[100px] animate-bounce-subtle"
                    style={{ backgroundColor: colors.accent, animationDuration: '15s' }}
                ></div>
            </div>

            {/* Main Glass Card */}
            <main
                className="relative z-10 w-full max-w-lg bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[40px] overflow-hidden animate-scale-in"
                style={{ fontFamily: typography.fontFamily }}
            >
                {/* Header/Cover Area */}
                <div className="relative h-32 md:h-40 overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-80"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    ></div>
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                </div>

                {/* Profile Information */}
                <div className="px-6 pb-8 -mt-16 relative">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 group">
                            <div className={`absolute inset-0 bg-white rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity ${isLoading ? 'shimmer' : ''}`}></div>
                            {profileData.photoURL ? (
                                <img
                                    src={profileData.photoURL}
                                    alt={profileData.displayName}
                                    className={`w-32 h-32 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover transform transition-transform group-hover:scale-105 ${isLoading ? 'shimmer' : ''}`}
                                />
                            ) : (
                                <div
                                    className={`w-32 h-32 rounded-full border-4 border-white shadow-2xl relative z-10 flex items-center justify-center text-4xl font-bold ${isLoading ? 'shimmer' : ''}`}
                                    style={{ backgroundColor: colors.primary, color: contrastText }}
                                >
                                    {isLoading ? '' : (profileData.displayName?.charAt(0) || profileData.username.charAt(0))}
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20"></div>
                        </div>

                        <h1
                            className={`text-2xl md:text-3xl font-black mb-1 tracking-tight ${isLoading ? 'shimmer rounded-lg min-h-[40px] w-2/3' : ''}`}
                            style={{ color: colors.primary }}
                        >
                            {profileData.displayName || profileData.username}
                        </h1>

                        {profileData.businessCategory && (
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-3 block">
                                {profileData.businessCategory}
                            </span>
                        )}

                        {profileData.bio && (
                            <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto mb-6 italic transition-all">
                                "{profileData.bio}"
                            </p>
                        )}

                        {/* Unified Links Section */}
                        <div className="w-full">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <div className="h-16 bg-white/30 rounded-2xl shimmer"></div>
                                    <div className="h-16 bg-white/30 rounded-2xl shimmer"></div>
                                </div>
                            ) : (
                                <LinkRenderer
                                    links={profileData.links || []}
                                    isAr={isAr}
                                    primaryStyle="grid"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                {profileData.gallery && profileData.gallery.length > 0 && (
                    <div className="px-6 pb-4">
                        <GallerySection gallery={profileData.gallery} primaryColor={colors.primary} maxItems={4} variant="row" />
                    </div>
                )}

                {/* Footer with Contact Quick Links */}
                <div className="bg-gray-50/50 p-6 flex justify-center gap-6 border-t border-white/40">
                    {(profileData.email || isLoading) && (
                        <a href={`mailto:${profileData.email}`} className={`text-gray-400 hover:text-indigo-600 transition-colors ${isLoading ? 'shimmer w-6 h-6 rounded-full' : ''}`}>
                            {!isLoading && <EnvelopeIcon className="w-6 h-6" />}
                        </a>
                    )}
                    {(profileData.mobileNumber || isLoading) && (
                        <a href={`tel:${profileData.mobileNumber}`} className={`text-gray-400 hover:text-green-600 transition-colors ${isLoading ? 'shimmer w-6 h-6 rounded-full' : ''}`}>
                            {!isLoading && <PhoneIcon className="w-6 h-6" />}
                        </a>
                    )}
                    {(profileData.website || isLoading) && (
                        <a href={profileData.website} target="_blank" rel="noreferrer" className={`text-gray-400 hover:text-blue-600 transition-colors ${isLoading ? 'shimmer w-6 h-6 rounded-full' : ''}`}>
                            {!isLoading && <GlobeIcon className="w-6 h-6" />}
                        </a>
                    )}
                </div>
            </main>



        </div>
    );
};

export default GlassFloatingLayout;
