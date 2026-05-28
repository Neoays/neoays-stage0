import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { PlusIcon, TrashIcon, LinkIcon, SpinnerIcon } from '../../components/Icons';
import { compressImage, fileToDataUrl } from '../../utils/imageUtils';

interface BusinessFeaturesEditorProps {
    profileData: UserProfile;
    onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const BusinessFeaturesEditor: React.FC<BusinessFeaturesEditorProps> = ({ profileData, onUpdateProfile }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [autoCompress] = useState(true); // Forced true for stability
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Local state for inputs before saving can be added if needed, 
    // but for now we'll trigger updates directly or use onBlur.

    const handleAddGalleryItem = () => {
        const url = prompt("Enter Image URL or YouTube Video Link:");
        if (!url) return;

        const type = url.includes('youtube.com') || url.includes('youtu.be') ? 'video' : 'image';
        const newItem = {
            id: Date.now().toString(),
            type: type as 'image' | 'video',
            url: url
        };

        const updatedGallery = [...(profileData.gallery || []), newItem];
        onUpdateProfile({ gallery: updatedGallery });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const finalUrl = autoCompress
                ? await compressImage(file)
                : await fileToDataUrl(file);

            const newItem = {
                id: Date.now().toString(),
                type: 'image' as const,
                url: finalUrl
            };

            const updatedGallery = [...(profileData.gallery || []), newItem];
            await onUpdateProfile({ gallery: updatedGallery });
        } catch (error) {
            console.error("Gallery upload failed:", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveGalleryItem = (id: string) => {
        const updatedGallery = (profileData.gallery || []).filter(item => item.id !== id);
        onUpdateProfile({ gallery: updatedGallery });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div
                className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Business Profile Settings</h3>
                        <p className="text-xs text-gray-500">Configure gallery, reviews, and feedback.</p>
                    </div>
                </div>
                <div>
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 space-y-6">
                    {/* 1. Header Subtitle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline / Subtitle</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Advanced Medical Imaging Solutions"
                            defaultValue={profileData.subtitle || ''}
                            onBlur={(e) => onUpdateProfile({ subtitle: e.target.value })}
                        />
                    </div>

                    {/* 2. Google Reviews */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Google Reviews URL</label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                <LinkIcon className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Paste your Google Maps Review link here"
                                defaultValue={profileData.googleReviewUrl || ''}
                                onBlur={(e) => onUpdateProfile({ googleReviewUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 2.5 Website URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://www.yourbusiness.com"
                            defaultValue={profileData.website || ''}
                            onBlur={(e) => onUpdateProfile({ website: e.target.value })}
                        />
                    </div>

                    {/* 2.6 PDF URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hosted PDF Link (Catalog/Menu)</label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                <LinkIcon className="h-4 w-4" />
                            </span>
                            <input
                                type="url"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="https://example.com/catalog.pdf"
                                defaultValue={profileData.pdfUrl || ''}
                                onBlur={(e) => onUpdateProfile({ pdfUrl: e.target.value })}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Direct link to a PDF file hosted on Google Drive, Dropbox, or your server.</p>
                    </div>

                    {/* 3. Feedback Toggle */}
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div>
                            <h4 className="text-sm font-bold text-blue-900">Enable Feedback Survey</h4>
                            <p className="text-xs text-blue-700">Show "How did you hear about us?" section.</p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="toggle"
                                id="feedback-toggle"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-200 checked:right-0 checked:border-blue-600 transition-all duration-300"
                                style={{ right: profileData.feedbackEnabled ? '0' : 'auto', left: profileData.feedbackEnabled ? 'auto' : '0' }}
                                checked={profileData.feedbackEnabled || false}
                                onChange={(e) => onUpdateProfile({ feedbackEnabled: e.target.checked })}
                            />
                            <label htmlFor="feedback-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${profileData.feedbackEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></label>
                        </div>
                    </div>

                    {/* 3.5 Feedback Reward Toggle */}
                    {profileData.feedbackEnabled && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 ml-4 border-l-4 border-l-yellow-400 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-900">Offer Reward for Feedback?</h4>
                                    <p className="text-xs text-yellow-700">Customers can claim a gift after submitting.</p>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="reward-toggle"
                                        id="reward-toggle"
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-yellow-200 checked:right-0 checked:border-yellow-600 transition-all duration-300"
                                        style={{ right: profileData.feedbackRewardEnabled ? '0' : 'auto', left: profileData.feedbackRewardEnabled ? 'auto' : '0' }}
                                        checked={profileData.feedbackRewardEnabled || false}
                                        onChange={(e) => onUpdateProfile({ feedbackRewardEnabled: e.target.checked })}
                                    />
                                    <label htmlFor="reward-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${profileData.feedbackRewardEnabled ? 'bg-yellow-500' : 'bg-gray-300'}`}></label>
                                </div>
                            </div>

                            {/* Voucher Selector */}
                            {profileData.feedbackRewardEnabled && (
                                <div>
                                    <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Select Reward Voucher</label>
                                    {profileData.vouchers && profileData.vouchers.length > 0 ? (
                                        <select
                                            value={profileData.feedbackRewardVoucherId || ''}
                                            onChange={(e) => onUpdateProfile({ feedbackRewardVoucherId: e.target.value })}
                                            className="w-full text-sm border-yellow-200 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                                        >
                                            <option value="">-- Select a Voucher --</option>
                                            {profileData.vouchers.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.title} ({v.value})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-xs text-red-500 font-bold">No vouchers found. Create one in the Voucher Manager first.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Media Gallery Manager */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-gray-700 font-bold uppercase tracking-widest text-xs">Media Gallery</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center transition shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isUploading ? <SpinnerIcon className="w-3 h-3 mr-1 animate-spin" /> : <PlusIcon className="w-3 h-3 mr-1" />}
                                    Upload Local
                                </button>
                                <button
                                    onClick={handleAddGalleryItem}
                                    className="text-[10px] font-black uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center transition"
                                >
                                    <LinkIcon className="w-3 h-3 mr-1" /> Add URL
                                </button>
                            </div>
                        </div>

                        {/* Auto-Compression is now mandatory for stability, hidden from UI */}

                        {(profileData.gallery && profileData.gallery.length > 0) ? (
                            <div className="grid grid-cols-3 gap-3">
                                {profileData.gallery.map((item) => (
                                    <div key={item.id} className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white">
                                                <svg className="w-8 h-8 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleRemoveGalleryItem(item.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-0.5 truncate">
                                            {item.type === 'image' ? 'IMG' : 'VID'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-400">No media found. Add images or videos.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessFeaturesEditor;
