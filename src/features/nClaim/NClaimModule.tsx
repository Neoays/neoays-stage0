import React, { useState } from 'react';
import { UserProfile, Voucher } from '../../types';
import { TrashIcon, PlusIcon, TicketIcon, GiftIcon, ShareIcon, SpinnerIcon, CameraIcon } from '../../components/Icons';
import ShareAssetsModal from '../nProfile/ShareAssetsModal';
import { compressImage, fileToDataUrl } from '../../utils/imageUtils';

interface NClaimModuleProps {
    profileData: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    isStandalone?: boolean;
}

const NClaimModule: React.FC<NClaimModuleProps> = ({ profileData, onUpdateProfile, isStandalone = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [shareVoucher, setShareVoucher] = useState<Voucher | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [value, setValue] = useState("");
    const [code, setCode] = useState("");
    const [desc, setDesc] = useState("");
    const [expiry, setExpiry] = useState("");
    const [terms, setTerms] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [usageType, setUsageType] = useState<'single' | 'multiple' | 'limited'>('single');
    const [usageLimit, setUsageLimit] = useState<number | ''>('');
    const [autoCompress, setAutoCompress] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const finalUrl = autoCompress
                ? await compressImage(file, { maxSizeMB: 0.1, maxWidthOrHeight: 800 })
                : await fileToDataUrl(file);

            setImagePreview(finalUrl);
        } catch (error) {
            console.error("Voucher image optimization failed:", error);
            // Fallback to basic fileToDataUrl
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAdd = async () => {
        if (!title || !value) return;
        setIsSaving(true);
        try {
            const newVoucher: Voucher = {
                id: Date.now().toString(),
                title,
                value,
                code,
                description: desc,
                expiryDate: expiry,
                termsAndConditions: terms,
                imageUrl: imagePreview,
                isPublic: isPublic,
                usageType: usageType,
                ...(usageType === 'limited' ? { usageLimit: Number(usageLimit) } : {})
            };
            const updatedVouchers = [...(profileData.vouchers || []), newVoucher];
            await onUpdateProfile({ vouchers: updatedVouchers });

            setIsAdding(false);
            // Reset Form
            setTitle("");
            setValue("");
            setCode("");
            setDesc("");
            setExpiry("");
            setTerms("");
            setIsPublic(false);
            setImagePreview("");
            setUsageType('single');
            setUsageLimit('');
        } catch (error) {
            console.error("Error creating nClaim voucher:", error);
            alert("Failed to create offer. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this offer?")) return;
        try {
            const updatedVouchers = (profileData.vouchers || []).filter(v => v.id !== id);
            await onUpdateProfile({ vouchers: updatedVouchers });
        } catch (error) {
            console.error("Error deleting voucher:", error);
        }
    };

    return (
        <div className={`space-y-6 ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <GiftIcon className="w-48 h-48 transform rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <TicketIcon className="h-6 w-6 text-white" />
                        </span>
                        <h1 className="text-4xl font-black tracking-tighter">nClaim</h1>
                    </div>
                    <p className="text-lg font-medium opacity-95 max-w-xl leading-relaxed">
                        boost conversion with neoclaim : the simplest way to deliver discounts
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left: Actions & Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-2">My Offers</h3>
                        <p className="text-xs text-slate-500 mb-4">Manage your active coupons, gift cards, and special offers.</p>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-bold text-slate-700">Active</span>
                                <span className="text-lg font-black text-emerald-600">{(profileData.vouchers || []).length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm font-bold text-slate-700">Public</span>
                                <span className="text-lg font-black text-indigo-600">{(profileData.vouchers || []).filter(v => v.isPublic).length}</span>
                            </div>
                        </div>

                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="h-4 w-4" /> Create New Claim
                            </button>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100/50">
                        <h4 className="font-bold text-indigo-900 text-sm mb-2">Pro Tip</h4>
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            Public offers appear on the Neoays global feed, increasing your visibility to potential customers nearby.
                        </p>
                    </div>
                </div>

                {/* Right: List & Form */}
                <div className="md:col-span-2 space-y-4">
                    {isAdding ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="font-black text-lg text-slate-900">Create New Offer</h3>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase">Cancel</button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder="e.g. Summer Flash Sale"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value / Discount</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900"
                                            placeholder="e.g. 50% OFF"
                                            value={value}
                                            onChange={e => setValue(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
                                            value={expiry}
                                            onChange={e => setExpiry(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Usage Limits</label>
                                    <div className="flex gap-2">
                                        {(['single', 'multiple', 'limited'] as const).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setUsageType(type)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${usageType === type
                                                    ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm'
                                                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-200/50'
                                                    }`}
                                            >
                                                {type === 'single' && 'One-Time'}
                                                {type === 'multiple' && 'Unlimited'}
                                                {type === 'limited' && 'Fixed'}
                                            </button>
                                        ))}
                                    </div>
                                    {usageType === 'limited' && (
                                        <input
                                            type="number"
                                            className="w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                                            placeholder="Max uses (e.g. 100)"
                                            value={usageLimit}
                                            onChange={e => setUsageLimit(Number(e.target.value))}
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Offer Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="relative group w-24 h-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <CameraIcon className="w-8 h-8 text-slate-300" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-Compress</span>
                                                <div className="relative inline-block w-8 align-middle select-none">
                                                    <input
                                                        type="checkbox"
                                                        id="voucher-compress"
                                                        className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-2 appearance-none cursor-pointer border-slate-200 checked:right-0 checked:border-emerald-500 checked:bg-emerald-500 transition-all duration-300"
                                                        style={{ right: autoCompress ? '0' : 'auto', left: autoCompress ? 'auto' : '0' }}
                                                        checked={autoCompress}
                                                        onChange={(e) => setAutoCompress(e.target.checked)}
                                                    />
                                                    <label htmlFor="voucher-compress" className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${autoCompress ? 'bg-emerald-500' : 'bg-gray-300'}`}></label>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400">Smaller images load faster for your customers.</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPublic ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 text-sm block">Publicly Listed</span>
                                            <span className="text-[10px] text-slate-500 block">Show on Neoays Global Feed</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Details (Optional)</label>
                                    <textarea
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm"
                                        placeholder="Terms, conditions, or description..."
                                        value={terms}
                                        onChange={e => setTerms(e.target.value)}
                                        rows={2}
                                    />
                                    <input
                                        className="w-full mt-2 p-3 bg-slate-50 border-none rounded-xl text-sm font-mono"
                                        placeholder="Promo Code (Optional)"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleAdd}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'Creating Claim...' : 'Publish Offer'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(profileData.vouchers || []).length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <TicketIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">No offers active yet.</p>
                                    <button onClick={() => setIsAdding(true)} className="mt-2 text-emerald-600 font-bold text-sm hover:underline">Create your first claim</button>
                                </div>
                            ) : (
                                (profileData.vouchers || []).map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                                        className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 ${expandedId === v.id ? 'shadow-lg ring-2 ring-emerald-500/20' : 'hover:shadow-md'}`}
                                    >
                                        <div className="p-4 flex items-center gap-4 cursor-pointer">
                                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-xl shadow-sm ${v.isPublic ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {v.isPublic ? '🌍' : '🔒'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">{v.title}</h4>
                                                <p className="text-xs text-emerald-600 font-bold">{v.value}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${v.isPublic ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {v.isPublic ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                        </div>

                                        {expandedId === v.id && (
                                            <div className="px-4 pb-4 pt-0 animate-fade-in">
                                                <div className="w-full h-px bg-slate-100 mb-4"></div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Code</p>
                                                        <p className="font-mono text-slate-700 font-bold">{v.code || 'NO CODE'}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Type</p>
                                                        <p className="text-slate-700 font-bold capitalize">{v.usageType === 'single' ? 'One-time' : v.usageType}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShareVoucher(v); }}
                                                        className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                                                    >
                                                        <ShareIcon className="h-3 w-3" /> Share
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {shareVoucher && (
                <ShareAssetsModal
                    isOpen={!!shareVoucher}
                    onClose={() => setShareVoucher(null)}
                    type="voucher"
                    data={{ ...shareVoucher, merchantUsername: profileData.username }}
                    logoUrl={profileData.photoURL}
                />
            )}
        </div>
    );
};

export default NClaimModule;
