import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { UserProfile, Voucher } from '../types';
import { SpinnerIcon, CheckCircleIcon } from '../components/Icons';
import neoaysLogo from '../assets/neoays-logo.svg';
import { useVoucherClaim } from '../hooks/useVoucherClaim';
import { useMobileVerification } from '../hooks/useMobileVerification';
import { Helmet } from 'react-helmet-async';
import { COUNTRY_CODES, getCountryByCode, getDefaultCountryCode } from '../constants/countryCodes';

// --- Types ---
interface OfferData {
    voucher: Voucher;
    merchant: UserProfile;
}

// --- Skeleton Component for Instant Feedback ---
const OfferSkeleton = () => (
    <div className="animate-pulse space-y-8 p-8">
        <div className="flex justify-center">
            <div className="h-24 w-24 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-6 w-48 bg-slate-200 rounded mx-auto"></div>
        <div className="h-40 w-full bg-slate-100 rounded-2xl mx-auto"></div>
        <div className="space-y-3 pt-6">
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
        </div>
    </div>
);

const OfferClaimView = () => {
    // --- State ---
    const [data, setData] = useState<OfferData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    // Auth Form State
    const [userName, setUserName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
    const [password, setPassword] = useState('');
    const [userExists, setUserExists] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Country Picker
    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
    const [countryFilter, setCountryFilter] = useState('');

    // Claim Hooks
    const { claimVoucher, error: claimError } = useVoucherClaim();
    const { checkMobileExists } = useMobileVerification();
    const [step, setStep] = useState<'form' | 'success'>('form');

    // --- High-Performance Cached Fetching ---
    useEffect(() => {
        const fetchOffer = async () => {
            let parts = window.location.hash.split('/');
            // Support clean paths: /offer/MERCHANT/VOUCHER
            if (parts.length < 4 && window.location.pathname.startsWith('/offer/')) {
                parts = window.location.pathname.split('/');
            }

            if (parts.length < 4) {
                setPageError("Invalid Link");
                setLoading(false);
                return;
            }

            const merchantIdentifier = parts[2];
            const voucherId = parts[3].split('?')[0];
            const cacheKey = `offer_${merchantIdentifier}_${voucherId}`;

            // 1. Instant Cache Load
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Check if cache is fresh (e.g., < 1 hour)
                    if (Date.now() - parsed.timestamp < 3600000) {
                        setData(parsed.data);
                        setLoading(false); // Immediate render
                    }
                } catch (e) {
                    console.warn("Cache parse failed", e);
                }
            }

            try {
                // Resolve Merchant ID and Collection
                let merchantData: UserProfile | null = null;
                let merchantDocId: string = '';

                // 1. Try username mapping first
                const usernameDoc = await getDoc(doc(db, 'usernames', merchantIdentifier.toLowerCase()));
                if (usernameDoc.exists()) {
                    const mapping = usernameDoc.data() as { userId?: string, profileId?: string, ownerId?: string };
                    const profileId = mapping.profileId;
                    const userId = mapping.userId || mapping.ownerId;

                    // Check profiles collection first if profileId exists
                    if (profileId) {
                        const profileDoc = await getDoc(doc(db, 'profiles', profileId));
                        if (profileDoc.exists()) {
                            merchantData = profileDoc.data() as UserProfile;
                            merchantDocId = profileDoc.id;
                        }
                    }

                    // Fallback to users collection
                    if (!merchantData && userId) {
                        const userDoc = await getDoc(doc(db, 'users', userId));
                        if (userDoc.exists()) {
                            merchantData = userDoc.data() as UserProfile;
                            merchantDocId = userDoc.id;
                        }
                    }
                }

                // 2. If username not found, try profiles collection directly (by document ID)
                if (!merchantData) {
                    const profileDoc = await getDoc(doc(db, 'profiles', merchantIdentifier));
                    if (profileDoc.exists()) {
                        merchantData = profileDoc.data() as UserProfile;
                        merchantDocId = profileDoc.id;
                    }
                }

                // 3. Fallback to users collection directly (by document ID)
                if (!merchantData) {
                    const userDoc = await getDoc(doc(db, 'users', merchantIdentifier));
                    if (userDoc.exists()) {
                        merchantData = userDoc.data() as UserProfile;
                        merchantDocId = userDoc.id;
                    }
                }

                if (!merchantData) {
                    throw new Error("Merchant not found. The business may have been removed or the link is invalid.");
                }

                // Attach ID
                merchantData.id = merchantDocId;

                // Find the voucher
                const foundVoucher = merchantData.vouchers?.find(v => v.id === voucherId);
                if (!foundVoucher) {
                    console.error('Voucher lookup failed:', { voucherId, availableVouchers: merchantData.vouchers?.map(v => v.id) });
                    throw new Error("Voucher not found. It may have expired or been removed.");
                }

                const newData = { voucher: foundVoucher, merchant: merchantData };

                // 3. Update State & Cache
                setData(newData);
                setLoading(false);
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: newData }));

                // 4. Smart Defaults
                if (merchantData.countryCode) setCountryCode(merchantData.countryCode);

            } catch (e: any) {
                console.error('Offer fetch error:', e);
                setPageError(e.message || "Failed to load offer");
                setLoading(false);
            }
        };

        fetchOffer();
    }, []);

    // --- Debounced User Check ---
    useEffect(() => {
        if (mobileNumber.length >= 7) {
            const timer = setTimeout(async () => {
                const fullPhone = `${countryCode}${mobileNumber}`;
                const result = await checkMobileExists(fullPhone);
                setUserExists(result.exists);
                if (result.exists && result.userName) setUserName(result.userName);
            }, 600); // 600ms debounce
            return () => clearTimeout(timer);
        }
    }, [mobileNumber, countryCode, checkMobileExists]);

    // --- Action Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;
        setIsSubmitting(true);

        const fullPhone = `${countryCode}${mobileNumber}`;
        const email = `${fullPhone.replace('+', '')}@neoays.com`;

        try {
            let user = auth.currentUser;

            if (userExists) {
                if (!password) { alert("Please enter password"); setIsSubmitting(false); return; }
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;
            } else {
                if (!userName) { alert("Please enter name"); setIsSubmitting(false); return; }
                // Password defaults to Full Phone for quick claim
                const cred = await createUserWithEmailAndPassword(auth, email, fullPhone);
                user = cred.user;

                // Determine Profile Type
                // This is where we could inject logic, but for "Quick Claim" we default to 'personal'
                const newProfile: UserProfile = {
                    username: fullPhone.replace('+', ''),
                    displayName: userName,
                    email,
                    mobileNumber: fullPhone,
                    countryCode,
                    country: getCountryByCode(countryCode).name,
                    profileType: 'personal',
                    savedVouchers: []
                };

                // Parallel Writes
                await Promise.all([
                    setDoc(doc(db, 'users', user.uid), newProfile),
                    setDoc(doc(db, 'usernames', newProfile.username.toLowerCase()), { userId: user.uid })
                ]);
            }

            // Execute Claim
            const successId = await claimVoucher(data.voucher, data.merchant.id!, data.merchant.username, user!, fullPhone, userName);

            if (successId) {
                setStep('success');
                setTimeout(() => window.location.href = `/#/app?claimId=${successId}`, 1500);
            }

        } catch (e: any) {
            console.error(e);
            alert(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Helpers ---
    const filteredCountries = useMemo(() => {
        return COUNTRY_CODES.filter(c =>
            c.name.toLowerCase().includes(countryFilter.toLowerCase()) ||
            c.code.includes(countryFilter)
        );
    }, [countryFilter]);

    if (pageError) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold p-4">
            <div className="text-center">
                <span className="text-4xl block mb-2">😕</span>
                {pageError}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/20">
            <Helmet>
                <title>{data ? `${data.voucher.value} - ${data.merchant.username}` : 'Loading Offer...'}</title>
            </Helmet>

            {/* Futuristic Background Blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
            </div>

            {/* Glass Card */}
            <div className="relative w-full max-w-[400px]">
                <div className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden transition-all duration-500">

                    {loading ? (
                        <OfferSkeleton />
                    ) : step === 'success' ? (
                        <div className="p-12 text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <CheckCircleIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Offer Claimed!</h2>
                            <p className="text-slate-500 font-medium mb-8">Redirecting to your wallet...</p>
                            
                            <button 
                                onClick={() => window.location.href = `/#/app?claimId=${new URLSearchParams(window.location.hash.split('?')[1]).get('claimId') || ''}`}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                            >
                                Go to My Wallet →
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {/* Header Image/Merchant */}
                            <div className="relative pt-10 pb-6 text-center">
                                <div className="relative mb-4 inline-block">
                                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                    <img
                                        src={data?.merchant.photoURL || `https://ui-avatars.com/api/?name=${data?.merchant.username}`}
                                        className="w-24 h-24 rounded-full border-[6px] border-white shadow-xl relative z-10 object-cover"
                                        alt="Merchant"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white z-20">
                                        VERIFIED
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">@{data?.merchant.username}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sent you a gift</p>
                            </div>

                            {/* Voucher Ticket */}
                            <div className="px-6 mb-8">
                                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-2xl p-1 relative overflow-hidden shadow-sm group hover:shadow-md transition-all">
                                    {/* Ticket Perforations */}
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#F8FAFC] rounded-full border border-slate-100 z-10"></div>
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#F8FAFC] rounded-full border border-slate-100 z-10"></div>

                                    <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-white/50 relative z-0">
                                        {data?.voucher.imageUrl && (
                                            <div className="h-24 w-full mb-3 rounded-lg overflow-hidden">
                                                <img src={data.voucher.imageUrl} className="w-full h-full object-cover transform transition-transform group-hover:scale-105" alt="Voucher" />
                                            </div>
                                        )}
                                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-1">
                                            {data?.voucher.value}
                                        </h2>
                                        <p className="text-sm font-bold text-slate-600 leading-tight">
                                            {data?.voucher.title}
                                        </p>
                                        {data?.voucher.description && (
                                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{data.voucher.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Terms & Conditions from voucher */}
                                {data?.voucher.termsAndConditions && (
                                    <div className="mt-3 px-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Terms & Conditions</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed border-l-2 border-indigo-200 pl-2">
                                            {data.voucher.termsAndConditions}
                                        </p>
                                    </div>
                                )}
                                {data?.voucher.expiryDate && (
                                    <p className="text-[10px] text-amber-600 font-bold text-center mt-2">⏳ Expires: {data.voucher.expiryDate}</p>
                                )}
                            </div>

                            {/* Minimalist Form */}
                            <div className="bg-white/80 backdrop-blur-sm border-t border-slate-100 px-8 py-8">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                                        <div className="flex gap-2">
                                            {/* Country Trigger */}
                                            <div
                                                onClick={() => setIsCountryPickerOpen(true)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <span className="text-lg mr-1">{getCountryByCode(countryCode).flag}</span>
                                                <span className="text-xs font-bold text-slate-700">{countryCode}</span>
                                            </div>

                                            {/* Phone Input */}
                                            <input
                                                type="tel"
                                                value={mobileNumber}
                                                onChange={e => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="50xxxxxxx"
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mobileNumber.length > 6 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {userExists ? (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="••••••"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Your Name</label>
                                                <input
                                                    type="text"
                                                    value={userName}
                                                    onChange={e => setUserName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                                />
                                                <p className="text-[10px] text-indigo-500 font-bold pl-1 flex items-center gap-1">
                                                    <span>🔑</span> Your password will be your mobile number ({countryCode}{mobileNumber || '...'})
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {claimError && <p className="text-xs text-red-500 font-bold text-center">{claimError}</p>}

                                    {/* Terms & Conditions */}
                                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                                        By claiming this offer, you agree to our{' '}
                                        <a href="https://neoays.com/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold underline hover:text-indigo-700">Terms & Conditions</a>{' '}and{' '}
                                        <a href="https://neoays.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-bold underline hover:text-indigo-700">Privacy Policy</a>.
                                        Your data is used solely to manage this offer.
                                    </p>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || mobileNumber.length < 7}
                                        className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting ? <SpinnerIcon className="w-4 h-4 animate-spin text-white" /> : 'Claim'}
                                    </button>
                                </form>
                            </div>

                            {/* Powered By */}
                            <div className="bg-slate-50/80 p-3 text-center">
                                <div className="inline-flex items-center gap-1 opacity-40 grayscale">
                                    <span className="text-[8px] font-black uppercase tracking-widest">Powered by</span>
                                    <img src={neoaysLogo} className="h-3 relative -top-[0.5px]" alt="Neoays" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Country Picker Modal (Portaled or Absolute) */}
                {isCountryPickerOpen && (
                    <div className="absolute inset-x-0 bottom-0 top-20 bg-white z-50 rounded-b-[32px] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                            <input
                                autoFocus
                                placeholder="Search country..."
                                className="flex-1 bg-slate-50 p-2 rounded-lg text-sm border-none outline-none font-bold"
                                value={countryFilter}
                                onChange={e => setCountryFilter(e.target.value)}
                            />
                            <button onClick={() => setIsCountryPickerOpen(false)} className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase">Close</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredCountries.map(c => (
                                <div
                                    key={c.code}
                                    onClick={() => { setCountryCode(c.code); setIsCountryPickerOpen(false); }}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <span className="text-xl">{c.flag}</span>
                                    <span className="text-xs font-bold text-slate-900">{c.name}</span>
                                    <span className="text-xs font-medium text-slate-400 ml-auto">{c.code}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Styles for Animations */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
};

export default OfferClaimView;
