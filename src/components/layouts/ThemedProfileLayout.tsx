import React, { Suspense } from 'react';
import { UserProfile } from '../../types';
import { Theme, ThemeId } from '../../types/theme';
import { getThemeById } from '../../themes/presets';

import ProfileSkeleton from '../ProfileSkeleton';
import PublicFeatureManager from '../../features/profile/PublicFeatureManager';
import { generatePalette } from '../../utils/colorUtils';
import WelcomeSplash from '../WelcomeSplash';
import ConnectButton from '../../features/connections/ConnectButton';
import { ConnectionsProvider } from '../../contexts/ConnectionsContext';
import { useAuth } from '../../hooks/useAuth';
import WhatsAppFloatingBubble from '../WhatsAppFloatingBubble';
import SaveContactButton from '../SaveContactButton';
import WorksAtBadge from '../WorksAtBadge';
import LeadCaptureBlock from '../../features/profile/blocks/LeadCaptureBlock';
import AppointmentBookingBlock from '../../features/profile/blocks/AppointmentBookingBlock';
import TestimonialsBlock from '../../features/profile/blocks/TestimonialsBlock';
import PortfolioBlock from '../../features/profile/blocks/PortfolioBlock';
import VideoIntroBubble from '../../features/profile/blocks/VideoIntroBubble';

// Lazy Loaded Layouts (Aggressive Code Splitting)
const BusinessLayout = React.lazy(() => import('./BusinessLayout'));
const NgoLayout = React.lazy(() => import('./NgoLayout'));
const ModernGradientLayout = React.lazy(() => import('./ModernGradientLayout'));
const DarkEleganceLayout = React.lazy(() => import('./DarkEleganceLayout'));
const SoftPastelLayout = React.lazy(() => import('./SoftPastelLayout'));
const GlassFloatingLayout = React.lazy(() => import('./GlassFloatingLayout'));
const BentoGridLayout = React.lazy(() => import('./BentoGridLayout'));
const SplitProLayout = React.lazy(() => import('./SplitProLayout'));
const StoryVerticalLayout = React.lazy(() => import('./StoryVerticalLayout'));
const LumiaTilesLayout = React.lazy(() => import('./LumiaTilesLayout'));

const ImmersiveProfile = React.lazy(() => import('../../features/profile/ImmersiveProfile'));
const BentoProfile = React.lazy(() => import('../../features/profile/BentoProfile'));

interface ThemedProfileLayoutProps {
    profileData: UserProfile;
    themeId?: ThemeId;
    isLoading?: boolean;
}

