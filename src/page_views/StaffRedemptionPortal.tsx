import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { VoucherClaim } from '../types';
import { ALL_COUNTRY_CODES, getCountryByCode, getDefaultCountryCode } from '../constants/countryCodes';

interface StaffRedemptionPortalProps {
    businessUsername: string;
}

type PortalState = 'loading' | 'not_found' | 'pin_entry' | 'locked' | 'active';
type VerifyState = 'idle' | 'checking' | 'valid' | 'invalid' | 'already_used' | 'expired' | 'multiple_found';
type SearchMode = 'code' | 'mobile';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Keys are per-username constants — defined outside component to avoid dependency array issues
const getKeys = (username: string) => ({
    sessionKey: `staff_session_${username}`,
    lockKey: `staff_lock_${username}`,
    attemptsKey: `staff_attempts_${username}`,
});

const StaffRedemptionPortal: React.FC<StaffRedemptionPortalProps> = ({ businessUsername }) => {
    const [portalState, setPortalState] = useState<PortalState>('loading');
    const [businessData, setBusinessData] = useState<{ id: string; name: string; logo?: string } | null>(null);

    // PIN state
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [lockoutCountdown, setLockoutCountdown] = useState('');

    // Search settings
    const [searchMode, setSearchMode] = useState<SearchMode>('code');
    const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
    const [mobileNumber, setMobileNumber] = useState('');
    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);

    // Voucher verify state
    const [voucherCode, setVoucherCode] = useState('');
    const [verifyState, setVerifyState] = useState<VerifyState>('idle');
    const [verifyResult, setVerifyResult] = useState<{ claim?: VoucherClaim; claims?: VoucherClaim[]; message: string } | null>(null);
    const [redeeming, setRedeeming] = useState(false);

    // Recent redemptions (Firestore)
    const [history, setHistory] = useState<VoucherClaim[]>([]);
    const [historySearch, setHistorySearch] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(false);

    const { sessionKey, lockKey, attemptsKey } = getKeys(businessUsername);
    const codeInputRef = useRef<HTMLInputElement>(null);

    // ─── Load business + check session on mount ───────────────────────────────
    useEffect(() => {
        const init = async () => {
            // Check existing session
            try {
                const session = sessionStorage.getItem(sessionKey);
                if (session) {
                    const { expiresAt, bizId, bizName, bizLogo } = JSON.parse(session);
                    if (Date.now() < expiresAt) {
                        setBusinessData({ id: bizId, name: bizName, logo: bizLogo });
                        setPortalState('active');
                        return;
                    } else {
                        sessionStorage.removeItem(sessionKey);
                    }
                }
            } catch { /* Bad session */ }

            // Check lockout
            try {
                const lockData = localStorage.getItem(lockKey);
                if (lockData) {
                    const { until } = JSON.parse(lockData);
                    if (Date.now() < until) {
                        setLockoutUntil(until);
                        setPortalState('locked');
                        return; // will load biz data below
                    } else {
                        localStorage.removeItem(lockKey);
                        localStorage.removeItem(attemptsKey);
                    }
                }
            } catch { /* Bad lock data */ }

            // Load attempts
            try {
                const a = localStorage.getItem(attemptsKey);
                if (a) setAttempts(parseInt(a, 10));
            } catch { /* ignore */ }

            // Look up business by username
            await loadBusinessData();
        };

        const loadBusinessData = async () => {
            try {
                const usernameSnap = await getDoc(doc(db, 'usernames', businessUsername.toLowerCase()));
                if (!usernameSnap.exists()) {
                    setPortalState('not_found');
                    return;
                }
                const mapping = usernameSnap.data() as { profileId?: string; userId?: string };
                const profileId = mapping.profileId || mapping.userId;
                const col = mapping.profileId ? 'profiles' : 'users';
                if (!profileId) { setPortalState('not_found'); return; }

                const profileSnap = await getDoc(doc(db, col, profileId));
                if (!profileSnap.exists()) { setPortalState('not_found'); return; }

                const profile = profileSnap.data();
                setBusinessData({
                    id: profileId,
                    name: profile.displayName || businessUsername,
                    logo: profile.photoURL,
                });
                if (profile.countryCode) setCountryCode(profile.countryCode);

                setPortalState(prev => prev === 'locked' ? 'locked' : 'pin_entry');
            } catch (e) {
                console.error(e);
                setPortalState('not_found');
            }
        };

        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessUsername]);

    // ─── Lockout countdown timer ───────────────────────────────────────────────
    useEffect(() => {
        if (!lockoutUntil) return;
        const interval = setInterval(() => {
            const remaining = lockoutUntil - Date.now();
            if (remaining <= 0) {
                clearInterval(interval);
                setLockoutUntil(null);
                localStorage.removeItem(lockKey);
                localStorage.removeItem(attemptsKey);
                setAttempts(0);
                setPortalState('pin_entry');
            } else {
                const mins = Math.floor(remaining / 60000);
                const secs = Math.floor((remaining % 60000) / 1000);
                setLockoutCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lockoutUntil]);

    // ─── Fetch Historical Redemptions ─────────────────────────────────────────
    useEffect(() => {
        if (portalState !== 'active' || !businessData?.id) return;
        
        setLoadingHistory(true);
        const q = query(
            collection(db, 'voucher_claims'),
            where('merchantId', '==', businessData.id),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const claims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoucherClaim));
            setHistory(claims);
            setLoadingHistory(false);
        }, (err) => {
            console.error("History fetch error:", err);
            setLoadingHistory(false);
        });

        return () => unsubscribe();
    }, [portalState, businessData?.id]);

    // ─── Session auto-expire watcher ───────────────────────────────────────────
    useEffect(() => {
        if (portalState !== 'active') return;
        const interval = setInterval(() => {
            try {
                const session = sessionStorage.getItem(sessionKey);
                if (!session || Date.now() >= JSON.parse(session).expiresAt) {
                    sessionStorage.removeItem(sessionKey);
                    setPortalState('pin_entry');
                    setVerifyState('idle');
                }
            } catch { /* ignore */ }
        }, 60000); // check every minute
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portalState]);

    // ─── PIN submit ────────────────────────────────────────────────────────────
    const handlePinSubmit = useCallback(async () => {
        if (!pin || !businessData) return;
        setPinError('');

        try {
            // Fetch stored PIN hash from Firestore
            const col = businessData.id.startsWith('biz_') ? 'profiles' : 'users';
            const staffDocSnap = await getDoc(doc(db, col, businessData.id));
            const storedPin = staffDocSnap.data()?.staffPin;

            if (!storedPin) {
                setPinError('Staff access not configured. Ask the business owner to set a PIN.');
                setPin('');
                return;
            }

            // Simple comparison (plain PIN stored — owner is responsible for security)
            if (pin === storedPin) {
                // ✅ PIN correct — create session
                const expiresAt = Date.now() + SESSION_TTL_MS;
                sessionStorage.setItem(sessionKey, JSON.stringify({
                    expiresAt,
                    bizId: businessData.id,
                    bizName: businessData.name,
                    bizLogo: businessData.logo,
                }));
                localStorage.removeItem(attemptsKey);
                setAttempts(0);
                setPortalState('active');
                setTimeout(() => codeInputRef.current?.focus(), 300);
            } else {
                // ❌ Wrong PIN
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                localStorage.setItem(attemptsKey, String(newAttempts));

                if (newAttempts >= MAX_PIN_ATTEMPTS) {
                    const until = Date.now() + LOCKOUT_DURATION_MS;
                    localStorage.setItem(lockKey, JSON.stringify({ until }));
                    setLockoutUntil(until);
                    setPortalState('locked');
                } else {
                    setPinError(`Incorrect PIN. ${MAX_PIN_ATTEMPTS - newAttempts} attempt${MAX_PIN_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
                    setPin('');
                }
            }
        } catch (e) {
            console.error(e);
            setPinError('Connection error. Please try again.');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin, businessData, attempts]);

    // ─── Voucher verify ────────────────────────────────────────────────────────
    const handleVerify = useCallback(async () => {
        const inputVal = searchMode === 'code' ? voucherCode : mobileNumber;
        if (!inputVal || !businessData) return;
        setVerifyState('checking');
        setVerifyResult(null);

        try {
            let q;
            if (searchMode === 'code') {
                const searchCode = voucherCode.toUpperCase().trim();
                q = query(
                    collection(db, 'voucher_claims'),
                    where('code', '==', searchCode),
                    where('merchantId', '==', businessData.id)
                );
            } else {
                const fullPhone = `${countryCode}${mobileNumber}`;
                q = query(
                    collection(db, 'voucher_claims'),
                    where('userContact', '==', fullPhone),
                    where('merchantId', '==', businessData.id),
                    where('status', '==', 'active')
                );
            }

            const snaps = await getDocs(q);

            if (snaps.empty) {
                setVerifyState('invalid');
                setVerifyResult({ message: searchMode === 'code' ? 'Voucher not found.' : 'No active vouchers found for this number.' });
                return;
            }

            const claims = snaps.docs.map(d => ({ id: d.id, ...d.data() } as VoucherClaim));

            if (claims.length > 1 && searchMode === 'mobile') {
                setVerifyState('multiple_found');
                setVerifyResult({ claims, message: `${claims.length} active vouchers found.` });
            } else {
                const claim = claims[0];
                if (claim.status === 'redeemed') {
                    setVerifyState('already_used');
                    setVerifyResult({ claim, message: 'Already redeemed.' });
                } else if (claim.status === 'expired') {
                    setVerifyState('expired');
                    setVerifyResult({ claim, message: 'Voucher expired.' });
                } else {
                    setVerifyState('valid');
                    setVerifyResult({ claim, message: 'Valid voucher! Ready to redeem.' });
                }
            }
        } catch (e) {
            console.error(e);
            setVerifyState('invalid');
            setVerifyResult({ message: 'Error checking voucher. Please retry.' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voucherCode, mobileNumber, countryCode, searchMode, businessData]);

    // ─── Voucher redeem ────────────────────────────────────────────────────────
    const handleRedeem = useCallback(async () => {
        if (!verifyResult?.claim?.id || !businessData) return;
        setRedeeming(true);

        try {
            await updateDoc(doc(db, 'voucher_claims', verifyResult.claim.id), {
                status: 'redeemed',
                usedAt: new Date().toISOString(),
                redeemedBy: businessData.id,
                redeemedByName: businessData.name,
                redeemedVia: 'staff_kiosk',
            });

            setVerifyState('idle');
            setVerifyResult(null);
            setVoucherCode('');
            codeInputRef.current?.focus();
        } catch (e) {
            console.error(e);
            alert('Redemption failed. Please try again.');
        } finally {
            setRedeeming(false);
        }
    }, [verifyResult, businessData]);

    const handleSignOut = () => {
        sessionStorage.removeItem(sessionKey);
        setPortalState('pin_entry');
        setVoucherCode('');
        setVerifyState('idle');
        setVerifyResult(null);
        setPin('');
    };

    // ─── LOADING ───────────────────────────────────────────────────────────────
    if (portalState === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ─── NOT FOUND ─────────────────────────────────────────────────────────────
    if (portalState === 'not_found') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="text-5xl mb-4">🔍</div>
                    <h2 className="text-2xl font-black text-white mb-2">Business Not Found</h2>
                    <p className="text-slate-400">The business <span className="text-emerald-400 font-bold">@{businessUsername}</span> does not have a staff redemption portal.</p>
                </div>
            </div>
        );
    }

    // ─── LOCKED ────────────────────────────────────────────────────────────────
    if (portalState === 'locked') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-red-950 flex items-center justify-center p-6">
                <div className="text-center max-w-sm bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-2xl font-black text-white mb-2">Access Locked</h2>
                    <p className="text-red-300 text-sm mb-4">Too many incorrect PIN attempts.</p>
                    <div className="bg-red-500/20 rounded-2xl p-4 border border-red-500/30">
                        <p className="text-xs text-red-300 uppercase tracking-widest mb-1">Unlocks in</p>
                        <p className="text-4xl font-black text-white font-mono">{lockoutCountdown || '...'}</p>
                    </div>
                    <p className="text-slate-500 text-xs mt-4">Contact the business owner if you need immediate access.</p>
                </div>
            </div>
        );
    }

    // ─── PIN ENTRY ─────────────────────────────────────────────────────────────
    if (portalState === 'pin_entry') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        {businessData?.logo ? (
                            <img src={businessData.logo} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-2xl ring-2 ring-white/20" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-3xl">🏪</div>
                        )}
                        <h1 className="text-2xl font-black text-white">{businessData?.name}</h1>
                        <p className="text-slate-400 text-sm mt-1">Staff Redemption Portal</p>
                        <p className="text-emerald-400/70 text-xs mt-1 font-mono">@{businessUsername}</p>
                    </div>

                    {/* PIN Card */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                        <p className="text-sm font-bold text-slate-300 text-center mb-6 uppercase tracking-widest">Enter Staff PIN</p>

                        {/* PIN dots display */}
                        <div className="flex justify-center gap-4 mb-6">
                            {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, pin.length || 4)).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? 'bg-emerald-400 border-emerald-400 scale-110' : 'border-slate-500 bg-transparent'}`}
                                />
                            ))}
                        </div>

                        {/* Hidden input */}
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={pin}
                            onChange={e => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setPin(v);
                                setPinError('');
                            }}
                            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                            placeholder="••••"
                            autoFocus
                        />

                        {pinError && (
                            <p className="text-red-400 text-xs text-center mb-4 font-bold">{pinError}</p>
                        )}

                        <button
                            onClick={handlePinSubmit}
                            disabled={pin.length < 4}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-98 shadow-lg shadow-emerald-500/20"
                        >
                            Unlock Portal
                        </button>

                        {attempts > 0 && (
                            <p className="text-slate-500 text-xs text-center mt-4">
                                {MAX_PIN_ATTEMPTS - attempts} attempt{MAX_PIN_ATTEMPTS - attempts === 1 ? '' : 's'} remaining before lockout
                            </p>
                        )}
                    </div>

                    <p className="text-center text-slate-600 text-xs mt-6">
                        Powered by <span className="text-slate-400 font-bold">Neoays</span>
                    </p>
                </div>
            </div>
        );
    }

    // ─── ACTIVE KIOSK ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
            {/* Top bar */}
            <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {businessData?.logo ? (
                        <img src={businessData.logo} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">🏪</div>
                    )}
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">{businessData?.name}</p>
                        <p className="text-emerald-400 text-[10px] font-mono">Staff Portal</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-xs font-bold transition-all"
                >
                    Sign Out
                </button>
            </div>

            <div className="max-w-lg mx-auto p-4 pt-6 space-y-4">
                {/* Voucher Entry Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
                    <h2 className="text-white font-black text-lg mb-1">Verify Voucher</h2>
                    
                    {/* Search Mode Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
                        <button
                            onClick={() => { setSearchMode('code'); setVerifyState('idle'); setVerifyResult(null); }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${searchMode === 'code' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Voucher Code
                        </button>
                        <button
                            onClick={() => { setSearchMode('mobile'); setVerifyState('idle'); setVerifyResult(null); }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${searchMode === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Mobile Number
                        </button>
                    </div>

                    {searchMode === 'code' ? (
                        <div className="flex gap-2 mb-2">
                            <input
                                ref={codeInputRef}
                                type="text"
                                value={voucherCode}
                                onChange={e => {
                                    setVoucherCode(e.target.value.toUpperCase());
                                    setVerifyState('idle');
                                    setVerifyResult(null);
                                }}
                                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                                placeholder="e.g. NEO-X9Y2Z"
                                className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white font-mono text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 uppercase"
                                autoComplete="off"
                            />
                            <button
                                onClick={handleVerify}
                                disabled={!voucherCode || verifyState === 'checking'}
                                className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all text-sm"
                            >
                                {verifyState === 'checking' ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : 'Check'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setIsCountryPickerOpen(true)}
                                    className="w-24 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center gap-1 text-white hover:bg-white/20 transition-all"
                                >
                                    <span className="text-lg">{getCountryByCode(countryCode).flag}</span>
                                    <span className="text-xs font-bold">{countryCode}</span>
                                </button>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={e => {
                                        setMobileNumber(e.target.value.replace(/\D/g, ''));
                                        setVerifyState('idle');
                                        setVerifyResult(null);
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                                    placeholder="50XXXXXXX"
                                    className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                                    autoComplete="off"
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={!mobileNumber || verifyState === 'checking'}
                                    className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all text-sm"
                                >
                                    {verifyState === 'checking' ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : 'Check'}
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest text-center">
                        {searchMode === 'code' ? 'Enter code from customer' : 'Search by customer phone number'}
                    </p>
                </div>

                {/* Multiple Found Section */}
                {verifyState === 'multiple_found' && verifyResult?.claims && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-indigo-500/30 shadow-xl animate-fade-in">
                        <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4">Select Voucher to Redeem</h3>
                        <div className="space-y-3">
                            {verifyResult.claims.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setVerifyResult({ claim: c, message: 'Ready to redeem.' });
                                        setVerifyState('valid');
                                    }}
                                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all active:scale-98 group"
                                >
                                    <p className="text-white font-black text-sm">{c.voucherTitle || 'Generic Voucher'}</p>
                                    <p className="text-indigo-400 text-xs font-mono mt-1">{c.code}</p>
                                    <p className="text-slate-500 text-[10px] mt-1">Status: {c.status}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Result */}
                {verifyState !== 'idle' && verifyState !== 'checking' && verifyResult && (
                    <div className={`rounded-2xl p-4 border-2 transition-all ${
                        verifyState === 'valid' ? 'bg-emerald-500/10 border-emerald-500/40' :
                        verifyState === 'already_used' ? 'bg-amber-500/10 border-amber-500/40' :
                        'bg-red-500/10 border-red-500/40'
                    }`}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">
                                    {verifyState === 'valid' ? '✅' : verifyState === 'already_used' ? '⚠️' : '❌'}
                                </span>
                                <div className="flex-1">
                                    <p className={`font-black text-base ${
                                        verifyState === 'valid' ? 'text-emerald-300' :
                                        verifyState === 'already_used' ? 'text-amber-300' : 'text-red-300'
                                    }`}>
                                        {verifyResult.message}
                                    </p>
                                    {verifyResult.claim && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-slate-300 text-sm font-mono">{verifyResult.claim.code}</p>
                                            {verifyResult.claim.userContact && (
                                                <p className="text-slate-400 text-xs">Customer: {verifyResult.claim.userContact}</p>
                                            )}
                                            {verifyState === 'already_used' && verifyResult.claim.usedAt && (
                                                <p className="text-amber-400/70 text-xs">
                                                    Used: {new Date(verifyResult.claim.usedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {verifyState === 'valid' && (
                                        <button
                                            onClick={handleRedeem}
                                            disabled={redeeming}
                                            className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black uppercase tracking-wide text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 transition-all active:scale-98"
                                        >
                                            {redeeming ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : '✓ Confirm Redemption'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                
                {/* Redemption History */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-white font-black text-lg">Redemption History</h3>
                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Showing last 50 redemptions</p>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or number..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full sm:w-64 p-2.5 pl-9 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-6 px-6">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/5">
                                <tr>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Mobile</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingHistory && history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-500 text-xs animate-pulse">Loading history...</td>
                                    </tr>
                                ) : history.filter(r => 
                                    (r.userName || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                                    (r.userContact || '').includes(historySearch) ||
                                    (r.code || '').toLowerCase().includes(historySearch.toLowerCase())
                                ).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-500 text-xs italic">No matching records found.</td>
                                    </tr>
                                ) : (
                                    history.filter(r => 
                                        (r.userName || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                                        (r.userContact || '').includes(historySearch) ||
                                        (r.code || '').toLowerCase().includes(historySearch.toLowerCase())
                                    ).map((r) => (
                                        <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4">
                                                <p className="text-white font-bold text-sm tracking-tight">{r.userName || 'Guest'}</p>
                                                <p className="text-slate-500 text-[10px] uppercase sm:hidden">{r.userContact}</p>
                                            </td>
                                            <td className="py-4 hidden sm:table-cell">
                                                <p className="text-slate-300 text-xs font-mono">{r.userContact}</p>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-emerald-400 font-mono text-xs font-bold">{r.code}</p>
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex px-2 py-1 text-[9px] font-black uppercase rounded-full ${r.status === 'redeemed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {r.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <p className="text-white text-xs font-bold">
                                                    {r.usedAt ? new Date(r.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...')}
                                                </p>
                                                <p className="text-slate-500 text-[9px] uppercase">
                                                    {r.usedAt ? new Date(r.usedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) : (r.timestamp?.seconds ? new Date(r.timestamp.seconds * 1000).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) : '')}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Help */}
                <div className="p-4 text-center">
                    <p className="text-slate-600 text-xs">
                        Session expires in 2 hours • <button onClick={handleSignOut} className="text-slate-500 hover:text-slate-300 underline">Sign out</button>
                    </p>
                </div>
            </div>

            {isCountryPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCountryPickerOpen(false)} />
                    <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest">Select Country</h3>
                            <button onClick={() => setIsCountryPickerOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 max-h-[60vh]">
                            {ALL_COUNTRY_CODES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => { setCountryCode(c.code); setIsCountryPickerOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all"
                                >
                                    <span className="text-2xl">{c.flag}</span>
                                    <div className="text-left">
                                        <p className="text-white text-xs font-bold">{c.name}</p>
                                        <p className="text-slate-500 text-[10px] font-mono">{c.code}</p>
                                    </div>
                                    <span className="ml-auto text-indigo-500 text-xs font-black">{countryCode === c.code ? '✓' : ''}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffRedemptionPortal;
