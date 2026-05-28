import React from 'react';
import { UserLink } from '../types';
import { GlobeIcon, PhoneIcon, WhatsAppIcon, InstagramIcon, FacebookIcon, TwitterIcon, LinkedinIcon, StarIcon, MapPinIcon, MailIcon } from './Icons';

interface LinkRendererProps {
    links: UserLink[];
    isAr?: boolean;
    primaryStyle?: 'grid' | 'cards' | 'minimal' | 'story';
    secondaryStyle?: 'list' | 'pills';
}

const LinkRenderer: React.FC<LinkRendererProps> = ({
    links,
    isAr = false,
    primaryStyle = 'grid'
}) => {
    if (!links || links.length === 0) return null;

    const primaryLinks = links.filter(l => l.isPrimary);
    const standardLinks = links.filter(l => !l.isPrimary);

    const getIcon = (iconType?: string, className: string = "w-5 h-5") => {
        switch (iconType) {
            case 'instagram': return <InstagramIcon className={className} />;
            case 'facebook': return <FacebookIcon className={className} />;
            case 'twitter': return <TwitterIcon className={className} />;
            case 'linkedin': return <LinkedinIcon className={className} />;
            case 'whatsapp': return <WhatsAppIcon className={className} />;
            case 'phone': return <PhoneIcon className={className} />;
            case 'email': return <MailIcon className={className} />;
            case 'location': return <MapPinIcon className={className} />;
            case 'star': return <StarIcon className={className} />;
            default: return <GlobeIcon className={className} />;
        }
    };

    const getEmoji = (iconType?: string) => {
        switch (iconType) {
            case 'whatsapp': return '💬';
            case 'instagram': return '📸';
            case 'star': return '⭐';
            case 'phone': return '📞';
            case 'location': return '📍';
            case 'email': return '✉️';
            default: return '🔗';
        }
    }

    return (
        <div className="w-full space-y-6">
            {/* Featured Links (Primary) */}
            {primaryLinks.length > 0 && (
                <div className={`grid ${primaryStyle === 'grid' ? 'grid-cols-2' : primaryStyle === 'story' ? 'grid-cols-1' : 'grid-cols-1'} gap-3`}>
                    {primaryLinks.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex ${primaryStyle === 'story' ? 'flex-row items-center gap-4 p-5 rounded-full' : 'flex-col items-center justify-center p-4 rounded-2xl'} bg-white/50 backdrop-blur-md border border-white/20 hover:bg-white/80 hover:shadow-lg transition-all group`}
                        >
                            <span className={`${primaryStyle === 'story' ? 'text-xl' : 'text-2xl mb-2'} group-hover:scale-110 transition-transform`}>
                                {getEmoji(link.iconType)}
                            </span>
                            <span className={`${primaryStyle === 'story' ? 'text-xs text-left' : 'text-[10px] text-center'} font-black uppercase tracking-widest text-slate-600 line-clamp-1`}>
                                {isAr ? (link.titleAr || link.title) : link.title}
                            </span>
                        </a>
                    ))}
                </div>
            )}

            {/* Standard Links List */}
            {standardLinks.length > 0 && (
                <div className="space-y-2">
                    {standardLinks.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/60 hover:shadow-md transition-all ${isAr ? 'flex-row-reverse text-right' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-indigo-600 shadow-sm">
                                {getIcon(link.iconType, "w-5 h-5")}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">
                                    {isAr ? (link.titleAr || link.title) : link.title}
                                </p>
                            </div>
                            <div className={`opacity-30 ${isAr ? 'rotate-180' : ''}`}>
                                <GlobeIcon className="w-4 h-4" />
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LinkRenderer;
