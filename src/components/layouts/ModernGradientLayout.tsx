import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Theme } from '../../types/theme';
import { EnvelopeIcon, MapMarkerIcon, PhoneIcon, GlobeIcon } from '../Icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { CheckCircleIcon } from '../Icons';
import { useLanguage } from '../../LanguageContext';
import { UserLink } from '../../types';
import LinkRenderer from '../LinkRenderer';
import WorksAtInline from '../WorksAtInline';

interface ModernGradientLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const ModernGradientLayout: React.FC<ModernGradientLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { colors, typography, layout, effects } = theme;

    // Feedback State
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
    const [submissionCount, setSubmissionCount] = useState(0);

    React.useEffect(() => {
        const count = parseInt(localStorage.getItem(`feedback_count_${profileData.username}`) || '0');
        setSubmissionCount(count);
    }, [profileData.username]);

    const handleFeedbackSubmit = async (option: string) => {
        if (submissionCount >= 4) {
            alert("Maximum feedback submissions reached.");
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            if (db && profileData.id) {
                await addDoc(collection(db, 'feedback'), {
                    userId: profileData.id,
                    source: option,
                    timestamp: serverTimestamp(),
                    rating: 5,
                    comment: `Selected: ${option}` // Simple selection for now
                });
            }

            const newCount = submissionCount + 1;
            setSubmissionCount(newCount);
            localStorage.setItem(`feedback_count_${profileData.username}`, newCount.toString());

            setTimeout(() => {
                setIsSubmittingFeedback(false);
                setShowFeedbackSuccess(true);
            }, 600);
        } catch (err) {
            console.error("Feedback error:", err);
            setIsSubmittingFeedback(false);
            setShowFeedbackSuccess(true);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: effects.gradient || `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            color: colors.text,
            fontFamily: typography.fontFamily,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            padding: '2rem 1rem',
            position: 'relative' as const,
            overflow: 'hidden' as const,
        },
        glassCard: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: layout.borderRadius.xl,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '600px',
            padding: layout.spacing.xl,
            position: 'relative' as const,
            zIndex: 10,
            border: '1px solid rgba(255, 255, 255, 0.5)',
        },
        profileImageContainer: {
            position: 'relative' as const,
            margin: '-5rem auto 1.5rem',
            width: '160px',
            height: '160px',
        },
        profileImage: {
            width: '100%',
            height: '100%',
            borderRadius: '40%', // Squircle-ish
            border: `6px solid white`,
            boxShadow: layout.shadow.xl,
            objectFit: 'cover' as const,
            transform: 'rotate(-3deg)',
        },
        name: {
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            color: '#1f2937', // Always dark for contrast on card
            textAlign: 'center' as const,
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em',
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            width: '100%',
        },
        subtitle: {
            fontSize: typography.fontSize.lg,
            color: '#6b7280',
            textAlign: 'center' as const,
            marginBottom: '1.5rem',
            fontWeight: 500,
        },
        bio: {
            textAlign: 'center' as const,
            color: '#4b5563',
            marginBottom: layout.spacing.lg,
            lineHeight: 1.7,
            fontSize: typography.fontSize.base,
        },
        sectionTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: '#374151',
            marginBottom: layout.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        contactItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: layout.borderRadius.lg,
            marginBottom: '0.75rem',
            transition: 'all 0.3s ease',
            border: '1px solid #e5e7eb',
        },
        linkCard: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem',
            backgroundColor: '#fff',
            borderRadius: layout.borderRadius.lg,
            border: '1px solid #e5e7eb',
            marginBottom: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        },
        socialButton: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            transition: 'all 0.3s ease',
        }
    };

    const { language, dir } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div
            style={styles.container}
            className={`antialiased ${isAr ? 'font-arabic text-right' : 'text-left'}`}
            dir={dir}
        >
            {/* Animated Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white opacity-10 blur-3xl animate-float" style={{ animationDuration: '15s' }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-black opacity-5 blur-3xl animate-float" style={{ animationDuration: '20s', animationDelay: '2s' }}></div>
            </div>

            <main style={styles.glassCard} className="animate-scale-in">
                {/* Hero Section with Cover */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-[2rem]">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 z-10 pointer-events-none"></div>
                    <img
                        src={profileData.coverURL || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80'}
                        className="w-full h-full object-cover"
                        alt="Cover"
                    />
                </div>

                {/* Profile Header (Overlapping Hero) */}
                <div style={styles.profileImageContainer} className={`animate-float -mt-28 relative z-20 ${isLoading ? 'shimmer' : ''}`}>
                    {profileData.photoURL ? (
                        <img src={profileData.photoURL} alt={profileData.displayName} style={styles.profileImage} className="hover:rotate-0 transition-transform duration-500" />
                    ) : (
                        <div style={{ ...styles.profileImage, background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem' }}>
                            {isLoading ? '' : (profileData.displayName?.charAt(0) || 'U')}
                        </div>
                    )}
                    {!isLoading && (
                        <div className={`absolute bottom-2 ${isAr ? 'left-2' : 'right-2'} bg-white rounded-full p-2 shadow-lg animate-pulse-glow border-2 border-white`}>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    )}
                </div>

                <div className="text-center mb-8">
                    <h1 style={styles.name} className={`animate-fade-in-up ${isLoading ? 'shimmer rounded-lg min-h-[40px] w-2/3 mx-auto' : ''}`}>
                        {profileData.displayName || `@${profileData.username}`}
                    </h1>

                    {/* Profile Type Badge */}
                    <div className="flex justify-center mb-2">
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-gray-200">
                            {profileData.profileType?.replace('_', ' ') || 'Personal'}
                        </span>
                    </div>

                    {profileData.subtitle && (
                        <p className="animate-fade-in-up" style={{ ...styles.subtitle, animationDelay: '0.1s' }}>{profileData.subtitle}</p>
                    )}

                    {isLoading && (
                        <div className="space-y-2 mt-4 px-8">
                            <div className="h-3 bg-gray-100 rounded shimmer w-full"></div>
                            <div className="h-3 bg-gray-100 rounded shimmer w-5/6 mx-auto"></div>
                        </div>
                    )}

                    {profileData.ngoDetails?.bloodDonationCount !== undefined && profileData.ngoDetails.bloodDonationCount > 0 && (
                        <div className={`inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold mb-4 animate-bounce-subtle ${isAr ? 'flex-row-reverse' : ''}`}>
                            <span>🩸</span> {isAr ? 'متبرع بالدم' : 'Blood Donor'} ({profileData.ngoDetails.bloodDonationCount} {isAr ? 'مرات' : 'times'})
                        </div>
                    )}

                    {profileData.bio && (
                        <p className="animate-fade-in-up" style={{ ...styles.bio, animationDelay: '0.2s' }}>
                            {profileData.bio}
                        </p>
                    )}

                    {/* Works At Inline */}
                    {(profileData.worksAtDisplay === 'inline' || !profileData.worksAtDisplay) && profileData.worksAt && (
                        <div className="flex justify-center mt-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                            <WorksAtInline
                                worksAt={profileData.worksAt}
                                primaryColor={profileData.themeSettings?.primaryColor}
                            />
                        </div>
                    )}

                    {/* Social Highlights (if any) */}
                    <div className={`flex justify-center gap-4 mt-6 animate-fade-in-up ${isAr ? 'flex-row-reverse' : ''}`} style={{ animationDelay: '0.3s' }}>
                        {!isLoading ? (
                            <>
                                <a href={`mailto:${profileData.email}`} style={styles.socialButton} className="hover:bg-blue-50 hover:text-blue-600 hover:scale-110">
                                    <EnvelopeIcon className="w-5 h-5" />
                                </a>
                                {profileData.mobileNumber && (
                                    <a href={`https://wa.me/${profileData.mobileNumber?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={styles.socialButton} className="hover:bg-green-50 hover:text-green-600 hover:scale-110">
                                        <span className="text-lg">💬</span>
                                    </a>
                                )}
                                {profileData.website && (
                                    <a href={profileData.website} target="_blank" rel="noreferrer" style={styles.socialButton} className="hover:bg-purple-50 hover:text-purple-600 hover:scale-110">
                                        <GlobeIcon className="w-5 h-5" />
                                    </a>
                                )}
                            </>
                        ) : (
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 shimmer"></div>
                                <div className="w-12 h-12 rounded-full bg-gray-100 shimmer"></div>
                                <div className="w-12 h-12 rounded-full bg-gray-100 shimmer"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-gray-200 my-8"></div>

                {/* Professional Affiliations (Work Experience) */}
                {profileData.workExperience && profileData.workExperience.length > 0 && (
                    <div className="mb-8 animate-fade-in-up">
                        <h3 style={styles.sectionTitle}>
                            <span className="w-8 h-1 rounded-full bg-blue-500 block"></span>
                            {isAr ? 'الارتباطات والخبرة' : 'Affiliations & Experience'}
                        </h3>
                        <div className="space-y-3">
                            {profileData.workExperience.map((work, idx) => (
                                <a
                                    key={idx}
                                    href={`/${work.username}`}
                                    style={styles.contactItem}
                                    className={`flex justify-between items-center group hover:bg-white hover:shadow-md cursor-pointer ${isAr ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`flex items-center ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-lg overflow-hidden ${isAr ? 'ml-3' : 'mr-3'} group-hover:rotate-6 transition-transform border border-gray-100 bg-gray-50 flex items-center justify-center`}>
                                            {work.photoURL ? (
                                                <img src={work.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-blue-600">🏢</span>
                                            )}
                                        </div>
                                        <div className={isAr ? 'text-right' : 'text-left'}>
                                            <p className="font-bold text-gray-800 text-sm">{work.companyName}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{work.role}</p>
                                        </div>
                                    </div>
                                    {work.status === 'active' && (
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact Section */}
                {!isLoading ? (
                    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h3 style={styles.sectionTitle}>
                            <span className="w-8 h-1 rounded-full bg-indigo-500 block"></span>
                            {isAr ? 'معلومات الاتصال' : 'Contact Info'}
                        </h3>
                        {profileData.email && (
                            <a href={`mailto:${profileData.email}`} style={styles.contactItem} className={`group hover:bg-white hover:shadow-md cursor-pointer ${isAr ? 'flex-row-reverse' : ''}`}>
                                <span className={`p-2 bg-indigo-50 rounded-lg text-indigo-600 ${isAr ? 'ml-3' : 'mr-3'} group-hover:scale-110 transition-transform`}>
                                    <EnvelopeIcon className="w-5 h-5" />
                                </span>
                                <span className="font-medium text-gray-700">{profileData.email}</span>
                            </a>
                        )}
                        {profileData.mobileNumber && (
                            <a href={`tel:${profileData.mobileNumber}`} style={styles.contactItem} className={`group hover:bg-white hover:shadow-md cursor-pointer ${isAr ? 'flex-row-reverse' : ''}`}>
                                <span className={`p-2 bg-green-50 rounded-lg text-green-600 ${isAr ? 'ml-3' : 'mr-3'} group-hover:scale-110 transition-transform`}>
                                    <PhoneIcon className="w-5 h-5" />
                                </span>
                                <span className="font-medium text-gray-700">{profileData.mobileNumber}</span>
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="mb-8 blur-[2px] opacity-30 pointer-events-none">
                        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                        <div className="h-16 bg-gray-100 rounded-xl mb-3"></div>
                        <div className="h-16 bg-gray-100 rounded-xl"></div>
                    </div>
                )}

                {/* Vouchers / Offers Section */}
                {profileData.vouchers && profileData.vouchers.length > 0 && !isLoading && (
                    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                        <h3 style={styles.sectionTitle}>
                            <span className="w-8 h-1 rounded-full bg-amber-500 block"></span>
                            {isAr ? 'العروض الحصرية' : 'Exclusive Offers'}
                        </h3>
                        <div className="space-y-3">
                            {profileData.vouchers.map((voucher) => (
                                <div
                                    key={voucher.id}
                                    className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {voucher.imageUrl ? (
                                            <img src={voucher.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center text-2xl">
                                                🎁
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{voucher.title}</p>
                                            <p className="text-amber-600 font-black text-sm">{voucher.value}</p>
                                            {voucher.expiryDate && (
                                                <p className="text-[10px] text-gray-400">
                                                    {isAr ? 'ينتهي' : 'Expires'}: {new Date(voucher.expiryDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <a
                                        href={`/offer/${profileData.username}/${voucher.id}`}
                                        className="shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-full hover:shadow-lg hover:scale-105 transition-all"
                                    >
                                        {isAr ? 'استبدال' : 'Redeem'}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gallery Section */}
                {profileData.gallery && profileData.gallery.length > 0 && !isLoading && (
                    <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.48s' }}>
                        <h3 style={styles.sectionTitle}>
                            <span className="w-8 h-1 rounded-full bg-purple-500 block"></span>
                            {isAr ? 'معرض الصور' : 'Gallery'}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {profileData.gallery.slice(0, 6).map((item) => (
                                <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <span className="text-3xl">▶️</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Section / Unified Links */}
                {((profileData.links && profileData.links.length > 0) || isLoading) && (
                    <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <h3 style={styles.sectionTitle} className="mb-6">
                            <span className="w-8 h-1 rounded-full bg-pink-500 block"></span>
                            {isAr ? 'روابطي' : 'My Showcase'}
                        </h3>

                        {isLoading ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-24 bg-gray-50 rounded-2xl shimmer"></div>
                                    <div className="h-24 bg-gray-50 rounded-2xl shimmer"></div>
                                </div>
                                <div className="h-16 bg-gray-50 rounded-2xl shimmer"></div>
                                <div className="h-16 bg-gray-50 rounded-2xl shimmer"></div>
                            </div>
                        ) : (
                            <LinkRenderer
                                links={profileData.links || []}
                                isAr={isAr}
                                primaryStyle="grid"
                            />
                        )}
                    </div>
                )}

                {/* Feedback Section */}
                {profileData.feedbackEnabled && (
                    <div className="mt-10 p-6 bg-gray-50/80 rounded-2xl border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        {!showFeedbackSuccess ? (
                            <>
                                <div className="text-center mb-4">
                                    <h3 className="font-bold text-gray-800">{isAr ? 'ألقِ التحية!' : 'Say Hello!'}</h3>
                                    <p className="text-xs text-gray-500">{isAr ? 'كيف وجدتني؟' : 'How did you find me?'}</p>
                                </div>
                                <div className={`flex flex-wrap justify-center gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    {(isAr ? ['صديق', 'إنستغرام', 'بحث', 'آخر'] : ['Friend', 'Instagram', 'Search', 'Other']).map((option, idx) => (
                                        <button
                                            key={option}
                                            onClick={() => handleFeedbackSubmit(option)}
                                            disabled={isSubmittingFeedback || submissionCount >= 4}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50"
                                        >
                                            {isSubmittingFeedback ? '...' : option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-2 animate-scale-in">
                                <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full text-green-600 mb-2">
                                    <CheckCircleIcon className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">{isAr ? 'شكراً لتواصلك!' : 'Thanks for connecting!'}</p>
                            </div>
                        )}
                    </div>
                )}

            </main>

            <footer className="mt-8 text-center text-white/60 text-sm font-medium z-10">
                <p>&copy; {new Date().getFullYear()} {profileData.displayName}</p>
            </footer>
        </div>
    );
};

export default ModernGradientLayout;
