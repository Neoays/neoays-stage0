import React, { useState } from 'react';
import { UserProfile, ClaimedVoucher } from '../../types';
import ShareAssetsModal from '../nProfile/ShareAssetsModal'; // Moved to nProfile
import RedeemedVoucherCard from '../../components/RedeemedVoucherCard';
import { TicketIcon } from '../../components/Icons';

interface NWalletModuleProps {
    profileData: UserProfile;
    isStandalone?: boolean;
}

const NWalletModule: React.FC<NWalletModuleProps> = ({ profileData, isStandalone = false }) => {
    const [viewingQr, setViewingQr] = useState<ClaimedVoucher | null>(null);
    const [viewingCard, setViewingCard] = useState<ClaimedVoucher | null>(null);
    const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>(null);

    const handleShare = async (voucher: ClaimedVoucher) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: voucher.title,
                    text: `Check out this voucher: ${voucher.title} - ${voucher.value}`,
                    url: window.location.href
                });
            } catch (error) {
                // Removed debug log
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(`${voucher.title} - ${voucher.code}`);
            alert("Voucher details copied to clipboard!");
        }
    };

    return (
        <div className={`space-y-6 animate-fade-in-up ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TicketIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">nWallet</h2>
                    </div>
                    <p className="text-emerald-100 font-medium text-lg max-w-lg">your digital asset hub : access cards and vouchers</p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-1">My Wallet</h3>
                <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-wider">Saved Offers ({profileData.savedVouchers?.length || 0})</p>

                <div className="flex flex-wrap gap-4 pb-4 justify-center sm:justify-start">
                    {(profileData.savedVouchers && profileData.savedVouchers.length > 0) ? (
                        profileData.savedVouchers.map((voucher: any, idx) => {
                            const isExpanded = expandedVoucherId === voucher.id;
                            return (
                                <div
                                    key={`${voucher.id}-${idx}`}
                                    onClick={() => setExpandedVoucherId(isExpanded ? null : voucher.id)}
                                    className={`flex-shrink-0 w-64 h-80 bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer group hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md relative ${voucher.status === 'used' || voucher.status === 'redeemed' ? 'grayscale opacity-75' : ''}`}
                                >
                                    {/* Image First Background or Placeholder */}
                                    <div className="h-2/3 bg-indigo-50 relative overflow-hidden">
                                        {voucher.imageUrl ? (
                                            <img src={voucher.imageUrl} alt={voucher.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🎟️</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1">{voucher.value}</p>
                                            <h4 className="font-bold text-white text-sm line-clamp-2">{voucher.title}</h4>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            {(voucher.status === 'used' || voucher.status === 'redeemed') ? (
                                                <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[9px] font-black px-2 py-1 rounded-full uppercase">Used</span>
                                            ) : (
                                                <span className="bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-lg">Active</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Info / Actions */}
                                    <div className="h-1/3 p-4 flex flex-col justify-between bg-white">
                                        <p className="text-[10px] text-gray-400 line-clamp-2">{voucher.description || 'No description provided.'}</p>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewingCard(voucher); }}
                                                className="flex-1 text-[10px] bg-slate-100 text-slate-700 py-2 rounded-lg font-black uppercase tracking-tighter hover:bg-slate-200 transition"
                                            >
                                                View Card
                                            </button>
                                            {(voucher.status === 'active' || !voucher.status) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewingQr(voucher); }}
                                                    className="flex-1 text-[10px] bg-indigo-600 text-white py-2 rounded-lg font-black uppercase tracking-tighter hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
                                                >
                                                    QR Code
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="w-full p-12 bg-gray-50 rounded-2xl text-center text-sm text-gray-400 border border-dashed border-gray-200">
                            <p className="mb-2 italic">Your wallet is empty...</p>
                            <p className="text-[10px] uppercase font-bold text-indigo-400">Claim offers to see them here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Assets Modal */}
            {viewingQr && (
                <ShareAssetsModal
                    isOpen={!!viewingQr}
                    onClose={() => setViewingQr(null)}
                    type="voucher"
                    data={viewingQr}
                />
            )}

            {/* Redeemed Card Modal */}
            {viewingCard && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto" onClick={() => setViewingCard(null)}>
                    <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <RedeemedVoucherCard
                            claim={viewingCard as any}
                            merchant={profileData}
                            onShare={() => handleShare(viewingCard)}
                        />
                        <button
                            onClick={() => setViewingCard(null)}
                            className="mt-4 w-full bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NWalletModule;
