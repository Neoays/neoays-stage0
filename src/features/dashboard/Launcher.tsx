import React, { useState } from 'react';
import { UserProfile, UserStats } from '../../types';
import {
    UserIcon,
    GiftIcon,
    ShoppingBagIcon,
    LayoutIcon,
    CreditCardIcon,
    BriefcaseIcon
} from '../../components/Icons';

interface LauncherProps {
    profileData: UserProfile;
    stats: UserStats | null;
    onLaunch: (moduleName: string) => void;
}

// ============================================================================
// 4-TIER ROLE SYSTEM — with user-switchable view toggle
// ============================================================================

type ProfileTier = 'personal' | 'business' | 'ngo';

const getTier = (profileType?: string): ProfileTier => {
    if (!profileType) return 'personal';
    if (['ngo', 'society_club'].includes(profileType)) return 'ngo';
    if (['business', 'business_person', 'staff'].includes(profileType)) return 'business';
    return 'personal';
};

interface ProductDef {
    id: string;
    name: string;
    desc: string;
    icon: React.FC<any>;
    color: string;
    emoji: string;
    tiers: ProfileTier[];
    section: 'core' | 'business' | 'extra';
    comingSoon?: boolean;
}

const ALL_PRODUCTS: ProductDef[] = [
    // ── CORE (all tiers) ──
    { id: 'nprofile', name: 'nProfile', desc: 'Manage Identity', icon: UserIcon, color: 'bg-blue-600', emoji: '👤', tiers: ['personal', 'business', 'ngo'], section: 'core' },
    { id: 'nconnect', name: 'nConnect', desc: 'My Network', icon: UserIcon, color: 'bg-amber-600', emoji: '🤝', tiers: ['personal', 'business', 'ngo'], section: 'core' },
    { id: 'nwallet', name: 'nWallet', desc: 'My Assets', icon: CreditCardIcon, color: 'bg-emerald-600', emoji: '💼', tiers: ['personal', 'business', 'ngo'], section: 'core' },
    { id: 'ncalendar', name: 'nCalendar', desc: 'Appointments', icon: LayoutIcon, color: 'bg-teal-600', emoji: '📅', tiers: ['personal', 'business', 'ngo'], section: 'core' },
    { id: 'nportfolio', name: 'nPortfolio', desc: 'Case Studies', icon: LayoutIcon, color: 'bg-indigo-500', emoji: '📁', tiers: ['personal', 'business', 'ngo'], section: 'core' },
    { id: 'ngame', name: 'nGame', desc: 'Play & Earn', icon: GiftIcon, color: 'bg-gradient-to-r from-purple-500 to-pink-500', emoji: '🎮', tiers: ['personal', 'business', 'ngo'], section: 'core' },

    // ── BUSINESS ONLY (nBusiness first) ──
    { id: 'nbusiness', name: 'nBusiness', desc: 'Manage Pages', icon: BriefcaseIcon, color: 'bg-indigo-600', emoji: '🏢', tiers: ['business'], section: 'business' },
    { id: 'nshop', name: 'nShop', desc: 'Product Catalog', icon: ShoppingBagIcon, color: 'bg-purple-600', emoji: '🛍️', tiers: ['business'], section: 'business' },
    { id: 'nmenu', name: 'nMenu', desc: 'Digital Menu', icon: LayoutIcon, color: 'bg-cyan-600', emoji: '📱', tiers: ['business'], section: 'business' },

    // ── BUSINESS + NGO TOOLS ──
    { id: 'ndeal', name: 'nDeal', desc: 'Create Offers', icon: GiftIcon, color: 'bg-pink-600', emoji: '🎁', tiers: ['business', 'ngo'], section: 'business' },
    { id: 'nleads', name: 'nLeads', desc: 'Manage Inquiries', icon: UserIcon, color: 'bg-rose-600', emoji: '📋', tiers: ['business', 'ngo'], section: 'business' },
    { id: 'nreviews', name: 'nReviews', desc: 'Testimonials', icon: UserIcon, color: 'bg-amber-500', emoji: '⭐', tiers: ['business', 'ngo'], section: 'business' },

    // ── EXTRAS ──
    { id: 'nblast', name: 'nBlast', desc: 'WhatsApp Broadcast', icon: GiftIcon, color: 'bg-green-600', emoji: '📢', tiers: ['business', 'ngo'], section: 'extra', comingSoon: true },
];

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
    core: { title: 'Your Profile', subtitle: 'Essential tools for everyone' },
    business: { title: 'Business Tools', subtitle: 'Grow and manage your business' },
    extra: { title: 'Coming Soon', subtitle: 'Exciting new features on the way' },
};

const TIER_META: Record<ProfileTier, { label: string; emoji: string; subtitle: string }> = {
    personal: { label: 'Personal', emoji: '👤', subtitle: 'Your Personal Hub' },
    business: { label: 'Business', emoji: '🏢', subtitle: 'Business Command Center' },
    ngo: { label: 'NGO / Club', emoji: '🤝', subtitle: 'Community Hub' },
};

const Launcher: React.FC<LauncherProps> = ({ profileData, stats, onLaunch }) => {
    const defaultTier = getTier(profileData.profileType);
    const [viewTier, setViewTier] = useState<ProfileTier>(defaultTier);

    // Filter products visible for the SELECTED view tier
    const visibleProducts = ALL_PRODUCTS.filter(p => p.tiers.includes(viewTier));

    // Group by section
    const sections = ['core', 'business', 'extra'] as const;
    const grouped = sections
        .map(section => ({
            key: section,
            ...SECTION_LABELS[section],
            products: visibleProducts.filter(p => p.section === section),
        }))
        .filter(group => group.products.length > 0);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Welcome Hero */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">
                            Hi, <span className="text-indigo-600">{profileData.displayName || profileData.username}</span> 👋
                        </h1>
                        <p className="text-xs text-gray-400 font-medium mt-1">
                            {TIER_META[viewTier].subtitle}
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{stats?.totalViews || 0}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Views</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{stats?.clicks || 0}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Clicks</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            </div>

            {/* ═══════════ SHARE PROFILE BUTTON ═══════════ */}
            <button
                onClick={() => onLaunch('share-cards')}
                className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
            >
                <span className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg animate-bounce">📤</span>
                    Share Profile Cards
                </span>
            </button>

            {/* ═══════════ VIEW MODE TOGGLE ═══════════ */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5">
                {(['personal', 'business', 'ngo'] as ProfileTier[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setViewTier(t)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewTier === t
                            ? 'bg-white text-gray-900 shadow-md'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <span>{TIER_META[t].emoji}</span>
                        {TIER_META[t].label}
                        {t === defaultTier && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Grouped Product Sections */}
            {grouped.map((group, groupIdx) => (
                <div key={group.key}>
                    <div className="mb-4 ml-1">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{group.title}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">{group.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.products.map((product, idx) => (
                            <button
                                key={product.id}
                                onClick={() => onLaunch(product.id)}
                                className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all group text-left relative overflow-hidden ${product.comingSoon ? 'opacity-70' : ''}`}
                                style={{ animationDelay: `${(groupIdx * 100) + (idx * 50)}ms` }}
                            >
                                {product.comingSoon && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-100 text-green-600 text-[7px] font-black uppercase tracking-wider rounded-full">
                                        Soon
                                    </span>
                                )}
                                <div className={`w-10 h-10 ${product.color} rounded-xl flex items-center justify-center text-white text-lg mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                                    {product.emoji}
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-0.5">{product.name}</h4>
                                <p className="text-[10px] text-gray-500 font-medium">{product.desc}</p>

                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                        →
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Launcher;
