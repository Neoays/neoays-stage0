import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { UserProfile, UserLink, UserStats } from '../../types';
import { CogIcon, ArrowLeftIcon, HomeIcon, BriefcaseIcon, UserIcon, EyeIcon, EyeSlashIcon } from '../../components/Icons';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../../LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSaveThemeToFirebase } from '../../hooks/useSaveThemeToFirebase';
import neoaysLogoSvg from '../../assets/neoays-logo.svg';
import OnboardingTour from '../../components/OnboardingTour';
import SettingsModal from './SettingsModal';

// Features / nProducts
import Launcher from './Launcher';
import { NProfileModule } from '../nProfile';
import LeadsManager from './LeadsManager';
import AppointmentsManager from './AppointmentsManager';
import TestimonialsManager from './TestimonialsManager';
import PortfolioManager from './PortfolioManager';
import TemplateStudio from '../nProfile/TemplateStudio';
import { NWalletModule } from '../nWallet';

const Dashboard = ({ profileData, currentUser, handleSignOut, handleUpdateProfileLinks, onUpdatePhoto, setNotification, setProfileData, initialClaimId }: {
    profileData: UserProfile,
    currentUser: User,
    handleSignOut: () => Promise<void>,
    handleUpdateProfileLinks: (links: UserLink[]) => Promise<void>,
    onUpdatePhoto: (imageDataUrl: string) => Promise<void>,
    setNotification: (notif: { type: 'error' | 'success', message: string } | null) => void,
    setProfileData: React.Dispatch<React.SetStateAction<UserProfile | null>>,
    initialClaimId?: string | null
}) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showShareCards, setShowShareCards] = useState(false);
    const { language, setLanguage } = useLanguage();
    const { themeId } = useTheme();

    // Auto-open claimed voucher if claimId is present (Deep Linking Logic)
    useEffect(() => {
        if (initialClaimId) {
            // If deeper linking is needed, we could set activeModule='nwallet' here
            // For now, we just clear it to avoid loop
            const newHash = window.location.hash.split('?')[0];
            window.history.replaceState(null, '', newHash);
            setActiveModule('nwallet'); // Navigate to wallet to see the voucher
        }
    }, [initialClaimId]);

    // Onboarding State
    const [showTour, setShowTour] = useState(false);
    useEffect(() => {
        const seen = localStorage.getItem('neoays_onboarding_seen');
        if (!seen) {
            setTimeout(() => setShowTour(true), 1000);
        }
    }, []);

    useSaveThemeToFirebase(currentUser, themeId);

    // Fetch Stats
    useEffect(() => {
        if (!db || !currentUser) return;
        const statsDocPath = `users/${currentUser.uid}/stats/general`;
        const unsubscribe = onSnapshot(doc(db, statsDocPath), (docSnap) => {
            if (docSnap.exists()) {
                setStats(docSnap.data() as UserStats);
            } else {
                setStats({ totalViews: 0 });
            }
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
        if (!db || !currentUser) return;
        try {
            const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
                if (value !== undefined) acc[key] = value;
                return acc;
            }, {} as any);

            // BLACKLIST APPROACH: Sync EVERYTHING to public_profiles EXCEPT private-only fields.
            // This guarantees no field is ever silently lost during sync.
            const privateOnlyFields = new Set([
                'email', 'savedVouchers', 'savedContacts', 'accounts', 'activeProfileId',
                'profileMode', 'personalData', 'businessData', 'countryCode',
                'partnerBusinessIds', 'createdAt',
                'country', 'city'  // Private user settings — public profile uses explicit `location` field
            ]);

            const publicUpdates: any = {};
            const privateUpdates: any = {};

            // 1. Pre-populate publicUpdates from existing profileData (full migration on every save)
            Object.keys(profileData).forEach(key => {
                if (!privateOnlyFields.has(key)) {
                    const val = (profileData as any)[key];
                    if (val !== undefined) {
                        publicUpdates[key] = val;
                    }
                }
            });

            // 2. Apply new incoming updates on top
            Object.keys(cleanUpdates).forEach(key => {
                if (privateOnlyFields.has(key)) {
                    privateUpdates[key] = cleanUpdates[key];
                } else {
                    publicUpdates[key] = cleanUpdates[key];
                }
            });

            // 3. Ensure username is always present
            publicUpdates.username = profileData.username;

            // 4. Remove any explicitly undefined values to prevent Firestore crash
            Object.keys(publicUpdates).forEach(key => {
                if (publicUpdates[key] === undefined) {
                    delete publicUpdates[key];
                }
            });

            // Save to BOTH collections (users for backward compat, public_profiles for live display)
            const docRef = doc(db, `users/${currentUser.uid}`);
            await setDoc(docRef, cleanUpdates, { merge: true });

            if (Object.keys(publicUpdates).length > 0) {
                const publicRef = doc(db, `public_profiles/${currentUser.uid}`);
                await setDoc(publicRef, publicUpdates, { merge: true });
            }

            setProfileData(prev => prev ? ({ ...prev, ...updates }) : null);
            setNotification({ type: 'success', message: 'Saved successfully!' });
            setTimeout(() => setNotification(null), 3000);
        } catch (e: any) {
            console.error("Failed to save profile:", e);
            setNotification({ type: 'error', message: `Failed to save: ${e.message || 'Unknown error'}` });
        }
    };

    const handleToggleProfileMode = async () => {
        const nextMode = profileData.profileMode === 'business' ? 'personal' : 'business';
        const currentData = {
            displayName: profileData.displayName || '',
            bio: profileData.bio || '',
            photoURL: profileData.photoURL || '',
            links: profileData.links || []
        };

        // 1. Save current state to the active slot
        const updates: Partial<UserProfile> = {
            profileMode: nextMode,
            [profileData.profileMode === 'business' ? 'businessData' : 'personalData']: currentData
        };

        // 2. Load next state from slot if it exists
        const nextData = nextMode === 'business' ? profileData.businessData : profileData.personalData;
        if (nextData) {
            updates.displayName = nextData.displayName;
            updates.bio = nextData.bio;
            updates.photoURL = nextData.photoURL;
            updates.links = nextData.links;
        }

        await handleUpdateProfile(updates);
    };

    const renderModule = () => {
        if (activeModule === 'nprofile') {
            return <NProfileModule profileData={profileData} onUpdateProfile={handleUpdateProfile} stats={stats} />;
        }

        if (activeModule === 'nleads') {
            return <LeadsManager userId={currentUser.uid} />;
        }

        if (activeModule === 'ncalendar') {
            return <AppointmentsManager userId={currentUser.uid} />;
        }

        if (activeModule === 'nreviews') {
            return <TestimonialsManager userId={currentUser.uid} />;
        }

        if (activeModule === 'nportfolio') {
            return <PortfolioManager userId={currentUser.uid} />;
        }

        if (activeModule === 'nwallet') {
            return <NWalletModule profileData={profileData} isStandalone={false} />;
        }

        return (
            <Launcher
                profileData={profileData}
                stats={stats}
                onLaunch={(id) => {
                    if (id === 'share-cards') {
                        setShowShareCards(true);
                    } else if (id === 'nprofile') {
                        setActiveModule('nprofile');
                    } else if (id === 'nleads') {
                        setActiveModule('nleads');
                    } else if (id === 'ncalendar') {
                        setActiveModule('ncalendar');
                    } else if (id === 'nreviews') {
                        setActiveModule('nreviews');
                    } else if (id === 'nportfolio') {
                        setActiveModule('nportfolio');
                    } else {
                        window.location.hash = `#/${id}`;
                    }
                }}
            />
        );
    };

    const getModuleTitle = () => {
        if (activeModule === 'nprofile') return 'nProfile';
        if (activeModule === 'nleads') return 'nLeads';
        if (activeModule === 'ncalendar') return 'nCalendar';
        if (activeModule === 'nreviews') return 'nReviews';
        if (activeModule === 'nportfolio') return 'nPortfolio';
        if (activeModule === 'nwallet') return 'nWallet';
        return 'Dashboard';
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            {/* Back Button / Logo Logic */}
                            {activeModule ? (
                                <button
                                    onClick={() => setActiveModule(null)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    <ArrowLeftIcon className="h-5 w-5" />
                                    <span className="font-bold text-sm hidden sm:block">Back</span>
                                </button>
                            ) : (
                                <img src={neoaysLogoSvg} alt="Neoays" className="h-6 w-auto" />
                            )}

                            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                            <span className="text-xl font-black text-slate-900 tracking-tighter">
                                {getModuleTitle()}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Home Button (Always goes to Launcher) */}
                            {activeModule && (
                                <button
                                    onClick={() => setActiveModule(null)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                    title="Home"
                                >
                                    <HomeIcon className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={() => handleUpdateProfile({ isPublic: !profileData.isPublic })}
                                className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-bold rounded-xl transition-all duration-300 ${profileData.isPublic ? 'bg-green-600 text-white border-green-600 shadow-green-100' : 'bg-white text-slate-700 border-slate-200'}`}
                                title={profileData.isPublic ? "Profile is Live" : "Profile is Hidden"}
                            >
                                {profileData.isPublic ? (
                                    <>
                                        <EyeIcon className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Live</span>
                                    </>
                                ) : (
                                    <>
                                        <EyeSlashIcon className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Hidden</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleToggleProfileMode}
                                className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-xs font-bold rounded-xl transition-all duration-300 ${profileData.profileMode === 'business' ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' : 'bg-white text-slate-700 border-slate-200'}`}
                            >
                                {profileData.profileMode === 'business' ? (
                                    <>
                                        <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Business</span>
                                    </>
                                ) : (
                                    <>
                                        <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Personal</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                                className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all"
                            >
                                <span className="mr-2">{language === 'en' ? '🇦🇪' : '🇺🇸'}</span>
                                {language === 'en' ? 'EN' : 'AR'}
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition"
                                title="Settings"
                            >
                                <CogIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                {renderModule()}
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                profileData={profileData}
                onUpdateProfile={handleUpdateProfile}
                onUpdatePhoto={onUpdatePhoto}
                setNotification={setNotification}
                onSignOut={handleSignOut}
            />

            <OnboardingTour isOpen={showTour} onClose={() => setShowTour(false)} />

            <TemplateStudio
                isOpen={showShareCards}
                onClose={() => setShowShareCards(false)}
                profileData={profileData}
            />
        </div>
    );
};

export default Dashboard;
