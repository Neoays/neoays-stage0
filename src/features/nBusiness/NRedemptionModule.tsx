import React, { useState, useEffect } from 'react';
import { UserProfile, VoucherClaim } from '../../types';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { QrcodeIcon, SearchIcon, CheckCircleIcon, TimesCircleIcon, UserIcon, TicketIcon, ClockIcon, ChevronDownIcon } from '../../components/Icons';
import { ALL_COUNTRY_CODES, getCountryByCode, getDefaultCountryCode } from '../../constants/countryCodes';

interface NRedemptionModuleProps {
    businessId: string;
    businessName: string;
}

const NRedemptionModule: React.FC<NRedemptionModuleProps> = ({ businessId, businessName }) => {
    const [code, setCode] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<{ valid: boolean; message: string; claim?: VoucherClaim; claims?: VoucherClaim[]; voucher?: any } | null>(null);
    const [recentRedemptions, setRecentRedemptions] = useState<VoucherClaim[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Mobile lookup state
    const [searchMode, setSearchMode] = useState<'code' | 'mobile'>('code');
    const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
    const [mobileNumber, setMobileNumber] = useState('');
    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);

    // Staff PIN state
    const [staffPin, setStaffPin] = useState('');
    const [currentStaffPin, setCurrentStaffPin] = useState<string | null>(null);
    const [savingPin, setSavingPin] = useState(false);
    const [pinSaved, setPinSaved] = useState(false);
    const [staffAccessEnabled, setStaffAccessEnabled] = useState(false);
    const kioskUrl = `${window.location.origin}/redeem/@${businessName.toLowerCase().replace(/\s+/g, '-')}`;

    const fetchRecentRedemptions = async () => {
        setLoadingRecent(true);
        setFetchError(null);
        try {
            const col = businessId.startsWith('biz_') ? 'profiles' : 'users';
            const snap = await getDoc(doc(db, col, businessId));
            if (snap.exists()) {
                const pin = snap.data()?.staffPin;
                const enabled = snap.data()?.staffAccessEnabled;
                const bizCountry = snap.data()?.countryCode;
                setCurrentStaffPin(pin || null);
                setStaffPin(pin || '');
                setStaffAccessEnabled(!!enabled);
                if (bizCountry) setCountryCode(bizCountry);
            }
        } catch { /* ignore */ }
        
        try {
            const qIssued = query(
                collection(db, 'voucher_claims'),
                where('merchantId', '==', businessId),
                where('status', '==', 'redeemed'),
                orderBy('usedAt', 'desc'),
                limit(10)
            );

            const qRedeemedByMe = query(
                collection(db, 'voucher_claims'),
                where('redeemedBy', '==', businessId),
                where('status', '==', 'redeemed'),
                orderBy('usedAt', 'desc'),
                limit(10)
            );

            const [snapsIssued, snapsRedeemed] = await Promise.all([
                getDocs(qIssued),
                getDocs(qRedeemedByMe)
            ]);

            const claimsMap = new Map<string, VoucherClaim>();
            snapsIssued.forEach(doc => {
                claimsMap.set(doc.id, { id: doc.id, ...doc.data() } as VoucherClaim);
            });
            snapsRedeemed.forEach(doc => {
                claimsMap.set(doc.id, { id: doc.id, ...doc.data() } as VoucherClaim);
            });

            const claims = Array.from(claimsMap.values()).sort((a, b) => {
                const tA = new Date(a.usedAt || 0).getTime();
                const tB = new Date(b.usedAt || 0).getTime();
                return tB - tA;
            });

            setRecentRedemptions(claims.slice(0, 20));
        } catch (error: any) {
            console.error("Error fetching recent redemptions:", error);
            setFetchError(error?.message || "Failed to load recent redemptions.");
        } finally {
            setLoadingRecent(false);
        }
    };

    useEffect(() => {
        fetchRecentRedemptions();
    }, [businessId]);

    const handleVerify = async () => {
        const inputVal = searchMode === 'code' ? code : mobileNumber;
        if (!inputVal) return;
        setChecking(true);
        setResult(null);

        try {
            let q;
            if (searchMode === 'code') {
                const searchCode = code.toUpperCase().trim();
                q = query(
                    collection(db, 'voucher_claims'),
                    where('code', '==', searchCode),
                    where('merchantId', '==', businessId)
                );
            } else {
                const fullPhone = `${countryCode}${mobileNumber}`;
                q = query(
                    collection(db, 'voucher_claims'),
                    where('userContact', '==', fullPhone),
                    where('merchantId', '==', businessId),
                    where('status', '==', 'active')
                );
            }
            
            const snaps = await getDocs(q);

            if (snaps.empty) {
                setResult({ 
                    valid: false, 
                    message: searchMode === 'code' ? "Invalid Code. Voucher not found." : "No active vouchers found for this mobile number." 
                });
                setChecking(false);
                return;
            }

            const claims = snaps.docs.map(d => ({ id: d.id, ...d.data() } as VoucherClaim));

            if (claims.length > 1 && searchMode === 'mobile') {
                setResult({ valid: false, message: `${claims.length} active vouchers found.`, claims });
            } else {
                const claim = claims[0];
                if (claim.status === 'redeemed') {
                    setResult({ valid: false, message: "Voucher already used.", claim });
                } else if (claim.status === 'expired') {
                    setResult({ valid: false, message: "Voucher expired.", claim });
                } else if (claim.status === 'active') {
                    setResult({ valid: true, message: "Valid Voucher!", claim });
                } else {
                    setResult({ valid: false, message: `Status: ${claim.status}`, claim });
                }
            }
        } catch (error) {
            console.error("Verification error:", error);
            setResult({ valid: false, message: "System error during verification." });
        } finally {
            setChecking(false);
        }
    };

    const handleRedeem = async () => {
        if (!result?.claim?.id) return;
        if (!window.confirm("Confirm redemption of this voucher?")) return;

        setChecking(true);
        try {
            await updateDoc(doc(db, 'voucher_claims', result.claim.id), {
                status: 'redeemed',
                usedAt: new Date().toISOString(),
                redeemedBy: businessId,
                redeemedByName: businessName
            });

            setResult({ 
                ...result, 
                valid: false, 
                message: "Redemption Successful!", 
                claim: { ...result.claim, status: 'redeemed', usedAt: new Date().toISOString() } 
            });
            setCode('');
            setMobileNumber('');
            fetchRecentRedemptions();
        } catch (error) {
            console.error("Redemption error:", error);
            alert("Redemption failed. Please try again.");
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <QrcodeIcon className="w-48 h-48 rotate-12" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2">Redemption Portal</h2>
                    <p className="opacity-80">Verify and redeem customer vouchers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <SearchIcon className="w-5 h-5 text-indigo-600" /> Verify Voucher
                    </h3>

                    <div className="space-y-4">
                        <div className="flex bg-slate-50 p-1 rounded-xl mb-4 border border-slate-100">
                            <button
                                onClick={() => { setSearchMode('code'); setResult(null); }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${searchMode === 'code' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Voucher Code
                            </button>
                            <button
                                onClick={() => { setSearchMode('mobile'); setResult(null); }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${searchMode === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mobile Number
                            </button>
                        </div>

                        {searchMode === 'code' ? (
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Enter Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
                                        placeholder="NEO-X9Y2"
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={handleVerify}
                                        disabled={!code || checking}
                                        className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {checking ? "..." : "Check"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Customer Mobile</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                                        className="w-24 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1 text-slate-700 hover:bg-slate-100 transition-all font-bold"
                                    >
                                        <span>{getCountryByCode(countryCode).flag}</span>
                                        <span className="text-xs">{countryCode}</span>
                                        <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <input
                                        type="tel"
                                        value={mobileNumber}
                                        onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, '')); setResult(null); }}
                                        placeholder="50XXXXXXX"
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={handleVerify}
                                        disabled={!mobileNumber || checking}
                                        className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {checking ? "..." : "Check"}
                                    </button>
                                </div>
                                {isCountryPickerOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-2 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                                        {ALL_COUNTRY_CODES.map(c => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => { setCountryCode(c.code); setIsCountryPickerOpen(false); }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-all"
                                            >
                                                <span className="text-xl">{c.flag}</span>
                                                <span className="text-xs font-bold text-slate-700">{c.name}</span>
                                                <span className="ml-auto text-[10px] text-slate-400 font-mono">{c.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {result?.claims && (
                            <div className="space-y-2 mt-4 animate-fade-in">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Multiple active vouchers found:</p>
                                {result.claims.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setResult({ ...result, claim: c, claims: undefined, valid: true, message: 'Ready to redeem!' })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                                    >
                                        <p className="font-bold text-slate-900 group-hover:text-indigo-900">{c.voucherTitle || 'Voucher'}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{c.code}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {result && result.message && !result.claims && (
                            <div className={`p-4 rounded-xl border-2 animate-fade-in ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start gap-3">
                                    {result.valid ? (
                                        <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
                                    ) : (
                                        <TimesCircleIcon className="w-6 h-6 text-red-600 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className={`font-black text-lg ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                                            {result.message}
                                        </h4>
                                        {result.claim && (
                                            <div className="mt-2 text-xs text-slate-500 space-y-1">
                                                <p className="font-mono text-xs font-bold">{result.claim.code}</p>
                                                <p className="text-xs">User: {result.claim.userContact}</p>
                                                {result.claim.voucherTitle && <p className="text-xs italic">Voucher: {result.claim.voucherTitle}</p>}
                                                <p className="text-xs">Status: <span className="uppercase font-bold">{result.claim.status}</span></p>
                                            </div>
                                        )}
                                        {result.valid && (
                                            <button
                                                onClick={handleRedeem}
                                                disabled={checking}
                                                className="mt-4 w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all"
                                            >
                                                Confirm Redemption
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-indigo-400" /> Recent Activity
                        </h3>
                        {loadingRecent ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : fetchError ? (
                            <p className="text-xs text-red-500">{fetchError}</p>
                        ) : recentRedemptions.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No recent redemptions.</p>
                        ) : (
                            <div className="space-y-3">
                                {recentRedemptions.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">🎫</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate">{r.userName || 'Guest'}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold text-indigo-600 font-mono">{r.code}</p>
                                                <p className="text-[10px] text-slate-400 truncate tracking-tight">{r.userContact}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-indigo-600">{new Date(r.usedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">🔐 Staff Access</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Let staff redeem vouchers without a Neoays account.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    const newVal = !staffAccessEnabled;
                                    setStaffAccessEnabled(newVal);
                                    const col = businessId.startsWith('biz_') ? 'profiles' : 'users';
                                    await updateDoc(doc(db, col, businessId), { staffAccessEnabled: newVal });
                                }}
                                className={`relative w-12 h-6 rounded-full transition-colors ${staffAccessEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${staffAccessEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {staffAccessEnabled && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Staff PIN (4–6 digits)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={staffPin}
                                            onChange={e => { setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinSaved(false); }}
                                            placeholder="e.g. 1234"
                                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-lg font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!staffPin || staffPin.length < 4) return;
                                                setSavingPin(true);
                                                try {
                                                    const col = businessId.startsWith('biz_') ? 'profiles' : 'users';
                                                    await updateDoc(doc(db, col, businessId), { staffPin });
                                                    setCurrentStaffPin(staffPin);
                                                    setPinSaved(true);
                                                    setTimeout(() => setPinSaved(false), 3000);
                                                } catch { alert('Failed to save PIN.'); }
                                                setSavingPin(false);
                                            }}
                                            disabled={staffPin.length < 4 || savingPin}
                                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
                                        >
                                            {savingPin ? '...' : pinSaved ? '✓ Saved!' : 'Save PIN'}
                                        </button>
                                    </div>
                                    {currentStaffPin && (
                                        <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ PIN is set — staff can access the kiosk</p>
                                    )}
                                </div>

                                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                    <label className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-2">Staff Kiosk URL</label>
                                    <div className="flex gap-2 items-center">
                                        <p className="flex-1 text-xs font-mono text-indigo-700 bg-white p-2 rounded-lg border border-indigo-100 truncate">{kioskUrl}</p>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(kioskUrl); }}
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-indigo-400 mt-2">📱 Share this link for staff tablets.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NRedemptionModule;
