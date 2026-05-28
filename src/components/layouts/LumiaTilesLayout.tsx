import React from 'react';
import { UserProfile, Voucher } from '../../types';
import { Theme } from '../../types/theme';
import { EnvelopeIcon, PhoneIcon, GlobeIcon, MapMarkerIcon, TicketIcon, GiftIcon } from '../Icons';
import LinkRenderer from '../LinkRenderer';
import { useLanguage } from '../../LanguageContext';

interface LumiaTilesLayoutProps {
    profileData: UserProfile;
    theme: Theme;
    isLoading?: boolean;
}

// Tile colors for Lumia-style vibrant tiles
const TILE_COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-red-500',
    'bg-lime-500',
];

const LumiaTilesLayout: React.FC<LumiaTilesLayoutProps> = ({
    profileData,
    theme,
    isLoading = false
}) => {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    // Get a random but consistent color based on index
    const getTileColor = (index: number) => TILE_COLORS[index % TILE_COLORS.length];

    // Build tiles data from profile
    const tiles: { label: string; value: string; icon: React.ReactNode; href?: string; size?: 'sm' | 'md' | 'lg' | 'wide' }[] = [];

    // Profile Photo as hero tile
    if (profileData.photoURL) {
        tiles.push({
            label: profileData.displayName || profileData.username,
            value: 'Profile',
            icon: <img src={profileData.photoURL} alt="" className="w-full h-full object-cover" />,
            size: 'lg'
        });
    }

    // Phone
    if (profileData.mobileNumber) {
        tiles.push({
            label: isAr ? 'الهاتف' : 'Call',
            value: profileData.mobileNumber,
            icon: <PhoneIcon className="w-8 h-8" />,
            href: `tel:${profileData.mobileNumber}`,
            size: 'md'
        });
    }

    // WhatsApp
    if (profileData.mobileNumber) {
        tiles.push({
            label: 'WhatsApp',
            value: isAr ? 'تواصل معنا' : 'Chat Now',
            icon: <span className="text-3xl">💬</span>,
            href: `https://wa.me/${profileData.mobileNumber?.replace(/[^0-9]/g, '')}`,
            size: 'md'
        });
    }

    // Website
    if (profileData.website) {
        tiles.push({
            label: isAr ? 'الموقع' : 'Website',
            value: profileData.website.replace(/^https?:\/\//, ''),
            icon: <GlobeIcon className="w-8 h-8" />,
            href: profileData.website,
            size: 'md'
        });
    }

    // Location — only if explicitly set in public profile settings
    if (profileData.location) {
        tiles.push({
            label: isAr ? 'الموقع' : 'Location',
            value: profileData.location,
            icon: <MapMarkerIcon className="w-8 h-8" />,
            size: 'wide'
        });
    }

    // Vouchers
    if (profileData.vouchers && profileData.vouchers.length > 0) {
        tiles.push({
            label: isAr ? 'العروض' : 'Offers',
            value: `${profileData.vouchers.length} ${isAr ? 'عرض' : 'Available'}`,
            icon: <GiftIcon className="w-8 h-8" />,
            size: 'md'
        });
    }

    // Gallery items
    profileData.gallery?.slice(0, 3).forEach((item, idx) => {
        if (item.type === 'image') {
            tiles.push({
                label: '',
                value: '',
                icon: <img src={item.url} alt="" className="w-full h-full object-cover" />,
                size: idx === 0 ? 'lg' : 'md'
            });
        }
    });

    // Add links as tiles
    profileData.links?.slice(0, 4).forEach((link, idx) => {
        tiles.push({
            label: link.title,
            value: '',
            icon: <span className="text-2xl">🔗</span>,
            href: link.url,
            size: 'sm'
        });
    });

    return (
        <div
            className="min-h-screen bg-slate-900 p-4 md:p-8"
            dir={isAr ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="max-w-4xl mx-auto mb-6">
                {/* Cover Photo */}
                {profileData.coverURL && (
                    <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-4">
                        <img
                            src={profileData.coverURL}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {profileData.photoURL ? (
                        <img
                            src={profileData.photoURL}
                            alt={profileData.displayName}
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-700"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white font-black">
                            {profileData.displayName?.charAt(0) || '?'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white">
                            {profileData.displayName || `@${profileData.username}`}
                        </h1>
                        {profileData.subtitle && (
                            <p className="text-slate-400 text-sm mt-1">{profileData.subtitle}</p>
                        )}
                        <span className="inline-block mt-2 px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded">
                            {profileData.profileType?.replace('_', ' ') || 'Personal'}
                        </span>
                    </div>
                </div>

                {profileData.bio && (
                    <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-2xl">
                        {profileData.bio}
                    </p>
                )}
            </header>

            {/* Lumia Tiles Grid */}
            <main className="max-w-4xl mx-auto">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">

                    {/* Phone Tile */}

                    {profileData.mobileNumber && (
                        <a
                            href={`tel:${profileData.mobileNumber}`}
                            className="col-span-2 row-span-1 bg-green-500 rounded-xl p-4 flex flex-col justify-between text-white hover:brightness-110 transition-all active:scale-95"
                        >
                            <PhoneIcon className="w-8 h-8 opacity-80" />
                            <div className="mt-2">
                                <p className="text-xs opacity-80">{isAr ? 'اتصل' : 'Call'}</p>
                                <p className="text-sm font-bold">{profileData.mobileNumber}</p>
                            </div>
                        </a>
                    )}

                    {profileData.mobileNumber && (
                        <a
                            href={`https://wa.me/${profileData.mobileNumber?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 row-span-1 bg-emerald-600 rounded-xl p-4 flex flex-col justify-between text-white hover:brightness-110 transition-all active:scale-95"
                        >
                            <span className="text-3xl">💬</span>
                            <div className="mt-2">
                                <p className="text-xs opacity-80">WhatsApp</p>
                                <p className="text-sm font-bold">{isAr ? 'محادثة' : 'Chat'}</p>
                            </div>
                        </a>
                    )}

                    {profileData.website && (
                        <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 row-span-1 bg-purple-500 rounded-xl p-4 flex flex-col justify-between text-white hover:brightness-110 transition-all active:scale-95"
                        >
                            <GlobeIcon className="w-8 h-8 opacity-80" />
                            <div className="mt-2">
                                <p className="text-xs opacity-80">{isAr ? 'الموقع' : 'Website'}</p>
                                <p className="text-sm font-bold truncate">{profileData.website.replace(/^https?:\/\//, '').slice(0, 15)}...</p>
                            </div>
                        </a>
                    )}

                    {/* Voucher Tile - Large with Redeem Button */}
                    {profileData.vouchers && profileData.vouchers.length > 0 && (
                        <div className="col-span-4 md:col-span-3 row-span-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 flex flex-col text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <TicketIcon className="w-8 h-8" />
                                <span className="text-xl font-black">{isAr ? 'العروض الحصرية' : 'Exclusive Offers'}</span>
                            </div>
                            <div className="flex-1 space-y-2 overflow-hidden">
                                {profileData.vouchers.slice(0, 3).map((voucher, idx) => (
                                    <div key={voucher.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm">{voucher.title}</p>
                                            <p className="text-amber-100 text-xs">{voucher.value}</p>
                                        </div>
                                        <a
                                            href={`/offer/${profileData.username}/${voucher.id}`}
                                            className="px-3 py-1.5 bg-white text-amber-600 font-bold text-xs rounded-full hover:bg-amber-50 transition-colors"
                                        >
                                            {isAr ? 'استبدال' : 'Redeem'}
                                        </a>
                                    </div>
                                ))}
                            </div>
                            {profileData.vouchers.length > 3 && (
                                <p className="text-center text-amber-100 text-xs mt-2">
                                    +{profileData.vouchers.length - 3} {isAr ? 'المزيد' : 'more offers'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Gallery Tiles */}
                    {profileData.gallery?.slice(0, 4).map((item, idx) => (
                        <div
                            key={item.id}
                            className={`
                                ${idx === 0 ? 'col-span-2 row-span-2' : 'col-span-2 row-span-1'}
                                rounded-xl overflow-hidden bg-slate-800
                            `}
                        >
                            {item.type === 'image' ? (
                                <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover min-h-[100px]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-700">
                                    <span className="text-4xl">▶️</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Location Tile — only if explicitly set */}
                    {profileData.location && (
                        <div className="col-span-2 row-span-1 bg-cyan-500 rounded-xl p-4 flex flex-col justify-between text-white">
                            <MapMarkerIcon className="w-8 h-8 opacity-80" />
                            <div className="mt-2">
                                <p className="text-xs opacity-80">{isAr ? 'الموقع' : 'Location'}</p>
                                <p className="text-sm font-bold">{profileData.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Links as smaller tiles */}
                    {profileData.links?.slice(0, 6).map((link, idx) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                                col-span-2 row-span-1 
                                ${getTileColor(idx + 4)} 
                                rounded-xl p-4 flex flex-col justify-between text-white 
                                hover:brightness-110 transition-all active:scale-95
                            `}
                        >
                            <span className="text-2xl">
                                {link.type === 'social' ? '📱' :
                                    link.type === 'website' ? '🌐' :
                                        link.type === 'location' ? '📍' : '🔗'}
                            </span>
                            <div className="mt-2">
                                <p className="text-sm font-bold truncate">{link.title}</p>
                            </div>
                        </a>
                    ))}

                </div>
            </main>

            <footer className="max-w-4xl mx-auto mt-8 text-center text-slate-500 text-xs">
                <p>© {new Date().getFullYear()} {profileData.displayName}</p>
            </footer>
        </div>
    );
};

export default LumiaTilesLayout;
