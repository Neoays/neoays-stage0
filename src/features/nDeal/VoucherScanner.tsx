import React, { useState, useRef, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SpinnerIcon, CameraIcon, CheckCircleIcon, TimesCircleIcon } from '../../components/Icons';

interface VoucherScannerProps {
    businessId: string;
    onClose: () => void;
}

interface VoucherData {
    id: string;
    title: string;
    discount: string;
    claimedBy?: string;
    claimedAt?: Timestamp;
    redeemedAt?: Timestamp;
    isRedeemed?: boolean;
}

type ScanState = 'scanning' | 'validating' | 'success' | 'error';

const VoucherScanner: React.FC<VoucherScannerProps> = ({ businessId, onClose }) => {
    const [scanState, setScanState] = useState<ScanState>('scanning');
    const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [useManual, setUseManual] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            setUseManual(true);
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (!useManual) {
            startCamera();
        }
        return () => stopCamera();
    }, [useManual, startCamera, stopCamera]);

    // Validate voucher code
    const validateVoucher = async (code: string) => {
        setScanState('validating');

        try {
            // Parse voucher code format: VOUCHER_<merchantId>_<voucherId>
            const parts = code.split('_');
            if (parts.length < 3 || parts[0] !== 'VOUCHER') {
                throw new Error('Invalid voucher code format');
            }

            const voucherId = parts[parts.length - 1];
            const merchantId = parts.slice(1, -1).join('_');

            // Verify this voucher belongs to current business
            if (merchantId !== businessId) {
                throw new Error('This voucher is not for your business');
            }

            // Get voucher from Firestore
            const voucherRef = doc(db, 'vouchers', voucherId);
            const voucherSnap = await getDoc(voucherRef);

            if (!voucherSnap.exists()) {
                throw new Error('Voucher not found');
            }

            const data = voucherSnap.data() as VoucherData;
            data.id = voucherId;

            if (data.isRedeemed) {
                throw new Error('This voucher has already been redeemed');
            }

            setVoucherData(data);
            setScanState('success');
            stopCamera();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to validate voucher');
            setScanState('error');
            stopCamera();
        }
    };

    // Redeem voucher
    const redeemVoucher = async () => {
        if (!voucherData) return;

        try {
            const voucherRef = doc(db, 'vouchers', voucherData.id);
            await updateDoc(voucherRef, {
                isRedeemed: true,
                redeemedAt: Timestamp.now(),
                redeemedByBusiness: businessId
            });

            setVoucherData(prev => prev ? { ...prev, isRedeemed: true } : null);
        } catch (err) {
            console.error('Failed to redeem voucher:', err);
            setErrorMessage('Failed to mark voucher as redeemed');
        }
    };

    // Manual code submit
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            validateVoucher(manualCode.trim().toUpperCase());
        }
    };

    // Reset scanner
    const resetScanner = () => {
        setScanState('scanning');
        setVoucherData(null);
        setErrorMessage('');
        setManualCode('');
        if (!useManual) {
            startCamera();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CameraIcon className="w-6 h-6" />
                            <h2 className="text-xl font-black">Scan Voucher</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-sm text-white/70 mt-2">
                        Scan customer's voucher QR code to redeem
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Scanning State */}
                    {scanState === 'scanning' && (
                        <>
                            {!useManual ? (
                                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    {/* Scanning overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-48 h-48 border-4 border-white rounded-2xl opacity-50 animate-pulse" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-center text-white text-sm bg-black/50 rounded-xl py-2">
                                        Point camera at QR code
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleManualSubmit} className="space-y-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                            Enter Voucher Code
                                        </label>
                                        <input
                                            type="text"
                                            value={manualCode}
                                            onChange={e => setManualCode(e.target.value)}
                                            placeholder="VOUCHER_XXXXX_XXXXX"
                                            className="w-full p-4 border-2 border-gray-200 rounded-xl text-center font-mono text-lg uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!manualCode.trim()}
                                        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Validate Code
                                    </button>
                                </form>
                            )}

                            <button
                                onClick={() => setUseManual(!useManual)}
                                className="w-full py-2 text-sm text-gray-500 hover:text-emerald-600"
                            >
                                {useManual ? '📷 Use Camera Instead' : '⌨️ Enter Code Manually'}
                            </button>
                        </>
                    )}

                    {/* Validating State */}
                    {scanState === 'validating' && (
                        <div className="text-center py-12">
                            <SpinnerIcon className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Validating voucher...</p>
                        </div>
                    )}

                    {/* Success State */}
                    {scanState === 'success' && voucherData && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                            </div>

                            {!voucherData.isRedeemed ? (
                                <>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">Valid Voucher!</h3>
                                    <div className="bg-emerald-50 rounded-2xl p-6 mb-6">
                                        <p className="text-3xl font-black text-emerald-600 mb-2">
                                            {voucherData.discount}
                                        </p>
                                        <p className="text-gray-600">{voucherData.title}</p>
                                    </div>
                                    <button
                                        onClick={redeemVoucher}
                                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-lg"
                                    >
                                        ✓ Mark as Redeemed
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-emerald-600 mb-2">Redeemed! ✓</h3>
                                    <p className="text-gray-500 mb-6">Voucher has been marked as used</p>
                                    <button
                                        onClick={resetScanner}
                                        className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                                    >
                                        Scan Another
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Error State */}
                    {scanState === 'error' && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <TimesCircleIcon className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-black text-red-600 mb-2">Invalid Voucher</h3>
                            <p className="text-gray-500 mb-6">{errorMessage}</p>
                            <button
                                onClick={resetScanner}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoucherScanner;
