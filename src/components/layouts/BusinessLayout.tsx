import React, { useState } from 'react';
import { UserProfile, Voucher } from '../../types';
import { Theme } from '../../types/theme';
import { EnvelopeIcon, MapMarkerIcon, PhoneIcon, GlobeIcon } from '../Icons';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../services/firebaseConfig';
import { SpinnerIcon, CheckCircleIcon, DocumentTextIcon } from '../Icons';
import { useVoucherClaim } from '../../hooks/useVoucherClaim'; // Import Hook
import { useLanguage } from '../../LanguageContext';
import LinkRenderer from '../LinkRenderer';

interface BusinessLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

const BusinessLayout: React.FC<BusinessLayoutProps> = ({ profileData, theme, isLoading = false }) => {
    const { colors, typography, layout, effects } = theme;

    // Hook
    const { claimVoucher, loading: claimLoading, error: hookError } = useVoucherClaim();

    // Feedback & Reward State
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
    const [submissionCount, setSubmissionCount] = useState(0);

    // Reward Claim State
    const [rewardVoucher, setRewardVoucher] = useState<Voucher | null>(null);
    const [claimStep, setClaimStep] = useState<'locked' | 'unlocked' | 'auth' | 'claiming' | 'success'>('locked');
    const [claimMobile, setClaimMobile] = useState('');
    const [claimPassword, setClaimPassword] = useState('');
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [claimError, setClaimError] = useState('');

    // List Claim State
    const [claimingVoucherId, setClaimingVoucherId] = useState<string | null>(null);

    // Initialize count and find correct voucher
    React.useEffect(() => {
        const count = parseInt(localStorage.getItem(`feedback_count_${profileData.username}`) || '0');
        setSubmissionCount(count);

        if (profileData.feedbackRewardEnabled && profileData.vouchers?.length) {
            const v = profileData.vouchers.find(v => v.id === profileData.feedbackRewardVoucherId) || profileData.vouchers[0];
            setRewardVoucher(v);
        }

        // Prefill Country Code
        if (profileData.countryCode && !claimMobile) {
            setClaimMobile(profileData.countryCode);
        } else if (!claimMobile) {
            setClaimMobile('+971'); // Default fallback
        }
    }, [profileData]);

    // Handle Feedback Reward Claim
    const handleClaim = async () => {
        if (!rewardVoucher) return;
        setClaimError('');

        // 1. Check if logged in
        if (auth.currentUser) {
            await executeClaim(rewardVoucher, auth.currentUser.uid);
        } else {
            setClaimStep('auth');
        }
    };

    // Handle Auth for Reward Claim
    const handleQuickAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Ensure valid length (Rough check: 8 digits after code)
        if (!claimMobile || claimMobile.length < 8) {
            setClaimError("Please enter a valid mobile number");
            return;
        }

        setClaimStep('claiming');
        const email = `${claimMobile.replace('+', '')}@neoays.com`; // Normalize email

        try {
            let uid;

            // Scenario 1: Existing User (Password required)
            if (isExistingUser) {
                if (!claimPassword) {
                    setClaimError("Please enter your password");
                    setClaimStep('auth');
                    return;
                }
                const userCred = await signInWithEmailAndPassword(auth, email, claimPassword);
                uid = userCred.user.uid;
            }
            // Scenario 2: New User (Standard Flow)
            else {
                const password = claimMobile; // Default password = Mobile Number
                try {
                    // Try to CREATE first
                    const newUser = await createUserWithEmailAndPassword(auth, email, password);
                    uid = newUser.user.uid;

                    // Initialize Profile
                    await setDoc(doc(db, 'users', uid), {
                        username: claimMobile.replace('+', ''),
                        mobileNumber: claimMobile,
                        email: email,
                        createdAt: serverTimestamp(),
                        country: profileData.country || 'UAE', // Inherit context
                        city: profileData.city || '',
                        profileType: 'personal' // Default for claimers
                    });
                } catch (createErr: any) {
                    // If email exists, they must Login
                    if (createErr.code === 'auth/email-already-in-use') {
                        setIsExistingUser(true);
                        setClaimError("User exists. Please enter password.");
                        setClaimStep('auth');
                        return; // Stop here, UI will show password field
                    }
                    throw createErr;
                }
            }

            if (uid && auth.currentUser) {
                await executeClaim(rewardVoucher!, uid, auth.currentUser); // Pass user object
            }

        } catch (err: any) {
            console.error("Auth error:", err);
            setClaimError(err.message || "Authentication failed");
            setClaimStep('auth');
        }
    };

    // Unified Execution for Reward Flow
    const executeClaim = async (voucher: Voucher, uid: string, userObj?: any) => {
        setClaimStep('claiming');
        const currentUser = userObj || auth.currentUser;
        if (!currentUser) return;

        const success = await claimVoucher(
            voucher,
            profileData.id!,
            profileData.username || 'NEO',
            currentUser,
            claimMobile
        );

        if (success) {
            setClaimStep('success');
            setTimeout(() => {
                if (window.location.hash) {
                    window.location.hash = '#/dashboard';
                } else {
                    window.location.pathname = '/dashboard';
                }
            }, 1000);
        } else {
            setClaimError(hookError || "Failed to save voucher.");
            setClaimStep('auth');
        }
    };

    // Handle List Item Claim (For the "Latest Offers" grid)
    const handleListClaim = async (voucher: Voucher) => {
        // Must be logged in to claim from list (for now, simply redirect to login if not)
        if (!auth.currentUser) {
            // Ideally prompt login modal, for now using alert/redirect
            if (window.confirm("You need to login to claim this offer. Go to login?")) {
                window.location.hash = '#/login';
            }
            return;
        }

        if (!profileData.id) return;

        setClaimingVoucherId(voucher.id);
        const success = await claimVoucher(
            voucher,
            profileData.id,
            profileData.username,
            auth.currentUser,
            auth.currentUser.email || ''
        );

        if (success) {
            window.alert("Voucher claimed successfully! Check your wallet.");
            // Optional: Redirect
            window.location.hash = '#/dashboard';
        } else {
            window.alert("Failed to claim: " + (hookError || "Unknown error"));
        }
        setClaimingVoucherId(null);
    };


    const handleFeedbackSubmit = async (option: string) => {
        if (submissionCount >= 4) {
            window.alert("Maximum feedback submissions reached.");
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
                    comment: `Selected: ${option}`
                });
            }

            // Update local limits
            const newCount = submissionCount + 1;
            setSubmissionCount(newCount);
            localStorage.setItem(`feedback_count_${profileData.username}`, newCount.toString());

            setTimeout(() => {
                setIsSubmittingFeedback(false);
                setShowFeedbackSuccess(true);
                // Unlock reward if enabled
                if (profileData.feedbackRewardEnabled && rewardVoucher) {
                    setClaimStep('unlocked');
                }
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
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: typography.fontFamily,
            paddingBottom: '4rem',
        },
        header: {
            background: effects.gradient || colors.primary,
            padding: '4rem 2rem 8rem',
            position: 'relative' as const,
            clipPath: 'polygon(0 0, 100% 0, 100% 88%, 0 100%)',
            marginBottom: '-5rem',
        },
        content: {
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '0 1.5rem',
            position: 'relative' as const,
            zIndex: 10,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: layout.borderRadius.xl,
            boxShadow: layout.shadow.xl,
            padding: layout.spacing.xl,
            marginBottom: layout.spacing.xl,
            border: `1px solid ${colors.border}`,
            backdropFilter: 'blur(20px)',
        },
        profileSection: {
            textAlign: 'center' as const,
            marginBottom: layout.spacing.xl,
        },
        profileImage: {
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: `6px solid ${colors.surface}`,
            boxShadow: layout.shadow.xl,
            objectFit: 'cover' as const,
            margin: '0 auto 1.5rem',
            display: 'block',
        },
        sectionTitle: {
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: layout.spacing.lg,
            position: 'relative' as const,
            display: 'inline-block',
        },
        contactGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: layout.spacing.md,
            marginBottom: layout.spacing.xl,
        },
        contactItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '1.25rem',
            backgroundColor: colors.background,
            borderRadius: layout.borderRadius.lg,
            border: `1px solid ${colors.border}`,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
        },
        vouchersGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: layout.spacing.lg,
            marginBottom: '2rem',
        },
    };

    const { language, dir } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div style={styles.container} className={`antialiased ${isAr ? 'text-right font-arabic' : 'text-left'}`}>
            {/* Elegant Header */}
            <header style={styles.header}>
                <div className="absolute inset-0 bg-black/5 opacity-20 pattern-grid-lg"></div>
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
            </header>

            <main style={styles.content}>
                {/* Main Profile Card */}
                <div style={styles.card} className="animate-fade-in-up">
                    <div style={styles.profileSection}>
                        {profileData.photoURL ? (
                            <img
                                src={profileData.photoURL}
                                alt={profileData.displayName}
                                style={styles.profileImage}
                                className={`transform hover:scale-105 transition-transform duration-500 ${isLoading ? 'shimmer' : ''}`}
                            />
                        ) : (
                            <div style={{ ...styles.profileImage, backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: 'white' }} className={isLoading ? 'shimmer' : ''}>
                                <span>{isLoading ? '' : (profileData.displayName?.charAt(0) || profileData.username.charAt(0))}</span>
                            </div>
                        )}

                        <h1 className={`text-4xl font-extrabold mb-2 tracking-tight animate-fade-in-up ${isLoading ? 'shimmer rounded-lg min-h-[50px] w-2/3 mx-auto' : ''}`} style={{ fontFamily: typography.headingFont, color: colors.text }}>
                            {profileData.displayName || `@${profileData.username}`}
                        </h1>

                        {profileData.subtitle && (
                            <p className="text-lg font-medium opacity-80 mb-4 max-w-2xl mx-auto">
                                {profileData.subtitle}
                            </p>
                        )}

                        {profileData.businessCategory && (
                            <span className="inline-block px-5 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider animate-scale-in"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: '#fff',
                                }}>
                                {profileData.businessCategory}
                            </span>
                        )}

                        <div className="flex flex-wrap gap-4 justify-center mt-8 mb-4">
                            <button className="flex-1 min-w-[160px] max-w-[200px] py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg transform hover:-translate-y-1 transition-all duration-300 animate-scale-in"
                                style={{ backgroundColor: colors.secondary, color: 'white' }}>
                                {isAr ? 'حفظ جهة الاتصال' : 'Save Contact'}
                            </button>
                            {profileData.pdfUrl && (
                                <a
                                    href={profileData.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[160px] max-w-[200px] py-3.5 px-6 rounded-xl font-bold text-sm shadow-lg transform hover:-translate-y-1 transition-all duration-300 animate-scale-in flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#10b981', color: 'white' }}
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    {isAr ? 'عرض الكتالوج' : 'View Catalog'}
                                </a>
                            )}
                        </div>

                        <p className="mt-6 text-gray-500 leading-relaxed max-w-3xl mx-auto transition-all">
                            {profileData.bio || (isAr ? "أهلاً بكم في ملفنا التجاري الرسمي. استكشفوا خدماتنا وعروضنا الحصرية أدناه." : "Welcome to our official business profile. Explore our exclusive services and offers below.")}
                        </p>
                    </div>

                    {/* Contact Information Grid */}
                    <div style={styles.contactGrid} dir={dir}>
                        {profileData.email && (
                            <a href={`mailto:${profileData.email}`} style={styles.contactItem} className="group hover:shadow-lg animate-stagger-1">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isAr ? 'ml-4' : 'mr-4'}`} style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                    <EnvelopeIcon className="w-5 h-5" />
                                </span>
                                <div className={isAr ? 'text-right' : 'text-left'}>
                                    <p className="text-xs font-bold opacity-50 uppercase">{isAr ? 'راسلنا عبر البريد' : 'Email Us'}</p>
                                    <p className="font-semibold text-sm truncate">{profileData.email}</p>
                                </div>
                            </a>
                        )}
                        {profileData.mobileNumber && (
                            <a href={`tel:${profileData.mobileNumber}`} style={styles.contactItem} className="group hover:shadow-lg animate-stagger-2">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isAr ? 'ml-4' : 'mr-4'}`} style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                    <PhoneIcon className="w-5 h-5" />
                                </span>
                                <div className={isAr ? 'text-right' : 'text-left'}>
                                    <p className="text-xs font-bold opacity-50 uppercase">{isAr ? 'اتصل بنا' : 'Call Us'}</p>
                                    <p className="font-semibold text-sm">{profileData.mobileNumber}</p>
                                </div>
                            </a>
                        )}
                        {profileData.location && (
                            <div style={styles.contactItem} className="group hover:shadow-lg animate-stagger-3">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isAr ? 'ml-4' : 'mr-4'}`} style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                    <MapMarkerIcon className="w-5 h-5" />
                                </span>
                                <div className={isAr ? 'text-right' : 'text-left'}>
                                    <p className="text-xs font-bold opacity-50 uppercase">{isAr ? 'زورونا' : 'Visit Us'}</p>
                                    <p className="font-semibold text-sm">{profileData.location}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Unified Link Manager Section */}
                    <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className={`flex items-center gap-4 mb-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                            <h3 style={styles.sectionTitle}>
                                {isAr ? 'روابطنا السريعة' : 'Our Connections'}
                                <span className={`block h-1 w-12 rounded-full mt-2 ${isAr ? 'mr-auto' : 'ml-0'}`} style={{ backgroundColor: colors.accent }}></span>
                            </h3>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="h-28 bg-gray-100 rounded-2xl shimmer"></div>
                                    <div className="h-28 bg-gray-100 rounded-2xl shimmer"></div>
                                </div>
                            </div>
                        ) : (
                            <LinkRenderer
                                links={profileData.links || []}
                                isAr={isAr}
                                primaryStyle="grid"
                            />
                        )}
                    </div>

                    {/* Feedback & Surveys */}
                    {profileData.feedbackEnabled && (
                        <div className="mb-10 p-8 bg-gray-50/80 rounded-2xl border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            {!showFeedbackSuccess ? (
                                <>
                                    <div className="text-center mb-6">
                                        <h3 className="font-bold text-xl text-gray-800 mb-2">{isAr ? 'كيف سمعت عنا؟' : 'How did you hear about us?'}</h3>
                                        <p className="text-sm text-gray-500">{isAr ? 'ملاحظتك تساعدنا على خدمتك بشكل أفضل.' : 'Your feedback helps us serve you better.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {(isAr ? ['طبيب', 'صديق', 'إنستجرام', 'خرائط جوجل', 'نشرة', 'أخرى'] : ['Doctor', 'Friend', 'Instagram', 'Google Maps', 'Flyer', 'Other']).map((option, idx) => (
                                            <button
                                                key={option}
                                                onClick={() => handleFeedbackSubmit(option)}
                                                disabled={isSubmittingFeedback || submissionCount >= 4}
                                                className={`py-4 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-stagger-${idx + 1}`}
                                            >
                                                {isSubmittingFeedback ? '...' : option}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-4 animate-scale-in">
                                        <CheckCircleIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{isAr ? 'شكراً لك!' : 'Thank You!'}</h3>
                                    <p className="text-gray-500 mb-6">{isAr ? 'تم تسجيل ملاحظاتك.' : 'Your feedback has been recorded.'}</p>

                                    {profileData.feedbackRewardEnabled && rewardVoucher && (
                                        <div className="max-w-md mx-auto bg-white border border-gray-100 rounded-2xl p-1 shadow-lg overflow-hidden animate-fade-in-up">
                                            <div className=" relative p-6 bg-gradient-to-br from-indigo-50 to-white">
                                                {claimStep === 'success' ? (
                                                    <div className="text-center py-4">
                                                        <h4 className="text-2xl font-bold text-green-600 mb-2">{isAr ? 'تم استلام القسيمة!' : 'Voucher Claimed!'}</h4>
                                                        <p className="text-sm text-gray-600">{isAr ? 'تم الحفظ في محفظتك بنجاح.' : 'Saved to your wallet successfully.'}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <span className="inline-block py-1 px-3 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-4">{isAr ? '🎁 مكافأة خاصة' : '🎁 Special Reward'}</span>
                                                        <h4 className="text-xl font-bold text-gray-900 mb-2">{rewardVoucher.title}</h4>
                                                        <div className="text-3xl font-black text-indigo-600 mb-6">{rewardVoucher.value}</div>

                                                        {claimStep === 'unlocked' && (
                                                            <button
                                                                onClick={handleClaim}
                                                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
                                                            >
                                                                {isAr ? 'احصل على المكافأة الآن' : 'Claim Reward Now'}
                                                            </button>
                                                        )}

                                                        {(claimStep === 'auth' || claimStep === 'claiming') && (
                                                            <form onSubmit={handleQuickAuth} className="space-y-3">
                                                                <input
                                                                    type="tel"
                                                                    placeholder={isAr ? "رقم الهاتف" : "Mobile Number"}
                                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                                                                    value={claimMobile}
                                                                    onChange={e => setClaimMobile(e.target.value)}
                                                                />
                                                                {isExistingUser && (
                                                                    <input
                                                                        type="password"
                                                                        placeholder={isAr ? "كلمة المرور" : "Password"}
                                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                                                                        value={claimPassword}
                                                                        onChange={e => setClaimPassword(e.target.value)}
                                                                    />
                                                                )}
                                                                {claimError && <p className="text-red-500 text-xs font-bold">{claimError}</p>}
                                                                <button
                                                                    type="submit"
                                                                    disabled={claimLoading && claimStep === 'claiming'}
                                                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                                                                >
                                                                    {claimStep === 'claiming' ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'تحقق واستلم' : 'Verify & Claim')}
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Media Gallery */}
                    {(profileData.gallery && profileData.gallery.length > 0) && (
                        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <h3 style={styles.sectionTitle}>
                                {isAr ? 'المعرض' : 'Gallery'}
                                <span className="block h-1 w-12 rounded-full mt-2" style={{ backgroundColor: colors.accent }}></span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profileData.gallery.map(item => (
                                    <div key={item.id} className="rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                        {item.type === 'video' ? (
                                            <div className="aspect-video relative">
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={item.url.replace('watch?v=', 'embed/').split('&')[0]}
                                                    title="Video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/3] relative">
                                                <img src={item.url} alt="Gallery" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                    <span className="text-white font-bold text-sm">{isAr ? 'عرض الصورة' : 'View Image'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Latest Offers Section */}
                {(profileData.vouchers && profileData.vouchers.length > 0) && (
                    <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-3xl font-bold text-center mb-8 relative inline-block w-full">
                            <span className="relative z-10 px-4" style={{ backgroundColor: colors.background }}>{isAr ? 'أحدث العروض الحصرية' : 'Latest Exclusive Offers'}</span>
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-0"></div>
                        </h2>

                        <div style={styles.vouchersGrid} dir={dir}>
                            {profileData.vouchers.map((voucher: Voucher, idx: number) => (
                                <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                                    <div className="h-48 relative overflow-hidden">
                                        {voucher.imageUrl ? (
                                            <img src={voucher.imageUrl} alt={voucher.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-4xl">🎁</span>
                                            </div>
                                        )}
                                        <div className={`absolute top-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isAr ? 'left-3' : 'right-3'}`}>
                                            {isAr ? 'لفترة محدودة' : 'Limited Time'}
                                        </div>
                                        <div className={`absolute bottom-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold ${isAr ? 'right-3' : 'left-3'}`}>
                                            {voucher.redeemedCount || 0} {isAr ? 'تم استلامها' : 'claimed'}
                                        </div>
                                    </div>
                                    <div className={`p-5 ${isAr ? 'text-right' : 'text-left'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">{voucher.title}</h3>
                                        </div>
                                        <div className="text-2xl font-black text-indigo-600 mb-2">{voucher.value}</div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{voucher.description}</p>
                                        <button
                                            onClick={() => handleListClaim(voucher)}
                                            disabled={claimingVoucherId === voucher.id}
                                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-colors group-hover:shadow-indigo-200 disabled:opacity-50"
                                        >
                                            {claimingVoucherId === voucher.id ? (isAr ? 'جاري الاستلام...' : 'Claiming...') : (isAr ? 'استلم العرض' : 'Claim Offer')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-16 text-center text-gray-400 text-sm py-8 border-t border-gray-200/50">
                <p>&copy; {new Date().getFullYear()} {profileData.displayName || profileData.username}</p>
            </footer>
        </div>
    );
};

export default BusinessLayout;
