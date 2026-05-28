import React from 'react';
import { UserProfile } from '../../types';
import { Theme } from '../../types/theme';
import { useLanguage } from '../../LanguageContext';
import GallerySection from '../GallerySection';

interface DarkEleganceLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const DarkEleganceLayout: React.FC<DarkEleganceLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { language, dir } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div
            style={{
                minHeight: '100vh',
                background: theme.colors.background,
                fontFamily: theme.typography.fontFamily,
                padding: '3rem 1rem',
            }}
            className={`antialiased ${isAr ? 'text-right font-arabic' : 'text-left'}`}
            dir={dir}
        >
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
            }}>
                {/* Elegant Header with Gold Accent */}
                <div style={{
                    textAlign: 'center',
                    borderBottom: `2px solid ${theme.colors.primary}`,
                    paddingBottom: '2rem',
                    marginBottom: '3rem',
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `3px solid ${theme.colors.primary}`,
                        boxShadow: `0 0 30px ${theme.colors.primary}40`,
                        background: theme.colors.surface,
                    }} className={isLoading ? 'shimmer' : ''}>
                        {!isLoading && (
                            <img
                                src={profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}&size=120&background=1e293b&color=d4af37`}
                                alt={profileData.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                    </div>

                    <h1 style={{
                        fontFamily: theme.typography.headingFont,
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.primary,
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em',
                    }} className={isLoading ? 'shimmer rounded-lg min-h-[50px] w-2/3 mx-auto' : ''}>
                        {profileData.displayName || profileData.username}
                    </h1>

                    {profileData.businessCategory && (
                        <p style={{
                            fontSize: theme.typography.fontSize.lg,
                            color: theme.colors.textSecondary,
                            fontStyle: 'italic',
                            marginTop: '0.5rem',
                        }}>
                            {profileData.businessCategory}
                        </p>
                    )}
                </div>

                {/* Bio Section */}
                {(profileData.bio || isLoading) && (
                    <div style={{
                        background: theme.colors.surface,
                        padding: '2rem',
                        borderRadius: theme.layout.borderRadius.lg,
                        marginBottom: '2rem',
                        border: `1px solid ${theme.colors.border}`,
                    }} className={isLoading ? 'shimmer opacity-50' : ''}>
                        {isLoading ? (
                            <div className="h-6 w-full"></div>
                        ) : (
                            <p style={{
                                fontSize: theme.typography.fontSize.lg,
                                color: theme.colors.text,
                                lineHeight: '1.8',
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                "{profileData.bio}"
                            </p>
                        )}
                    </div>
                )}

                {/* Dynamic Actions Grid */}
                {profileData.links && profileData.links.length > 0 && (
                    <div style={{ marginBottom: '3rem' }}>
                        {/* Primary Highlight Actions */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem',
                        }}>
                            {profileData.links.filter(l => l.isPrimary).map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '1.5rem',
                                        background: theme.colors.surface,
                                        borderRadius: theme.layout.borderRadius.lg,
                                        border: `1px solid ${theme.colors.primary}40`,
                                        textDecoration: 'none',
                                        transition: 'all 0.3s',
                                    }}
                                >
                                    <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                        {link.iconType === 'whatsapp' ? '💬' :
                                            link.iconType === 'instagram' ? '📸' :
                                                link.iconType === 'star' ? '⭐' : '✨'}
                                    </span>
                                    <span style={{
                                        fontSize: theme.typography.fontSize.xs,
                                        fontWeight: 'bold',
                                        color: theme.colors.primary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                    }}>
                                        {isAr ? (link.titleAr || link.title) : link.title}
                                    </span>
                                </a>
                            ))}
                        </div>

                        {/* Secondary Links List */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1rem',
                        }}>
                            {profileData.links.filter(l => !l.isPrimary).map((link) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.25rem',
                                        background: theme.colors.surface,
                                        color: theme.colors.text,
                                        borderRadius: theme.layout.borderRadius.md,
                                        textDecoration: 'none',
                                        fontWeight: theme.typography.fontWeight.medium,
                                        border: `1px solid ${theme.colors.border}`,
                                        transition: 'all 0.3s',
                                    }}
                                    className="hover:-translate-y-0.5 hover:shadow-lg transition-all"
                                >
                                    <span style={{ fontSize: theme.typography.fontSize.sm }}>
                                        {isAr ? (link.titleAr || link.title) : link.title}
                                    </span>
                                    <span style={{ opacity: 0.3 }}>🔗</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gallery Section */}
                {profileData.gallery && profileData.gallery.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontFamily: theme.typography.headingFont,
                            fontSize: theme.typography.fontSize.xl,
                            color: theme.colors.primary,
                            marginBottom: '1rem',
                            textAlign: 'center',
                        }}>
                            {isAr ? 'معرض الصور' : 'Gallery'}
                        </h3>
                        <GallerySection gallery={profileData.gallery} primaryColor={theme.colors.primary} />
                    </div>
                )}

                {/* Contact Card */}
                <div style={{
                    background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`,
                    padding: '2rem',
                    borderRadius: theme.layout.borderRadius.lg,
                    border: `1px solid ${theme.colors.primary}`,
                    textAlign: 'center',
                }}>
                    <h3 style={{
                        fontFamily: theme.typography.headingFont,
                        fontSize: theme.typography.fontSize['2xl'],
                        color: theme.colors.primary,
                        marginBottom: '1rem',
                    }}>
                        {isAr ? 'تواصل معنا' : 'Get in Touch'}
                    </h3>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        flexWrap: 'wrap',
                        flexDirection: isAr ? 'row-reverse' : 'row',
                    }}>
                        {profileData.email && (
                            <div style={{ color: theme.colors.text }}>
                                <span style={{ color: theme.colors.primary }}>✉</span> {profileData.email}
                            </div>
                        )}
                        {profileData.mobileNumber && (
                            <div style={{ color: theme.colors.text }}>
                                <span style={{ color: theme.colors.primary }}>☎</span> {profileData.mobileNumber}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DarkEleganceLayout;
