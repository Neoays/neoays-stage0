import React from 'react';
import { ClaimedVoucher, UserProfile } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { DownloadIcon, CheckCircleIcon } from './Icons';

interface RedeemedVoucherCardProps {
    claim: ClaimedVoucher;
    merchant: UserProfile;
    onShare?: () => void;
    onDownload?: () => void;
}

/**
 * Visual card component for displaying redeemed vouchers
 * Shows merchant info, voucher details, QR code, and redemption status
 */
export function RedeemedVoucherCard({ claim, merchant, onShare, onDownload }: RedeemedVoucherCardProps) {
    const isRedeemed = claim.status === 'redeemed';
    const isExpired = claim.expiryDate && new Date(claim.expiryDate) < new Date();

    const handleDownload = () => {
        if (onDownload) {
            onDownload();
        } else {
            // Default download implementation
            const card = document.getElementById(`voucher-card-${claim.id}`);
            if (card) {
                // Use html2canvas to convert to image
                import('html2canvas').then((html2canvas) => {
                    html2canvas.default(card, {
                        useCORS: true,
                        scale: 2,
                        backgroundColor: '#ffffff',
                        logging: false,
                        allowTaint: true,
                    }).then((canvas) => {
                        const link = document.createElement('a');
                        link.download = `voucher-${claim.title}-${claim.id}.png`;
                        link.href = canvas.toDataURL('image/png', 1.0);
                        link.click();
                    });
                });
            }
        }
    };

    const handleShare = () => {
        if (onShare) {
            onShare();
        } else {
            // Default share implementation
            if (navigator.share) {
                navigator.share({
                    title: `${claim.value} ${claim.title}`,
                    text: `I claimed this voucher from ${merchant.displayName || merchant.username}!`,
                    url: window.location.href
                }).catch(console.error);
            }
        }
    };

    return (
        <div
            id={`voucher-card-${claim.id}`}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 max-w-sm mx-auto"
        >
            {/* Header with Merchant Info */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-center gap-3">
                    {merchant.photoURL ? (
                        <img
                            src={merchant.photoURL}
                            alt={merchant.displayName}
                            className="w-12 h-12 rounded-full border-2 border-white object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-white bg-white/20 flex items-center justify-center">
                            <span className="text-lg font-bold">
                                {(merchant.displayName || merchant.username)[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">{merchant.displayName || merchant.username}</h3>
                        <p className="text-xs opacity-90">@{merchant.username}</p>
                    </div>
                </div>
            </div>

            {/* Voucher Details */}
            <div className="p-6 text-center">
                <div className="mb-4">
                    <h2 className="text-4xl font-black text-orange-600 mb-2">{claim.value}</h2>
                    <h3 className="text-xl font-bold text-gray-900">{claim.title}</h3>
                    {claim.code && (
                        <p className="mt-2 text-sm font-mono bg-gray-100 text-gray-700 inline-block px-3 py-1 rounded">
                            Code: {claim.code}
                        </p>
                    )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center my-4">
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                        <QRCodeSVG
                            value={claim.uniqueCode || claim.id || ''}
                            size={120}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-4">
                    {isRedeemed ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">Redeemed</span>
                        </div>
                    ) : isExpired ? (
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full">
                            <span className="text-sm font-bold">Expired</span>
                        </div>
                    ) : (
                        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                            <span className="text-sm font-bold">Active</span>
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-500 space-y-1">
                    <p>Claimed: {claim.claimedAt ? new Date(claim.claimedAt.toDate ? claim.claimedAt.toDate() : claim.claimedAt).toLocaleDateString() : 'N/A'}</p>
                    {claim.usedAt && (
                        <p>Redeemed: {new Date(claim.usedAt).toLocaleDateString()}</p>
                    )}
                    {claim.expiryDate && (
                        <p>Expires: {new Date(claim.expiryDate).toLocaleDateString()}</p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 p-4 flex gap-2">
                <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors"
                >
                    Share
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download
                </button>
            </div>

            {/* Powered by Neoays */}
            <div className="bg-gray-50 py-2 text-center border-t border-gray-100">
                <p className="text-xs text-gray-400">Powered by <span className="font-bold text-indigo-600">Neoays</span></p>
            </div>
        </div>
    );
}

export default RedeemedVoucherCard;
