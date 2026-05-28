import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';
import { db, auth } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
    PlusIcon,
    TrashIcon,
    EditIcon,
    ExternalLinkIcon,
    BriefcaseIcon,
    SpinnerIcon,
    ShoppingBagIcon,
    CheckCircleIcon,
    TimesCircleIcon,
    UserGroupIcon,
    ChartBarIcon,
    StarIcon,
    TicketIcon,
    QrcodeIcon
} from '../../components/Icons';
import NProfileModule from '../nProfile/NProfileModule';
import NMenuModule from '../nMenu/NMenuModule';
import NShopModule from '../nShop/NShopModule';
import NReviewModule from '../nReview/NReviewModule';
import NDealModule from '../nDeal/NDealModule';
import NRedemptionModule from './NRedemptionModule';

interface NBusinessModuleProps {
    onNotification: (notif: { type: 'success' | 'error', message: string } | null) => void;
}

type DashboardTab = 'overview' | 'profile' | 'menu' | 'shop' | 'survey' | 'offers' | 'redemption' | 'connections';

const NBusinessModule: React.FC<NBusinessModuleProps> = ({ onNotification }) => {
    const [businesses, setBusinesses] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('overview');
    const [isCreating, setIsCreating] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');
    const [newBusinessSlug, setNewBusinessSlug] = useState('');
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [creating, setCreating] = useState(false);

    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) return;
        fetchBusinesses();
    }, [userId]);

    // Real-time slug availability check
    useEffect(() => {
        if (!newBusinessSlug || newBusinessSlug.length < 3) {
            setSlugStatus('idle');
            return;
        }

        const checkAvailability = async () => {
            setSlugStatus('checking');
            try {
                const slugRef = doc(db, 'usernames', newBusinessSlug.toLowerCase());
                const slugSnap = await getDoc(slugRef);
                setSlugStatus(slugSnap.exists() ? 'taken' : 'available');
            } catch (error) {
                console.error('Error checking slug:', error);
                setSlugStatus('idle');
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [newBusinessSlug]);

    const fetchBusinesses = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'profiles'), where('ownerId', '==', userId), where('profileType', '==', 'business'));
            const querySnapshot = await getDocs(q);
            const bizData: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                bizData.push({ id: doc.id, ...doc.data() } as UserProfile);
            });
            setBusinesses(bizData);
        } catch (error) {
            console.error("Error fetching businesses:", error);
            onNotification({ type: 'error', message: "Failed to load businesses." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBusiness = async () => {
        if (!userId || !newBusinessName.trim() || !newBusinessSlug.trim()) {
            onNotification({ type: 'error', message: 'Please fill in all fields.' });
            return;
        }
        if (slugStatus !== 'available') {
            onNotification({ type: 'error', message: 'Username is not available.' });
            return;
        }
        if (businesses.length >= 3) {
            onNotification({ type: 'error', message: 'Maximum 3 business profiles allowed.' });
            return;
        }

        setCreating(true);
        try {
            // Double-check slug availability
            const slugRef = doc(db, 'usernames', newBusinessSlug.toLowerCase());
            const slugSnap = await getDoc(slugRef);

            if (slugSnap.exists()) {
                onNotification({ type: 'error', message: 'Username was just taken. Try another.' });
                setSlugStatus('taken');
                setCreating(false);
                return;
            }

            const businessId = `biz_${userId}_${Date.now()}`;
            const cleanSlug = newBusinessSlug.toLowerCase().trim();

            const businessData = {
                username: cleanSlug,
                displayName: newBusinessName.trim(),
                profileType: 'business',
                email: auth.currentUser?.email || '',
                mobileNumber: '',
                isPublic: true,
                themeId: 'modern-gradient',
                links: [],
                menuItems: [],
                shopItems: [],
                ownerId: userId,
                createdAt: serverTimestamp()
            };

            // 1. Create Profile Doc first
            await setDoc(doc(db, 'profiles', businessId), businessData);

            // 2. Register Username
            await setDoc(doc(db, 'usernames', cleanSlug), {
                ownerId: userId,
                userId: userId,
                profileId: businessId,
                type: 'business'
            });

            onNotification({ type: 'success', message: `Business "@${cleanSlug}" created!` });
            setNewBusinessName('');
            setNewBusinessSlug('');
            setSlugStatus('idle');
            setIsCreating(false);
            fetchBusinesses();
        } catch (error: any) {
            console.error("Creation failed:", error);
            const msg = error?.message || 'Unknown error';
            onNotification({ type: 'error', message: `Failed to create: ${msg}` });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteBusiness = async (id: string, username: string) => {
        if (!window.confirm(`Delete @${username}? This cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, 'profiles', id));
            await deleteDoc(doc(db, 'usernames', username.toLowerCase()));
            onNotification({ type: 'success', message: "Business deleted." });
            fetchBusinesses();
        } catch (error) {
            onNotification({ type: 'error', message: "Delete failed." });
        }
    };

    const handleUpdateBusinessProfile = async (id: string, updates: Partial<UserProfile>) => {
        try {
            await setDoc(doc(db, 'profiles', id), updates, { merge: true });
            setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
            onNotification({ type: 'success', message: "Business profile updated!" });
        } catch (error) {
            onNotification({ type: 'error', message: "Update failed." });
        }
    };

    // Business Dashboard View
    if (activeEditId) {
        const activeBiz = businesses.find(b => b.id === activeEditId);
        if (!activeBiz) return null;

        return (
            <div className="space-y-6 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => { setActiveEditId(null); setActiveDashboardTab('overview'); }}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        ← Back to Businesses
                    </button>
                    <a
                        href={`/@${activeBiz.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                    >
                        <ExternalLinkIcon className="w-4 h-4" /> View Live
                    </a>
                </div>

                {/* Business Header Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                            {activeBiz.photoURL ? (
                                <img src={activeBiz.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <BriefcaseIcon className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">{activeBiz.displayName}</h2>
                            <p className="text-white/70 text-sm">@{activeBiz.username}</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                        { id: 'profile', label: 'Profile', icon: EditIcon },
                        { id: 'menu', label: 'Menu', icon: ShoppingBagIcon },
                        { id: 'shop', label: 'Products', icon: ShoppingBagIcon },
                        { id: 'offers', label: 'Offers', icon: TicketIcon }, // TODO: Import TicketIcon
                        { id: 'redemption', label: 'Redemption', icon: QrcodeIcon }, // TODO: Import QrcodeIcon
                        { id: 'survey', label: 'Survey', icon: StarIcon },
                        { id: 'connections', label: 'Connections', icon: UserGroupIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDashboardTab(tab.id as DashboardTab)}
                            className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all ${activeDashboardTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm min-h-[400px]">
                    {activeDashboardTab === 'overview' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900">Business Overview</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-black text-indigo-600">{activeBiz.menuItems?.length || 0}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Menu Items</p>
                                </div>
                                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-black text-purple-600">{activeBiz.productItems?.length || 0}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Products</p>
                                </div>
                                <div className="bg-green-50 rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-black text-green-600">{activeBiz.links?.length || 0}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Links</p>
                                </div>
                                <div className="bg-amber-50 rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-black text-amber-600">{activeBiz.isPublic ? '🌐' : '🔒'}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">{activeBiz.isPublic ? 'Public' : 'Private'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <button
                                    onClick={() => setActiveDashboardTab('menu')}
                                    className="p-6 bg-blue-50 rounded-2xl text-left hover:bg-blue-100 transition group"
                                >
                                    <ShoppingBagIcon className="w-8 h-8 text-blue-600 mb-3" />
                                    <h4 className="font-bold text-slate-900">Manage Menu</h4>
                                    <p className="text-sm text-slate-500 mt-1">Add food items, set prices, organize categories</p>
                                </button>
                                <button
                                    onClick={() => setActiveDashboardTab('shop')}
                                    className="p-6 bg-purple-50 rounded-2xl text-left hover:bg-purple-100 transition group"
                                >
                                    <ShoppingBagIcon className="w-8 h-8 text-purple-600 mb-3" />
                                    <h4 className="font-bold text-slate-900">Manage Products</h4>
                                    <p className="text-sm text-slate-500 mt-1">Add products for sale, manage inventory</p>
                                </button>
                                <button
                                    onClick={() => setActiveDashboardTab('survey')}
                                    className="p-6 bg-orange-50 rounded-2xl text-left hover:bg-orange-100 transition group"
                                >
                                    <StarIcon className="w-8 h-8 text-orange-600 mb-3" />
                                    <h4 className="font-bold text-slate-900">Surveys & Reviews</h4>
                                    <p className="text-sm text-slate-500 mt-1">Manage feedback, surveys, and Google reviews</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeDashboardTab === 'profile' && (
                        <NProfileModule
                            profileData={activeBiz}
                            onUpdateProfile={(updates) => handleUpdateBusinessProfile(activeEditId, updates)}
                        />
                    )}

                    {activeDashboardTab === 'menu' && (
                        <NMenuModule
                            profileData={activeBiz}
                            onUpdateProfile={(updates) => handleUpdateBusinessProfile(activeEditId, updates)}
                            isStandalone={false}
                        />
                    )}

                    {activeDashboardTab === 'shop' && (
                        <NShopModule
                            profileData={activeBiz}
                            onUpdateProfile={(updates) => handleUpdateBusinessProfile(activeEditId, updates)}
                            isStandalone={false}
                        />
                    )}

                    {activeDashboardTab === 'survey' && (
                        <NReviewModule
                            profileData={activeBiz}
                            onUpdateProfile={async (updates) => handleUpdateBusinessProfile(activeEditId, updates)}
                            isStandalone={false}
                            businesses={businesses} // Pass all businesses for voucher selection
                        />
                    )}

                    {activeDashboardTab === 'offers' && (
                        <NDealModule
                            profileData={activeBiz}
                            onUpdateProfile={async (updates) => handleUpdateBusinessProfile(activeEditId, updates)}
                            isStandalone={false}
                        />
                    )}

                    {activeDashboardTab === 'redemption' && (
                        <NRedemptionModule
                            businessId={activeBiz.id!}
                            businessName={activeBiz.displayName!}
                        />
                    )}

                    {activeDashboardTab === 'connections' && (
                        <div className="text-center py-12">
                            <UserGroupIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Connections</h3>
                            <p className="text-slate-500">View and manage people who connected with this business.</p>
                            <p className="text-sm text-slate-400 mt-4">Coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BriefcaseIcon className="w-48 h-48 transform translate-x-10 -translate-y-10" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">nBusiness</h2>
                    <p className="opacity-90 text-lg font-medium">Create and manage your professional business pages.</p>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            )}

            {/* Business Slots */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {businesses.map((biz) => (
                        <div key={biz.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 overflow-hidden">
                                    {biz.photoURL ? (
                                        <img src={biz.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <BriefcaseIcon className="w-8 h-8" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 truncate max-w-[150px]">{biz.displayName}</h3>
                                    <p className="text-xs text-indigo-500 font-medium">@{biz.username}</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <button
                                    onClick={() => setActiveEditId(biz.id || null)}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ChartBarIcon className="w-4 h-4" /> Open Dashboard
                                </button>

                                <div className="flex gap-2">
                                    <a
                                        href={`/@${biz.username}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" /> View Live
                                    </a>
                                    <button
                                        onClick={() => handleDeleteBusiness(biz.id!, biz.username)}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Create Slot */}
                    {businesses.length < 3 && (
                        <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[280px] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                            {isCreating ? (
                                <div className="w-full space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={newBusinessName}
                                            onChange={(e) => setNewBusinessName(e.target.value)}
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Neoays Cafe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Public ID (Username)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newBusinessSlug}
                                                onChange={(e) => setNewBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                className={`w-full p-3 pr-10 bg-white border rounded-xl text-sm focus:ring-2 outline-none ${slugStatus === 'available' ? 'border-green-400 focus:ring-green-500' :
                                                    slugStatus === 'taken' ? 'border-red-400 focus:ring-red-500' :
                                                        'border-gray-200 focus:ring-indigo-500'
                                                    }`}
                                                placeholder="neoays-cafe"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {slugStatus === 'checking' && <SpinnerIcon className="w-5 h-5 animate-spin text-slate-400" />}
                                                {slugStatus === 'available' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                                                {slugStatus === 'taken' && <TimesCircleIcon className="w-5 h-5 text-red-500" />}
                                            </div>
                                        </div>
                                        {slugStatus === 'available' && (
                                            <p className="text-xs text-green-600 mt-1">✓ neoays.com/@{newBusinessSlug} is available!</p>
                                        )}
                                        {slugStatus === 'taken' && (
                                            <p className="text-xs text-red-600 mt-1">✗ This username is already taken</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleCreateBusiness}
                                            disabled={!newBusinessName || slugStatus !== 'available' || creating}
                                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {creating ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                                            {creating ? 'Creating...' : 'Create'}
                                        </button>
                                        <button
                                            onClick={() => { setIsCreating(false); setNewBusinessName(''); setNewBusinessSlug(''); setSlugStatus('idle'); }}
                                            className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex flex-col items-center gap-3 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <PlusIcon className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm">Add New Business</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest opacity-50">{businesses.length}/3 Slots Used</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NBusinessModule;
