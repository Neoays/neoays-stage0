import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserStats, UserLink } from '../../types';
import CoverPhotoManager from './CoverPhotoManager';
import LinkManagement from './LinkManagement';
import ProfileSharingCard from './ProfileSharingCard';
import TemplateStudio from './TemplateStudio';
import ProfileEditor from '../dashboard/ProfileEditor';
import ThemeCustomizer from '../dashboard/ThemeCustomizer';
import { UserIcon } from '../../components/Icons';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface NProfileModuleProps {
    profileData: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    stats?: UserStats | null;
}

const NProfileModule: React.FC<NProfileModuleProps> = ({ profileData, onUpdateProfile, stats }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [showShareCards, setShowShareCards] = useState(false);

    // Local state for debounced fields (prevents Firestore write on every keystroke)
    const [localDisplayName, setLocalDisplayName] = useState(profileData.displayName || '');
    const [localDesignation, setLocalDesignation] = useState(profileData.businessCategory || '');
    const [localLocation, setLocalLocation] = useState(profileData.location || '');
    const [localBio, setLocalBio] = useState(profileData.bio || '');
    const debounceRef = useRef<NodeJS.Timeout>();

    // Sync local state when profileData changes externally
    useEffect(() => {
        setLocalDisplayName(profileData.displayName || '');
        setLocalDesignation(profileData.businessCategory || '');
        setLocalLocation(profileData.location || '');
        setLocalBio(profileData.bio || '');
    }, [profileData.displayName, profileData.businessCategory, profileData.location, profileData.bio]);

    // Debounced save function (Increased to 2s to prevent typing interruption)
    const debouncedSave = (updates: Partial<UserProfile>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onUpdateProfile(updates);
        }, 2000);
    };

    // Company search state for Works At
    const [companySearch, setCompanySearch] = useState('');
    const [companyResults, setCompanyResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchDebounceRef = useRef<NodeJS.Timeout>();

    // Search for business profiles
    const searchCompanies = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setCompanyResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('profileType', 'in', ['business', 'business_person']),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id } as UserProfile))
                .filter(p =>
                    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.username?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            setCompanyResults(results);
        } catch (error) {
            console.error('Company search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced company search
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            searchCompanies(companySearch);
        }, 300);
        return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
    }, [companySearch]);
    // Helper to handle link updates specifically for LinkManagement
    const handleUpdateProfileLinks = async (links: UserLink[]) => {
        await onUpdateProfile({ links });
    };

    // Helper for photo update
    const handleUpdatePhoto = async (photoURL: string) => {
        await onUpdateProfile({ photoURL });
    };

    // Helper for cover update
    const handleUpdateCover = async (coverURL: string) => {
        await onUpdateProfile({ coverURL });
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Header / Value Prop */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserIcon className="w-48 h-48 transform translate-x-10 -translate-y-10" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">nProfile</h2>
                    <p className="opacity-90 text-lg font-medium">Your universal digital identity.</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Visual Identity */}
                <div className="lg:col-span-1 space-y-6">
                    <ProfileSharingCard
                        profileData={profileData}
                        onUpdateProfile={onUpdateProfile}
                        stats={stats}
                    />

                    {/* Secondary Visuals: Cover & Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Profile Cover</label>
                                <CoverPhotoManager
                                    profileData={profileData}
                                    onUpdateCover={handleUpdateCover}
                                    setNotification={() => { }}
                                />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => setShowShareCards(true)}
                                className="w-full py-4 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:from-pink-100 hover:to-purple-100 transition-all flex items-center justify-center gap-2 animate-pulse-subtle"
                            >
                                📤 Share Cards
                            </button>
                            <button
                                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                {isDetailsOpen ? '❌ Close Editor' : '📝 Edit Profile Details'}
                            </button>
                            <button
                                onClick={() => document.getElementById('theme-studio-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full py-4 bg-purple-50 text-purple-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-100 transition-all flex items-center justify-center gap-2"
                            >
                                🎨 Design & Layout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Links */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Public Profile Manager */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                                Public Profile Manager
                            </h3>
                            {/* Actions moved to Profile Widgets below */}
                        </div>

                        {/* Quick Profile Info - Name, Designation, Location, Bio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    👤 Display Name
                                </label>
                                <input
                                    type="text"
                                    value={localDisplayName}
                                    onChange={(e) => {
                                        setLocalDisplayName(e.target.value);
                                        debouncedSave({ displayName: e.target.value });
                                    }}
                                    placeholder="Your name as it appears on your profile"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    💼 Designation / Title
                                </label>
                                <input
                                    type="text"
                                    value={localDesignation}
                                    onChange={(e) => {
                                        setLocalDesignation(e.target.value);
                                        debouncedSave({ businessCategory: e.target.value });
                                    }}
                                    placeholder="e.g. CEO, Designer, Doctor..."
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    📍 Location
                                </label>
                                <input
                                    type="text"
                                    value={localLocation}
                                    onChange={(e) => {
                                        setLocalLocation(e.target.value);
                                        debouncedSave({ location: e.target.value });
                                    }}
                                    placeholder="e.g. Dubai, UAE"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    ✍️ Short Bio
                                </label>
                                <textarea
                                    value={localBio}
                                    onChange={(e) => {
                                        setLocalBio(e.target.value);
                                        debouncedSave({ bio: e.target.value });
                                    }}
                                    placeholder="Tell visitors about yourself or your business..."
                                    rows={2}
                                    maxLength={200}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                />
                                <div className="text-right text-[10px] text-gray-400 mt-1">
                                    {localBio.length}/200
                                </div>
                            </div>
                        </div>

                        {/* Works At Company Link */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                                    🏢 Works At (Company nProfile)
                                </label>
                                {/* Display Toggle */}
                                <div className="flex gap-1">
                                    {(['inline', 'floating', 'disabled'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => onUpdateProfile({ worksAtDisplay: mode })}
                                            className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${(profileData.worksAtDisplay || 'inline') === mode
                                                ? mode === 'disabled'
                                                    ? 'bg-gray-400 text-white'
                                                    : 'bg-purple-500 text-white'
                                                : 'bg-white text-gray-400 hover:text-purple-500'
                                                }`}
                                        >
                                            {mode === 'inline' ? '📍 Bio' : mode === 'floating' ? '🎈 Float' : '🚫 Off'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {profileData.worksAt?.companyName ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-white rounded-lg border border-purple-200">
                                        {profileData.worksAt.companyLogo ? (
                                            <img src={profileData.worksAt.companyLogo} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                                                {profileData.worksAt.companyName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold text-gray-800">{profileData.worksAt.companyName}</span>
                                        <span className="text-xs text-gray-400">@{profileData.worksAt.companyUsername}</span>
                                    </div>
                                    <button
                                        onClick={() => onUpdateProfile({ worksAt: undefined })}
                                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                        placeholder="🔍 Search company by name..."
                                        className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-3 text-purple-500 text-xs">Searching...</div>
                                    )}
                                    {companyResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto z-50">
                                            {companyResults.map((company) => (
                                                <button
                                                    key={company.id}
                                                    onClick={() => {
                                                        onUpdateProfile({
                                                            worksAt: {
                                                                companyId: company.id || company.userId || '',
                                                                companyName: company.displayName || company.username || '',
                                                                companyLogo: company.photoURL,
                                                                companyUsername: company.username || '',
                                                            }
                                                        });
                                                        setCompanySearch('');
                                                        setCompanyResults([]);
                                                    }}
                                                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-purple-50 transition-all text-left"
                                                >
                                                    {company.photoURL ? (
                                                        <img src={company.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                                                            {(company.displayName || company.username || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800">{company.displayName || company.username}</div>
                                                        <div className="text-xs text-gray-400">@{company.username}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {companySearch.length >= 2 && companyResults.length === 0 && !isSearching && (
                                        <p className="text-[10px] text-purple-400 mt-2">No companies found. Make sure they have a business profile.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Links */}
                        <LinkManagement
                            profileData={profileData}
                            handleUpdateProfileLinks={handleUpdateProfileLinks}
                            t={(key: string) => key}
                        />

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-6"></div>

                        {/* Media Gallery Section - Compact */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">📸 Gallery</label>
                                <div className="flex gap-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-widest bg-indigo-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-indigo-700 transition-all">
                                        Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = async () => {
                                                    const newItem = { id: Date.now().toString(), type: 'image' as const, url: reader.result as string };
                                                    await onUpdateProfile({ gallery: [...(profileData.gallery || []), newItem] });
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                    </label>
                                    <button
                                        onClick={() => {
                                            const url = prompt("Enter Image URL:");
                                            if (!url) return;
                                            const newItem = { id: Date.now().toString(), type: 'image' as const, url };
                                            onUpdateProfile({ gallery: [...(profileData.gallery || []), newItem] });
                                        }}
                                        className="text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-all"
                                    >
                                        URL
                                    </button>
                                </div>
                            </div>

                            {/* Gallery Grid */}
                            {(profileData.gallery && profileData.gallery.length > 0) && (
                                <div className="grid grid-cols-5 gap-1.5">
                                    {profileData.gallery.map((item) => (
                                        <div key={item.id} className="group relative aspect-square bg-gray-100 rounded overflow-hidden">
                                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => {
                                                    const updated = (profileData.gallery || []).filter(g => g.id !== item.id);
                                                    onUpdateProfile({ gallery: updated });
                                                }}
                                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Profile Widgets & Modules */}
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">🔌 Profile Widgets</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">

                                {/* Core Interactions — visible to ALL profile types */}
                                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.connectEnabled ?? true ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                    <input type="checkbox" className="sr-only" checked={profileData.connectEnabled ?? true} onChange={(e) => onUpdateProfile({ connectEnabled: e.target.checked })} />
                                    <span className="text-xl mb-1 mt-1">🤝</span>
                                    <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Connect</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.saveContactEnabled ?? true ? 'bg-blue-50 border-blue-200 shadow-blue-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                    <input type="checkbox" className="sr-only" checked={profileData.saveContactEnabled ?? true} onChange={(e) => onUpdateProfile({ saveContactEnabled: e.target.checked })} />
                                    <span className="text-xl mb-1 mt-1">💾</span>
                                    <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Save Contact</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.gameEnabled ?? true ? 'bg-amber-50 border-amber-200 shadow-amber-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                    <input type="checkbox" className="sr-only" checked={profileData.gameEnabled ?? true} onChange={(e) => onUpdateProfile({ gameEnabled: e.target.checked })} />
                                    <span className="text-xl mb-1 mt-1">🎮</span>
                                    <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">nGame</span>
                                </label>

                                {/* Common — Booking & Portfolio (all types) */}
                                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.appointmentsEnabled ?? false ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                    <input type="checkbox" className="sr-only" checked={profileData.appointmentsEnabled ?? false} onChange={(e) => onUpdateProfile({ appointmentsEnabled: e.target.checked })} />
                                    <span className="text-xl mb-1 mt-1">📅</span>
                                    <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Booking</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.portfolioEnabled ?? false ? 'bg-violet-50 border-violet-200 shadow-violet-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                    <input type="checkbox" className="sr-only" checked={profileData.portfolioEnabled ?? false} onChange={(e) => onUpdateProfile({ portfolioEnabled: e.target.checked })} />
                                    <span className="text-xl mb-1 mt-1">🎨</span>
                                    <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Portfolio</span>
                                </label>

                                {/* Business + NGO only — CRM & Feedback tools */}
                                {['business', 'business_person', 'staff', 'ngo', 'society_club'].includes(profileData.profileType || '') && (
                                    <>
                                        <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.leadCaptureEnabled ?? false ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                            <input type="checkbox" className="sr-only" checked={profileData.leadCaptureEnabled ?? false} onChange={(e) => onUpdateProfile({ leadCaptureEnabled: e.target.checked })} />
                                            <span className="text-xl mb-1 mt-1">📥</span>
                                            <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Inquiries</span>
                                        </label>

                                        <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.testimonialsEnabled ?? false ? 'bg-yellow-50 border-yellow-200 shadow-yellow-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                            <input type="checkbox" className="sr-only" checked={profileData.testimonialsEnabled ?? false} onChange={(e) => onUpdateProfile({ testimonialsEnabled: e.target.checked })} />
                                            <span className="text-xl mb-1 mt-1">⭐</span>
                                            <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Reviews</span>
                                        </label>
                                    </>
                                )}

                                {/* Business only — Menu */}
                                {['business', 'business_person', 'staff'].includes(profileData.profileType || '') && (
                                    <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${profileData.menuEnabled ?? false ? 'bg-orange-50 border-orange-200 shadow-orange-100' : 'bg-white border-gray-100 opacity-60'}`}>
                                        <input type="checkbox" className="sr-only" checked={profileData.menuEnabled ?? false} onChange={(e) => onUpdateProfile({ menuEnabled: e.target.checked })} />
                                        <span className="text-xl mb-1 mt-1">🍽️</span>
                                        <span className="block text-[10px] font-bold text-gray-800 text-center uppercase tracking-wide">Menu</span>
                                    </label>
                                )}

                            </div>

                            {/* Floating Video Bubble Widget (Takes full width for input) */}
                            <div className={`mt-3 p-4 rounded-xl border transition-all ${profileData.introVideoEnabled ?? false ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100'}`}>
                                <label className="flex items-center gap-3 cursor-pointer mb-2 w-max">
                                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={profileData.introVideoEnabled ?? false} onChange={(e) => onUpdateProfile({ introVideoEnabled: e.target.checked })} />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-800">Video Intro Bubble</span>
                                        <span className="block text-[9px] text-gray-500 mt-0.5">Floating welcoming video on bottom-left.</span>
                                    </div>
                                </label>
                                {(profileData.introVideoEnabled ?? false) && (
                                    <div className="mt-3 ml-7">
                                        <input
                                            type="text"
                                            defaultValue={profileData.introVideoUrl || ''}
                                            onBlur={(e) => onUpdateProfile({ introVideoUrl: e.target.value })}
                                            placeholder="Video URL (mp4 or iframe embed)..."
                                            className="w-full px-3 py-2 text-xs border border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 bg-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* ── nElite Redirect Widget ─────────────────────────────────── */}
                            <div className={`mt-3 p-4 rounded-xl border transition-all ${profileData.nEliteRedirectEnabled ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 shadow-sm' : 'bg-white border-gray-100'}`}>
                                <label className="flex items-center gap-3 cursor-pointer mb-2 w-max">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-amber-500 rounded"
                                        checked={profileData.nEliteRedirectEnabled ?? false}
                                        onChange={(e) => onUpdateProfile({ nEliteRedirectEnabled: e.target.checked })}
                                    />
                                    <div>
                                        <span className="block text-xs font-black text-gray-900 flex items-center gap-1">
                                            ⭐ nElite Redirect
                                            {profileData.nElite && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-white text-[8px] font-black rounded uppercase tracking-widest">nElite</span>
                                            )}
                                        </span>
                                        <span className="block text-[9px] text-gray-500 mt-0.5">Instantly redirect profile visitors to your nCard page.</span>
                                    </div>
                                </label>
                                {profileData.nEliteRedirectEnabled && (
                                    <div className="mt-2 ml-7 flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                                        <span className="text-amber-500 text-xs">🔗</span>
                                        <span className="text-[11px] font-mono text-gray-700 truncate select-all flex-1">
                                            ncard.neoays.com/{profileData.username}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard?.writeText(`https://ncard.neoays.com/${profileData.username}`);
                                            }}
                                            className="text-[9px] font-bold uppercase text-amber-600 hover:text-amber-800 transition-colors shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* ─────────────────────────────────────────────────────────────── */}
                        </div>
                    </div>

                    {/* Profile Editor Section - COLLAPSIBLE */}
                    {isDetailsOpen && (
                        <div id="profile-details-section" className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 scroll-mt-20 animate-fade-in">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                                    Profile Details
                                </h3>
                                <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">
                                    Minimize ×
                                </button>
                            </div>
                            <ProfileEditor
                                profileData={profileData}
                                onUpdateProfile={onUpdateProfile}
                            />
                        </div>
                    )}

                    {/* Theme Studio - Full Width */}
                    <div id="theme-studio-section" className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 scroll-mt-20">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-2">
                            <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                            Design Studio
                        </h3>
                        <ThemeCustomizer
                            profileData={profileData}
                            onUpdateProfile={onUpdateProfile}
                        />
                    </div>
                </div>
            </div>

            {/* Share Card Modal */}
            <TemplateStudio
                isOpen={showShareCards}
                onClose={() => setShowShareCards(false)}
                profileData={profileData}
            />
        </div>
    );
};

export default NProfileModule;
