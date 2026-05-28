import React from 'react';
import Dashboard from '../features/dashboard/Dashboard';
import AuthContainer from '../features/auth/AuthContainer';
import { db } from '../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNotification } from '../hooks/useNotification';
import { NDealModule } from '../features/nDeal';
import { NMenuModule } from '../features/nMenu';
import { NShopModule } from '../features/nShop';
import { NReviewModule } from '../features/nReview';
import { NWalletModule } from '../features/nWallet';
import { NBlastModule } from '../features/nBlast';
import { NGameModule } from '../features/nGame';
import NBusinessModule from '../features/nBusiness/NBusinessModule';
import MyConnectionsPage from '../features/connections/MyConnectionsPage';
import { ConnectionsProvider } from '../contexts/ConnectionsContext';

const MainApplication = ({ route }: { route: any }) => {

    // Parse target profile from URL if any
    const searchParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    const targetProfileId = searchParams.get('profileId');

    // Custom hooks for cleaner state management
    const { currentUser, isAuthReady, handleSignOut } = useAuth();

    const { notification, setNotification } = useNotification();
    const { profileData, loading: profileLoading, isRefreshing, setProfileData, handleUpdateProfileLinks, handleUpdatePhoto } = useProfile({
        currentUser,
        isAuthReady,
        onNotification: setNotification,
        targetProfileId
    });

    const handleUpdateActiveProfile = async (updates: any) => {
        if (!currentUser) return;
        setProfileData(prev => prev ? ({ ...prev, ...updates }) : null);
        if (db) {
            try {
                const targetCollection = targetProfileId ? 'profiles' : 'users';
                const finalDocId = targetProfileId || currentUser.uid;
                const docRef = doc(db, `${targetCollection}/${finalDocId}`);

                const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
                    if (value !== undefined) acc[key] = value;
                    return acc;
                }, {} as any);

                await setDoc(docRef, cleanUpdates, { merge: true });
                setNotification({ type: 'success', message: 'Saved successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } catch (e: any) {
                console.error("Failed to save updates:", e);
                const errorMsg = e?.code || e?.message || "Unknown error";
                setNotification({ type: 'error', message: `Failed to save: ${errorMsg}` });
                throw e; // Re-throw so calling components can handle
            }
        }
    };



    // Handle sign out with notification clearing
    const handleSignOutWithCleanup = async () => {
        try {
            await handleSignOut();
            setNotification(null);
        } catch (e) {
            setNotification({ type: 'error', message: 'Failed to sign out.' });
        }
    };

    return (
        <>
            {notification && (
                <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-fade-in-down ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {notification.message}
                </div>
            )}

            {isRefreshing && profileData && (
                <div className="fixed top-5 left-5 z-50 px-4 py-2 bg-indigo-600/10 backdrop-blur-md border border-indigo-200 rounded-full flex items-center gap-2 animate-pulse shadow-sm">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Refreshing...</span>
                </div>
            )}

            {/* Show auth screen immediately if not authenticated, otherwise show dashboard */}
            {/* If logged in and profile is loading, show nothing (prevents flash) */}
            {currentUser && !currentUser.isAnonymous && profileLoading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : currentUser && !currentUser.isAnonymous && profileData ? (
                ['ndeal', 'nmenu', 'nshop', 'nreview', 'nwallet', 'nbusiness', 'nconnect', 'nblast', 'ngame'].includes(route.view) ? (
                    <div className="min-h-screen bg-slate-50 pb-12 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => window.location.hash = targetProfileId ? '#/nbusiness' : '#/app'}
                            className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            ← {targetProfileId ? 'Back to Business Pages' : 'Back to Dashboard'}
                        </button>

                        {route.view === 'ndeal' && (
                            <NDealModule
                                profileData={profileData}
                                onUpdateProfile={handleUpdateActiveProfile}
                                isStandalone={true}
                            />
                        )}

                        {route.view === 'nmenu' && (
                            <NMenuModule
                                profileData={profileData}
                                onUpdateProfile={handleUpdateActiveProfile}
                                isStandalone={true}
                            />
                        )}

                        {route.view === 'nshop' && (
                            <NShopModule
                                profileData={profileData}
                                onUpdateProfile={handleUpdateActiveProfile}
                                isStandalone={true}
                            />
                        )}

                        {route.view === 'nreview' && (
                            <NReviewModule
                                isStandalone={true}
                            />
                        )}

                        {route.view === 'nwallet' && (
                            <NWalletModule
                                profileData={profileData}
                                isStandalone={true}
                            />
                        )}

                        {route.view === 'nbusiness' && (
                            <NBusinessModule
                                onNotification={setNotification}
                            />
                        )}

                        {route.view === 'nconnect' && (
                            <ConnectionsProvider userId={currentUser.uid}>
                                <MyConnectionsPage />
                            </ConnectionsProvider>
                        )}

                        {route.view === 'nblast' && (
                            <NBlastModule />
                        )}

                        {route.view === 'ngame' && (
                            <NGameModule
                                profileData={profileData}
                                isStandalone={true}
                            />
                        )}

                    </div>
                ) : (
                    <Dashboard
                        profileData={profileData}
                        currentUser={currentUser}
                        handleSignOut={handleSignOutWithCleanup}
                        handleUpdateProfileLinks={handleUpdateProfileLinks}
                        onUpdatePhoto={handleUpdatePhoto}
                        setNotification={setNotification}
                        setProfileData={setProfileData}
                        initialClaimId={new URLSearchParams(window.location.hash.split('?')[1]).get('claimId')}
                    />
                )
            ) : (currentUser && !currentUser.isAnonymous) ? (
                // Authenticated but profile not found (yet) or deleted
                <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            We couldn't find your profile information. This might happen if you just signed up and the data is still syncing, or if your profile was removed.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                            >
                                Retry Syncing
                            </button>
                            <button
                                onClick={handleSignOutWithCleanup}
                                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <AuthContainer onLoginSuccess={() => {
                    window.location.hash = '#/app';
                    window.location.reload();
                }} />
            )}
        </>
    );
};

export default MainApplication;
