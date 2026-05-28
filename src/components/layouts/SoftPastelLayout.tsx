import React from 'react';
import { UserProfile, UserLink } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import GallerySection from '../GallerySection';

interface SoftPastelLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const SoftPastelLayout: React.FC<SoftPastelLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div
            style={{
                minHeight: '100vh',
                background: theme.effects.gradient || theme.colors.background,
                fontFamily: theme.typography.fontFamily,
                padding: '2rem 1rem',
            }}
            className={`antialiased ${isAr ? 'text-right font-arabic' : 'text-left'}`}
            dir={dir}
        >
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
            }}>
                {/* Cute Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                }}>
                    <div style={{
                        width: '140px',
                        height: '140px',
                        margin: '0 auto 1rem',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `4px solid ${theme.colors.primary}`,
                        boxShadow: `0 8px 20px ${theme.colors.primary}40`,
                        background: 'white',
                    }} className={isLoading ? 'shimmer' : ''}>
                        {!isLoading && (
                            <img
                                src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}&size=140&background=f0abfc&color=78350f`}
                                alt={profileData.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                    </div>

                    <h1 style={{
                        fontFamily: theme.typography.headingFont,
                        fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.text,
                        marginBottom: '0.5rem',
                    }} className={isLoading ? 'shimmer rounded-lg min-h-[40px] w-2/3 mx-auto' : ''}>
                        {profileData.displayName || profileData.username} {isLoading ? '' : (isAr ? '✨' : '✨')}
                    </h1>

                    {profileData.businessCategory && (
                        <div style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: theme.colors.primary,
                            color: 'white',
                            borderRadius: theme.layout.borderRadius.full,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.semibold,
                            marginBottom: '1rem',
                        }}>
                            {profileData.businessCategory}
                        </div>
                    )}

                    {(profileData.bio || isLoading) && (
                        <p style={{
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.text,
                            lineHeight: '1.6',
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: theme.layout.borderRadius.xl,
                            backdropFilter: 'blur(10px)',
                            minHeight: isLoading ? '60px' : 'auto'
                        }} className={isLoading ? 'shimmer' : ''}>
                            {isLoading ? '' : profileData.bio}
                        </p>
                    )}
                </div>

                {/* Dynamic Actions */}
                {profileData.links && profileData.links.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Primary Bubbles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {profileData.links.filter(l => l.isPrimary).map((link, idx) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '1.5rem',
                                        background: 'white',
                                        borderRadius: '30px',
                                        boxShadow: theme.layout.shadow.md,
                                        border: `4px solid ${idx % 2 === 0 ? theme.colors.primary : theme.colors.secondary}`,
                                        textDecoration: 'none',
                                        transition: 'all 0.3s',
                                    }}
                                    className="hover:scale-105 transition-all"
                                >
                                    <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                        {link.iconType === 'whatsapp' ? '💬' :
                                            link.iconType === 'instagram' ? '📸' :
                                                link.iconType === 'star' ? '⭐' : '🍭'}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: theme.colors.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {isAr ? (link.titleAr || link.title) : link.title}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Secondary List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {profileData.links.filter(l => !l.isPrimary).map((link, index) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'block',
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.7)',
                                        color: theme.colors.text,
                                        borderRadius: '20px',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        border: `2px solid ${theme.colors.primary}40`,
                                        textAlign: 'center',
                                        fontSize: '14px',
                                    }}
                                    className="hover:bg-white transition-all"
                                >
                                    {isAr ? (link.titleAr || link.title) : link.title} ✨
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gallery Section */}
                {profileData.gallery && profileData.gallery.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.text,
                            marginBottom: '1rem',
                            textAlign: 'center',
                        }}>
                            {isAr ? 'معرض الصور 🌸' : 'Our Gallery 🌸'}
                        </h3>
                        <GallerySection gallery={profileData.gallery} primaryColor={theme.colors.primary} variant="row" />
                    </div>
                )}

                {/* Contact Section */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: theme.layout.borderRadius.xl,
                    textAlign: 'center',
                    border: `2px dashed ${theme.colors.primary}`,
                }}>
                    <p style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text,
                        marginBottom: '1rem',
                    }}>
                        {isAr ? 'دعنا نتواصل! 🌸' : "Let's Connect! 🌸"}
                    </p>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.textSecondary,
                    }}>
                        {profileData.email && <div>📧 {profileData.email}</div>}
                        {profileData.mobileNumber && <div>📱 {profileData.mobileNumber}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoftPastelLayout;
