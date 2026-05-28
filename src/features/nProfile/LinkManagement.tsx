import React, { useState } from 'react';
import { UserProfile, UserLink } from '../../types';
import { TrashIcon, PlusIcon, PhoneIcon, WhatsAppIcon, GlobeIcon, MapPinIcon, EnvelopeIcon } from '../../components/Icons';

// YouTube URL to Embed URL converter
const convertToYouTubeEmbed = (url: string): string => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
};

const LinkManagement = ({ profileData, handleUpdateProfileLinks }: { profileData: UserProfile, handleUpdateProfileLinks: (links: UserLink[]) => Promise<void>, t: any }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingLink, setEditingLink] = useState<UserLink | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<UserLink['type']>('standard');
    const [isPrimary, setIsPrimary] = useState(false);
    const [displayStyle, setDisplayStyle] = useState<'main' | 'bubble'>('main');

    const handleSaveLink = () => {
        if (!title || !url) return;

        // Auto-convert YouTube URLs
        let finalUrl = url;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            finalUrl = convertToYouTubeEmbed(url);
        }

        const newLink: UserLink = {
            id: editingLink?.id || new Date().getTime().toString(),
            title,
            url: finalUrl,
            type,
            isPrimary,
            displayStyle,
            iconType: detectIconType(url, type)
        };

        let updatedLinks;
        if (editingLink) {
            updatedLinks = (profileData.links || []).map(l => l.id === editingLink.id ? newLink : l);
        } else {
            updatedLinks = [...(profileData.links || []), newLink];
        }

        handleUpdateProfileLinks(updatedLinks);
        resetForm();
    };

    const detectIconType = (url: string, type?: string) => {
        const lowUrl = url.toLowerCase();
        if (lowUrl.includes('instagram.com')) return 'instagram';
        if (lowUrl.includes('facebook.com')) return 'facebook';
        if (lowUrl.includes('twitter.com') || lowUrl.includes('x.com')) return 'twitter';
        if (lowUrl.includes('linkedin.com')) return 'linkedin';
        if (lowUrl.includes('wa.me') || lowUrl.includes('whatsapp.com')) return 'whatsapp';
        if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) return 'youtube';
        if (lowUrl.endsWith('.pdf')) return 'pdf';
        if (url.startsWith('tel:')) return 'phone';
        if (url.startsWith('mailto:')) return 'email';
        if (type === 'location') return 'location';
        return 'globe';
    };

    const resetForm = () => {
        setTitle("");
        setUrl("");
        setType('standard');
        setIsPrimary(false);
        setDisplayStyle('main');
        setIsAdding(false);
        setEditingLink(null);
    };

    const startEditing = (link: UserLink) => {
        setEditingLink(link);
        setTitle(link.title);
        setUrl(link.url);
        setType(link.type || 'standard');
        setIsPrimary(link.isPrimary || false);
        setDisplayStyle(link.displayStyle || 'main');
        setIsAdding(true);
    };

    const handleDeleteLink = (linkId: string) => {
        if (window.confirm("Remove this link?")) {
            const updatedLinks = (profileData.links || []).filter(link => link.id !== linkId);
            handleUpdateProfileLinks(updatedLinks);
        }
    };

    const toggleDisplayStyle = (linkId: string) => {
        const updatedLinks = (profileData.links || []).map(link => {
            if (link.id === linkId) {
                return { ...link, displayStyle: link.displayStyle === 'bubble' ? 'main' : 'bubble' as 'main' | 'bubble' };
            }
            return link;
        });
        handleUpdateProfileLinks(updatedLinks);
    };

    // Enhanced templates with categories
    const contactTemplates = [
        { label: 'Call', icon: '📞', color: 'bg-blue-500', urlPrefix: 'tel:', title: 'Call Us' },
        { label: 'WhatsApp', icon: '💬', color: 'bg-green-500', urlPrefix: 'https://wa.me/', title: 'WhatsApp' },
        { label: 'Email', icon: '✉️', color: 'bg-amber-500', urlPrefix: 'mailto:', title: 'Email Us' },
    ];

    const linkTemplates = [
        { label: 'Website', icon: '🌐', color: 'bg-indigo-500', urlPrefix: 'https://', title: 'Our Website' },
        { label: 'Location', icon: '📍', color: 'bg-red-500', urlPrefix: 'https://maps.google.com/?q=', title: 'Find Us' },
        { label: 'PDF/Menu', icon: '📄', color: 'bg-purple-500', urlPrefix: 'https://', title: 'View Menu' },
    ];

    const mediaTemplates = [
        { label: 'YouTube', icon: '▶️', color: 'bg-red-600', urlPrefix: 'https://youtube.com/watch?v=', title: 'Watch Video' },
        { label: 'Instagram', icon: '📷', color: 'bg-pink-500', urlPrefix: 'https://instagram.com/', title: 'Instagram' },
        { label: 'TikTok', icon: '🎵', color: 'bg-black', urlPrefix: 'https://tiktok.com/@', title: 'TikTok' },
    ];

    const getIconForType = (iconType?: string) => {
        switch (iconType) {
            case 'whatsapp': return '💬';
            case 'phone': return '📞';
            case 'email': return '✉️';
            case 'youtube': return '▶️';
            case 'instagram': return '📷';
            case 'pdf': return '📄';
            case 'location': return '📍';
            default: return '🔗';
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Link List */}
            <div className="space-y-2">
                {(profileData.links || []).map(link => (
                    <div key={link.id} className="group flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-white border border-gray-100">
                            {getIconForType(link.iconType)}
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => startEditing(link)} style={{ cursor: 'pointer' }}>
                            <p className="font-bold text-gray-800 text-sm truncate">{link.title}</p>
                            <p className="text-[10px] text-gray-400 truncate">{link.url}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => toggleDisplayStyle(link.id)}
                                className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${link.displayStyle === 'bubble'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}
                                title="Toggle display style"
                            >
                                {link.displayStyle === 'bubble' ? '🫧' : '📋'}
                            </button>
                            <button
                                onClick={() => handleDeleteLink(link.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-all"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Link Section */}
            {isAdding ? (
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-indigo-100 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                            {editingLink ? '✏️ Edit Link' : '➕ Add New Link'}
                        </h4>
                        <button onClick={resetForm} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                    </div>

                    {/* Quick Templates - Only show when adding new */}
                    {!editingLink && (
                        <div className="space-y-3">
                            {/* Contact Row */}
                            <div>
                                <label className="text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">Contact</label>
                                <div className="flex gap-1.5">
                                    {contactTemplates.map(t => (
                                        <button
                                            key={t.label}
                                            onClick={() => { setTitle(t.title); setUrl(t.urlPrefix); }}
                                            className={`flex-1 ${t.color} text-white py-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 hover:scale-105 transition-transform shadow-sm`}
                                        >
                                            <span>{t.icon}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Links Row */}
                            <div>
                                <label className="text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">Links</label>
                                <div className="flex gap-1.5">
                                    {linkTemplates.map(t => (
                                        <button
                                            key={t.label}
                                            onClick={() => { setTitle(t.title); setUrl(t.urlPrefix); }}
                                            className={`flex-1 ${t.color} text-white py-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 hover:scale-105 transition-transform shadow-sm`}
                                        >
                                            <span>{t.icon}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Media Row */}
                            <div>
                                <label className="text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1 block">Media & Social</label>
                                <div className="flex gap-1.5">
                                    {mediaTemplates.map(t => (
                                        <button
                                            key={t.label}
                                            onClick={() => { setTitle(t.title); setUrl(t.urlPrefix); }}
                                            className={`flex-1 ${t.color} text-white py-2 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 hover:scale-105 transition-transform shadow-sm`}
                                        >
                                            <span>{t.icon}</span>
                                            <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Inputs */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Button Label"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 outline-none"
                        />
                        <input
                            type="text"
                            placeholder="URL (paste link here)"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 outline-none"
                        />
                        {/* YouTube hint */}
                        {(url.includes('youtube') || url.includes('youtu.be')) && (
                            <p className="text-[10px] text-green-600 font-medium px-1">✓ YouTube link will auto-embed</p>
                        )}
                    </div>

                    {/* Display Style */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setDisplayStyle('main')}
                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1 ${displayStyle === 'main' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
                        >
                            📋 Main
                        </button>
                        <button
                            onClick={() => setDisplayStyle('bubble')}
                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1 ${displayStyle === 'bubble' ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
                        >
                            🫧 Bubble
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={resetForm}
                            className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-bold uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveLink}
                            disabled={!title || !url}
                            className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                        >
                            Save Link
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-widest">Add Link</span>
                </button>
            )}
        </div>
    );
};

export default LinkManagement;
