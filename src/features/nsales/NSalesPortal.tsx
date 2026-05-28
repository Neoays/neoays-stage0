import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { QRCodeCanvas } from 'qrcode.react';
import { SpinnerIcon, TrashIcon, LinkIcon, DownloadIcon, PlusIcon, SearchIcon } from '../../components/Icons';

interface QRCodeData {
    id: string;
    linkedUsername?: string;
    linkedProfileId?: string;
    location?: string; // e.g., "Table 1", "Main Hall", "Counter A"
    createdAt: Date;
    scans?: number;
}

// Production URL for QR codes
const QR_BASE_URL = 'https://www.neoays.com/qr';

const NSalesPortal: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'print' | 'generate'>('list');
    const [selectedQRs, setSelectedQRs] = useState<string[]>([]);
    const [generateCount, setGenerateCount] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');
    const [assignModal, setAssignModal] = useState<{ qrId: string; isOpen: boolean }>({ qrId: '', isOpen: false });
    const [assignUsername, setAssignUsername] = useState('');
    const [assignLocation, setAssignLocation] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    // Login
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'saleteam' && password === 'Sales@2026') {
            setIsAuthenticated(true);
            fetchQRCodes();
        } else {
            setNotification({ type: 'error', message: 'Invalid credentials' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    // Fetch all QR codes
    const fetchQRCodes = async () => {
        setLoading(true);
        try {
            const qrRef = collection(db, 'nsales_qr_codes');
            const snapshot = await getDocs(qrRef);
            const codes: QRCodeData[] = [];
            snapshot.forEach(doc => {
                codes.push({ id: doc.id, ...doc.data() } as QRCodeData);
            });
            codes.sort((a, b) => a.id.localeCompare(b.id));
            setQRCodes(codes);
        } catch (error) {
            console.error('Failed to fetch QR codes', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter QR codes based on search
    const filteredQRCodes = qrCodes.filter(qr => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            qr.id.toLowerCase().includes(query) ||
            qr.linkedUsername?.toLowerCase().includes(query) ||
            qr.location?.toLowerCase().includes(query)
        );
    });

    // Generate next ID (AA001, AA002...)
    const getNextId = (): string => {
        if (qrCodes.length === 0) return 'AA001';
        const lastId = qrCodes[qrCodes.length - 1].id;
        const prefix = lastId.substring(0, 2);
        const num = parseInt(lastId.substring(2), 10) + 1;
        if (num > 999) {
            const nextPrefix = String.fromCharCode(prefix.charCodeAt(0), prefix.charCodeAt(1) + 1);
            return `${nextPrefix}001`;
        }
        return `${prefix}${num.toString().padStart(3, '0')}`;
    };

    // Generate QR codes batch
    const handleGenerateQRs = async () => {
        if (!db) {
            setNotification({ type: 'error', message: 'Database not initialized. Please refresh.' });
            return;
        }
        setLoading(true);
        try {
            const batch: QRCodeData[] = [];
            let lastId = qrCodes.length > 0 ? qrCodes[qrCodes.length - 1].id : 'AA000';

            for (let i = 0; i < generateCount; i++) {
                const prefix = lastId.substring(0, 2);
                let num = parseInt(lastId.substring(2), 10) + 1;
                let newId = num > 999
                    ? `${String.fromCharCode(prefix.charCodeAt(0), prefix.charCodeAt(1) + 1)}001`
                    : `${prefix}${num.toString().padStart(3, '0')}`;

                const qrData = { id: newId, createdAt: new Date().toISOString(), scans: 0 };
                await setDoc(doc(db, 'nsales_qr_codes', newId), qrData);
                batch.push({ ...qrData, createdAt: new Date() });
                lastId = newId;
            }

            setQRCodes(prev => [...prev, ...batch].sort((a, b) => a.id.localeCompare(b.id)));
            setSelectedQRs(batch.map(q => q.id));
            setNotification({ type: 'success', message: `Generated ${generateCount} QR codes!` });
            setTimeout(() => setNotification(null), 3000);
            setViewMode('print');
        } catch (error: any) {
            console.error('Failed to generate QR codes', error);
            setNotification({ type: 'error', message: `Failed: ${error?.message || 'Unknown error'}` });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    // Delete QR code
    const handleDeleteQR = async (id: string) => {
        if (!window.confirm(`Delete QR code ${id}?`)) return;
        try {
            await deleteDoc(doc(db, 'nsales_qr_codes', id));
            setQRCodes(prev => prev.filter(q => q.id !== id));
            setNotification({ type: 'success', message: `QR ${id} deleted` });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Failed to delete QR', error);
        }
    };

    // Assign QR to username with location
    const handleAssignQR = async () => {
        if (!assignUsername.trim()) return;
        setLoading(true);
        try {
            const usernameRef = doc(db, 'usernames', assignUsername.toLowerCase());
            const usernameDoc = await getDoc(usernameRef);
            if (!usernameDoc.exists()) {
                setNotification({ type: 'error', message: `Username @${assignUsername} not found` });
                setLoading(false);
                return;
            }
            const profileId = usernameDoc.data()?.userId;

            await setDoc(doc(db, 'nsales_qr_codes', assignModal.qrId), {
                linkedUsername: assignUsername.toLowerCase(),
                linkedProfileId: profileId,
                location: assignLocation.trim() || null
            }, { merge: true });

            setQRCodes(prev => prev.map(q =>
                q.id === assignModal.qrId
                    ? { ...q, linkedUsername: assignUsername.toLowerCase(), linkedProfileId: profileId, location: assignLocation.trim() || undefined }
                    : q
            ));

            setNotification({ type: 'success', message: `QR ${assignModal.qrId} → @${assignUsername}${assignLocation ? ` (${assignLocation})` : ''}` });
            setTimeout(() => setNotification(null), 3000);
            setAssignModal({ qrId: '', isOpen: false });
            setAssignUsername('');
            setAssignLocation('');
        } catch (error) {
            console.error('Failed to assign QR', error);
            setNotification({ type: 'error', message: 'Failed to assign QR' });
        } finally {
            setLoading(false);
        }
    };

    // Unlink QR
    const handleUnlinkQR = async (id: string) => {
        if (!window.confirm(`Unlink QR ${id}?`)) return;
        try {
            await setDoc(doc(db, 'nsales_qr_codes', id), {
                linkedUsername: null,
                linkedProfileId: null,
                location: null
            }, { merge: true });
            setQRCodes(prev => prev.map(q =>
                q.id === id ? { ...q, linkedUsername: undefined, linkedProfileId: undefined, location: undefined } : q
            ));
            setNotification({ type: 'success', message: `QR ${id} unlinked` });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Failed to unlink QR', error);
        }
    };

    const qrUrl = (id: string) => `${QR_BASE_URL}/${id}`;

    const qrsForPrint = selectedQRs.length > 0
        ? qrCodes.filter(q => selectedQRs.includes(q.id))
        : filteredQRCodes;

    // Location presets for quick selection
    const LOCATION_PRESETS = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Main Hall', 'Counter A', 'Counter B', 'VIP Room', 'Terrace', 'Outdoor', 'Drive-thru'];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">nSales Portal</h1>
                        <p className="text-slate-500 text-sm">QR Code Generation & Management</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                placeholder="Enter password"
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-sm uppercase tracking-widest">
                            Enter Portal
                        </button>
                    </form>
                    {notification && (
                        <div className={`mt-4 p-3 rounded-xl text-sm font-bold text-center ${notification.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {notification.message}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black">nSales Portal</h1>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                            QR Manager
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">{qrCodes.length} QR codes</span>
                        <button onClick={() => setIsAuthenticated(false)} className="text-sm bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-20 right-5 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-bold animate-fade-in ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {notification.message}
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Tabs + Search */}
                <div className="flex flex-wrap gap-3 mb-6 items-center">
                    <button onClick={() => setViewMode('list')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        All QR Codes
                    </button>
                    <button onClick={() => setViewMode('generate')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'generate' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        Generate New
                    </button>
                    <button onClick={() => setViewMode('print')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'print' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                        Print Layout
                    </button>

                    {/* Search Box */}
                    <div className="ml-auto relative">
                        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search ID, username, location..."
                            className="pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button onClick={fetchQRCodes} className="px-4 py-2 text-indigo-600 text-sm font-bold hover:underline">
                        ↻ Refresh
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center py-12">
                        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                )}

                {/* List View */}
                {!loading && viewMode === 'list' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="p-3 text-left">QR ID</th>
                                    <th className="p-3 text-left">URL</th>
                                    <th className="p-3 text-left">Linked To</th>
                                    <th className="p-3 text-left">Location</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredQRCodes.map(qr => (
                                    <tr key={qr.id} className="hover:bg-slate-50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center p-1">
                                                    <QRCodeCanvas value={qrUrl(qr.id)} size={24} level="L" />
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">{qr.id}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className="text-[10px] text-slate-400 font-mono">{qrUrl(qr.id)}</span>
                                        </td>
                                        <td className="p-3">
                                            {qr.linkedUsername ? (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">@{qr.linkedUsername}</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">Not linked</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {qr.location ? (
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{qr.location}</span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {qr.linkedUsername ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase">Available</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => { setAssignModal({ qrId: qr.id, isOpen: true }); setAssignUsername(qr.linkedUsername || ''); setAssignLocation(qr.location || ''); }}
                                                    className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                                                    title="Assign"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                </button>
                                                {qr.linkedUsername && (
                                                    <button onClick={() => handleUnlinkQR(qr.id)} className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition" title="Unlink">
                                                        ✕
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteQR(qr.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Delete">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredQRCodes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
                                            {searchQuery ? 'No QR codes match your search' : 'No QR codes yet. Generate some!'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Generate View */}
                {!loading && viewMode === 'generate' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-lg mx-auto">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Generate QR Codes</h2>
                        <p className="text-slate-500 text-sm mb-6">Create QR codes for restaurant tables, counters, or any location.</p>

                        <div className="mb-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Number of QR codes</label>
                            <div className="flex gap-2 mt-2">
                                {[6, 12, 24, 48].map(n => (
                                    <button key={n} onClick={() => setGenerateCount(n)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${generateCount === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-600">
                                <strong>Next ID:</strong> <span className="font-mono text-indigo-600">{getNextId()}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                URLs will be: <span className="font-mono">neoays.com/qr/{getNextId()}</span>
                            </p>
                        </div>

                        <button onClick={handleGenerateQRs} disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                            <PlusIcon className="w-5 h-5" />
                            Generate {generateCount} QR Codes
                        </button>
                    </div>
                )}

                {/* Print View */}
                {!loading && viewMode === 'print' && (
                    <div>
                        <div className="mb-4 flex justify-between items-center print:hidden">
                            <div>
                                <h3 className="font-bold text-slate-900">Print Layout (A4)</h3>
                                <p className="text-sm text-slate-500">3cm diameter QR codes - compact for stickers</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedQRs(filteredQRCodes.map(q => q.id))} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
                                    Select All
                                </button>
                                <button onClick={() => setSelectedQRs([])} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
                                    Clear
                                </button>
                                <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                                    <DownloadIcon className="w-4 h-4" />
                                    Print
                                </button>
                            </div>
                        </div>

                        {/* QR Selection Grid */}
                        <div className="grid grid-cols-8 gap-2 mb-6 print:hidden">
                            {filteredQRCodes.map(qr => (
                                <button
                                    key={qr.id}
                                    onClick={() => setSelectedQRs(prev => prev.includes(qr.id) ? prev.filter(id => id !== qr.id) : [...prev, qr.id])}
                                    className={`p-2 rounded-lg text-xs font-mono font-bold transition-all ${selectedQRs.includes(qr.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                                >
                                    {qr.id}
                                </button>
                            ))}
                        </div>

                        {/* A4 Print Layout - 4cm diameter QR codes */}
                        <div ref={printRef} className="bg-white mx-auto shadow-lg print:shadow-none" style={{ width: '210mm', minHeight: '297mm', padding: '10mm', boxSizing: 'border-box' }}>
                            <div className="grid gap-[12mm]" style={{ gridTemplateColumns: 'repeat(4, 40mm)', justifyContent: 'center' }}>
                                {qrsForPrint.map(qr => (
                                    <div key={qr.id} className="flex flex-col items-center" style={{ width: '40mm', height: '50mm' }}>
                                        <div className="rounded-full bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden p-1" style={{ width: '40mm', height: '40mm' }}>
                                            <QRCodeCanvas value={qrUrl(qr.id)} size={130} level="M" includeMargin={true} />
                                        </div>
                                        <p className="mt-1 text-[9px] font-mono font-bold text-slate-700 text-center">{qr.id}</p>
                                        {qr.location && <p className="text-[8px] text-blue-600 font-bold text-center">{qr.location}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Assign Modal with Location */}
            {assignModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAssignModal({ qrId: '', isOpen: false })}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Assign QR to Profile</h3>
                        <p className="text-sm text-slate-500 mb-6">Link <span className="font-mono font-bold text-indigo-600">{assignModal.qrId}</span> to a profile with location</p>

                        <div className="mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-slate-400">@</span>
                                <input
                                    type="text"
                                    value={assignUsername}
                                    onChange={e => setAssignUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="username"
                                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Location / Table (Optional)</label>
                            <input
                                type="text"
                                value={assignLocation}
                                onChange={e => setAssignLocation(e.target.value)}
                                placeholder="e.g., Table 1, Main Hall, Counter A"
                                className="w-full p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                                {LOCATION_PRESETS.slice(0, 6).map(preset => (
                                    <button key={preset} onClick={() => setAssignLocation(preset)} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200">
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setAssignModal({ qrId: '', isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleAssignQR} disabled={!assignUsername.trim() || loading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                                {loading ? 'Saving...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
        </div>
    );
};

export default NSalesPortal;
