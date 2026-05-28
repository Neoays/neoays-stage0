import React, { useState, useEffect } from 'react';
import { UserProfile, UserStats } from '../../types'; // Import UserStats
import NFCWriter from './NFCWriter';
import WifiSharing from './WifiSharing';
import { ShareIcon, WifiIcon, CheckCircleIcon, SpinnerIcon, TimesCircleIcon, CopyIcon, EyeIcon } from '../../components/Icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import { useTheme } from '../../contexts/ThemeContext';

import ShareAssetsModal from './ShareAssetsModal';
import ProfilePhotoManager from './ProfilePhotoManager'; // Reusing for logic or embedding

interface ProfileSharingCardProps {
    profileData: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    stats?: UserStats | null; // Added stats prop
}

const ProfileSharingCard: React.FC<ProfileSharingCardProps> = ({ profileData, onUpdateProfile, stats }) => {
    const { theme } = useTheme();
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [username, setUsername] = useState(profileData.username || '');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showNFC, setShowNFC] = useState(false);
    const [showWifi, setShowWifi] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Photo Update Helper
    const handleUpdatePhoto = async (photoURL: string) => {
        await onUpdateProfile({ photoURL });
    };
    const profileUrl = `${window.location.origin}/${profileData.username}`;

    useEffect(() => {
        setUsername(profileData.username || '');
    }, [profileData.username]);

    // Username Availability Check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (username !== profileData.username && username.length >= 3) {
                checkUsernameAvailability(username);
            } else {
                setUsernameStatus('idle');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [username, profileData.username]);

    const checkUsernameAvailability = async (name: string) => {
        if (!db) return;
        setUsernameStatus('checking');
        try {
            const docRef = doc(db, 'usernames', name.toLowerCase());
            const docSnap = await getDoc(docRef);
            setUsernameStatus(docSnap.exists() ? 'taken' : 'available');
        } catch (e) {
            console.error("Error checking username:", e);
            setUsernameStatus('idle');
        }
    };

    const handleSaveUsername = async () => {
        if (usernameStatus === 'taken') return;
        if (username === profileData.username) {
            setIsEditingLink(false);
            return;
        }

        try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            // Update mapping
            await setDoc(doc(db, 'usernames', username.toLowerCase()), { userId: uid });
            // Update profile
            await onUpdateProfile({ username: username.toLowerCase() });
            setIsEditingLink(false);
        } catch (error) {
            console.error("Failed to update username", error);
            alert("Failed to update link.");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6">
                {/* 1. Avatar Photo (Top) */}
                <div className="flex flex-col items-center mb-8 pt-2">
                    <ProfilePhotoManager
                        profileData={profileData}
                        onUpdatePhoto={handleUpdatePhoto}
                        setNotification={() => { }}
                    />
                </div>

                {/* 2. Editable Public Profile Link & View Profile */}
                <div className="space-y-4 mb-8">
                    {/* Link Editor */}
                    <div className="w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">Your Public Identity</label>
                        <div className={`flex items-center border-2 rounded-2xl overflow-hidden transition-all duration-300 ${isEditingLink ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-lg' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                            <div className="bg-gray-100/50 px-4 py-3 text-xs font-black text-gray-500 border-r border-gray-100 select-none uppercase tracking-tighter">
                                neoays.com/
                            </div>
                            <input
                                type="text"
                                disabled={!isEditingLink}
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className={`flex-1 px-4 py-3 text-sm font-black text-slate-900 outline-none bg-transparent ${!isEditingLink && 'cursor-pointer'}`}
                                onClick={() => !isEditingLink && setIsEditingLink(true)}
                                placeholder="username"
                            />

                            {!isEditingLink ? (
                                <div className="flex items-center pr-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                                        title="Copy Link"
                                    >
                                        {copySuccess ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingLink(true)}
                                        className="ml-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center pr-3">
                                    {usernameStatus === 'checking' && <SpinnerIcon className="animate-spin h-4 w-4 text-indigo-500 mr-2" />}
                                    {usernameStatus === 'taken' && username !== profileData.username && <span className="text-[10px] text-red-500 font-black uppercase mr-2 mt-0.5">Taken</span>}
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={usernameStatus === 'checking' || usernameStatus === 'taken'}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        Save
                                    </button>
                                    <button onClick={() => { setUsername(profileData.username || ''); setIsEditingLink(false); }} className="ml-2 text-gray-400 hover:text-slate-600 transition-colors"><TimesCircleIcon className="h-5 w-5" /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. View Public Profile Button (High Prominence) */}
                    <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-200"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                            <span className="flex items-center gap-2">
                                <EyeIcon className="w-4 h-4" />
                                Launch Live Profile
                            </span>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 group-hover:opacity-0 transition-all duration-300">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            View your Public Profile
                        </div>
                    </a>
                </div>
            </div>

            {/* 5. Tool Options (Share, NFC, WiFi) - All in one row */}
            <div className="p-3 bg-slate-50/50 border-t border-gray-50">
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => { setShowShareModal(true); setShowNFC(false); setShowWifi(false); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showShareModal ? 'bg-indigo-600 text-white' : 'text-gray-500 bg-white hover:bg-gray-100 border border-gray-100'}`}
                    >
                        <ShareIcon className="w-3 h-3" />
                        Share
                    </button>
                    <button
                        onClick={() => { setShowNFC(!showNFC); setShowShareModal(false); setShowWifi(false); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showNFC ? 'text-orange-600 bg-orange-50 border border-orange-200' : 'text-gray-500 bg-white hover:bg-gray-100 border border-gray-100'}`}
                    >
                        <WifiIcon className="w-3 h-3 rotate-90" />
                        NFC
                    </button>
                    <button
                        onClick={() => { setShowWifi(!showWifi); setShowShareModal(false); setShowNFC(false); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showWifi ? 'text-green-600 bg-green-50 border border-green-200' : 'text-gray-500 bg-white hover:bg-gray-100 border border-gray-100'}`}
                    >
                        <WifiIcon className="w-3 h-3" />
                        WiFi
                    </button>
                </div>
            </div>

            {/* Expanded Tools Content */}
            <div className="transition-all duration-300">
                {/* Share Modal Integration */}
                <ShareAssetsModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    type="profile"
                    data={profileData}
                />




                {showNFC && (
                    <div className="mt-4 animate-fade-in-down">
                        <NFCWriter url={profileUrl} />
                    </div>
                )}

                {showWifi && (
                    <div className="mt-4 animate-fade-in-down bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <WifiSharing />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSharingCard;