const ThemedProfileLayout: React.FC<ThemedProfileLayoutProps> = ({
    profileData,
    themeId = 'modern-gradient',
    isLoading = false
}) => {
    // 0. Compute Dynamic Theme based on User Settings
    const baseTheme = getThemeById(profileData.themeId || themeId);
    let theme = { ...baseTheme };

    if (profileData.themeSettings?.primaryColor) {
        const customPalette = generatePalette(profileData.themeSettings.primaryColor);
        theme.colors = { ...theme.colors, ...customPalette };
    }

    // SANITIZE: Remove system-generated emails from display
    const isSystemEmail = profileData.email && (
        profileData.email.endsWith('@neoays.com') ||
        profileData.email.includes('auth.neoays')
    );

    const displayProfileData = {
        ...profileData,
        email: isSystemEmail ? '' : profileData.email
    };

    const renderLayout = () => {
        const layoutStyle = displayProfileData.themeSettings?.layoutStyle;

        // 1. Check for Advanced Layout Styles First (Priority)
        if (layoutStyle) {
            switch (layoutStyle) {
                case 'floating':
                    return <GlassFloatingLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
                case 'bento':
                    return <BentoGridLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
                case 'split':
                    return <SplitProLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
                case 'story':
                    return <StoryVerticalLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
                case 'immersive':
                    return <ImmersiveProfile profileData={displayProfileData} isLoading={isLoading} />;
                case 'bento_modern':
                    return <BentoProfile profileData={displayProfileData} isLoading={isLoading} />;
                case 'lumia':
                    return <LumiaTilesLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
                default:
                    break; // Fall through to type-based defaults
            }
        }

        // 2. Fallback to Profile Type Defaults
        if (displayProfileData.profileType === 'business') {
            return <BusinessLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
        }

        if (displayProfileData.profileType === 'ngo') {
            return <NgoLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
        }

        // 3. Fallback to Theme-based layouts for Personal profiles
        switch (theme.id) {
            case 'dark-elegance':
                return <DarkEleganceLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
            case 'soft-pastel':
                return <SoftPastelLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
            default:
                return <ModernGradientLayout profileData={displayProfileData} theme={theme} isLoading={isLoading} />;
        }
    };

    const { currentUser } = useAuth();

    // Filter links with displayStyle: 'bubble'
    const bubbleLinks = (displayProfileData.links || []).filter(link => link.displayStyle === 'bubble');

    return (
        <div className="min-h-screen">
            <ConnectionsProvider userId={currentUser?.uid || ''}>
                <Suspense fallback={null}>
                    {renderLayout()}
                </Suspense>

                {/* FLOATING ACTION BAR */}
                <div className="fixed bottom-6 left-0 right-0 z-[100] pointer-events-none flex justify-center px-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="pointer-events-auto flex items-center gap-2 bg-white/30 backdrop-blur-xl p-2 rounded-full border border-white/50 shadow-2xl">
                        {(displayProfileData.connectEnabled ?? true) && <ConnectButton profileData={displayProfileData} />}
                        <SaveContactButton profileData={displayProfileData} />
                    </div>
                </div>

                <WhatsAppFloatingBubble
                    mobileNumber={displayProfileData.mobileNumber}
                    profileName={displayProfileData.displayName || displayProfileData.username}
                />
                {/* Floating Bubble Links */}
                {bubbleLinks.length > 0 && (
                    <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-2">
                        {bubbleLinks.map((link, idx) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                title={link.title}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {link.iconType === 'phone' ? '📞' :
                                    link.iconType === 'email' ? '✉️' :
                                        link.iconType === 'whatsapp' ? '💬' :
                                            link.iconType === 'location' ? '📍' : '🔗'}
                            </a>
                        ))}
                    </div>
                )}
            </ConnectionsProvider>
            <WorksAtBadge
                worksAt={displayProfileData.worksAt}
                worksAtDisplay={displayProfileData.worksAtDisplay}
                primaryColor={displayProfileData.themeSettings?.primaryColor}
            />

            {/* Digital Portfolio */}
            {(displayProfileData.portfolioEnabled ?? false) && (
                <div className="animate-fade-in-up" style={{ background: theme?.colors?.surface || '#ffffff', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}>
                    <PortfolioBlock
                        profileId={displayProfileData.id || ''}
                        profileName={displayProfileData.displayName || displayProfileData.username}
                        primaryColor={displayProfileData.themeSettings?.primaryColor}
                    />
                </div>
            )}

            {/* Endorsements & Testimonials */}
            {(displayProfileData.testimonialsEnabled ?? false) && (
                <div className="animate-fade-in-up" style={{ background: theme?.colors?.background || '#f9fafb', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}>
                    <TestimonialsBlock
                        profileId={displayProfileData.id || ''}
                        profileName={displayProfileData.displayName || displayProfileData.username}
                        primaryColor={displayProfileData.themeSettings?.primaryColor}
                    />
                </div>
            )}

            {/* Interactive Appointment Booking */}
            {(displayProfileData.appointmentsEnabled ?? false) && (
                <div className="animate-fade-in-up" style={{ background: theme?.colors?.surface || '#ffffff', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}>
                    <AppointmentBookingBlock
                        profileId={displayProfileData.id || ''}
                        profileName={displayProfileData.displayName || displayProfileData.username}
                        primaryColor={displayProfileData.themeSettings?.primaryColor}
                    />
                </div>
            )}

            {/* Global Lead Capture Form */}
            {(displayProfileData.leadCaptureEnabled ?? false) && (
                <div className="animate-fade-in-up" style={{ background: theme?.colors?.background || '#f0f2f5', paddingBottom: '1rem', paddingTop: '0.5rem' }}>
                    <LeadCaptureBlock
                        profileId={displayProfileData.id || ''}
                        profileName={displayProfileData.displayName || displayProfileData.username}
                        primaryColor={displayProfileData.themeSettings?.primaryColor}
                    />
                </div>
            )}

            {/* Video / Voice Intro Bubble */}
            {(displayProfileData.introVideoEnabled ?? false) && displayProfileData.introVideoUrl && (
                <VideoIntroBubble
                    videoUrl={displayProfileData.introVideoUrl}
                    profileName={displayProfileData.displayName || displayProfileData.username || ''}
                    primaryColor={displayProfileData.themeSettings?.primaryColor}
                />
            )}

            <PublicFeatureManager profileData={displayProfileData} />

            {/* ── Centralized branding — always absolute bottom, small & theme-colored ── */}
            <div className="py-6 flex items-center justify-center gap-1.5 opacity-40 hover:opacity-70 transition-opacity">
                <span
                    className="text-[8px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: displayProfileData.themeSettings?.primaryColor || '#6366f1' }}
                >
                    Powered by Neoays
                </span>
            </div>
        </div>
    );
};

export default ThemedProfileLayout;
