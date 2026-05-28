import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { UserProfile } from '../../types';
import { TrashIcon, KeyIcon, LinkIcon } from '../../components/Icons';

const AdminPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');

    // Data State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'users' | 'vouchers'>('users');
    const [isLinked, setIsLinked] = useState(false);

    const ADMIN_UID = 'B8kCoE9Yz8g8uhIHqU2I1f447wK2';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user && user.uid === ADMIN_UID) {
                setIsLinked(true);
            } else {
                setIsLinked(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded credentials as requested
        if (adminUser === 'neoadmin' && adminPass === 'Neo@8606') {
            setIsAuthenticated(true);
            fetchData();
        } else {
            alert("Invalid Admin Credentials");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const userList: UserProfile[] = [];
            snapshot.forEach(doc => {
                userList.push(doc.data() as UserProfile);
            });
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching data", error);
            alert("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const togglePublic = async (username: string, currentStatus: boolean | undefined) => {
        try {
            // Need to find the userId for this username
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return;
            const userDoc = querySnapshot.docs[0];
            const userRef = doc(db, 'users', userDoc.id);

            await updateDoc(userRef, { isPublic: !currentStatus });
            setUsers(prev => prev.map(u => u.username === username ? { ...u, isPublic: !currentStatus } : u));
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handlePasswordReset = async (email: string) => {
        if (!email) return;
        if (!window.confirm(`Send password reset email to ${email}?`)) return;
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Reset email sent!");
        } catch (error) {
            console.error("Reset failed", error);
            alert("Failed to send reset email.");
        }
    };

    const handleResetLink = async (username: string) => {
        if (!window.confirm(`Reset profile link for @${username}? This will make their profile inaccessible until they pick a new link.`)) return;
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;

                const batch = writeBatch(db);
                // 1. Remove from usernames mapping
                batch.delete(doc(db, 'usernames', username.toLowerCase()));
                // 2. Clear from user doc
                batch.update(doc(db, 'users', userId), { username: '' });

                await batch.commit();
                alert("Profile link reset successfully.");
                fetchData();
            }
        } catch (error) {
            console.error("Reset link failed", error);
        }
    };

    const handleDeleteUser = async (username: string) => {
        if (!window.confirm(`CRITICAL: Delete user @${username} and ALL their data? This cannot be undone.`)) return;
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userId = userDoc.id;

                const batch = writeBatch(db);
                // 1. Delete user doc
                batch.delete(doc(db, 'users', userId));
                // 2. Delete username mapping
                batch.delete(doc(db, 'usernames', username.toLowerCase()));

                await batch.commit();
                alert("User deleted successfully.");
                fetchData();
            }
        } catch (error) {
            console.error("Delete user failed", error);
        }
    };

    const handleDeleteVoucher = async (username: string, voucherId: string) => {
        if (!window.confirm("Delete this voucher?")) return;
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as UserProfile;
                const updatedVouchers = (userData.vouchers || []).filter(v => v.id !== voucherId);

                await updateDoc(doc(db, 'users', userDoc.id), { vouchers: updatedVouchers });
                alert("Voucher deleted.");
                fetchData();
            }
        } catch (error) {
            console.error("Delete voucher failed", error);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Neoays Admin</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            className="w-full p-3 border rounded-lg"
                            placeholder="Admin Username"
                            value={adminUser}
                            onChange={e => setAdminUser(e.target.value)}
                        />
                        <input
                            type="password"
                            className="w-full p-3 border rounded-lg"
                            placeholder="Password"
                            value={adminPass}
                            onChange={e => setAdminPass(e.target.value)}
                        />
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                            Enter Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Neoays Admin Portal</h1>
                    {isLinked ? (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 font-black uppercase tracking-widest">
                            ✅ Database Linked
                        </span>
                    ) : (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 font-black uppercase tracking-widest">
                            ⚠️ System Unlinked
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Current Auth User</div>
                        <div className="text-xs font-mono text-slate-300">{auth.currentUser?.email || 'Not Logged In'}</div>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="text-sm bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 transition-all">Logout</button>
                </div>
            </header>

            {!isLinked && (
                <div className="bg-amber-50 border-b border-amber-200 p-3 text-center">
                    <p className="text-amber-800 text-xs font-bold">
                        ⚠️ <span className="uppercase">Configuration Mismatch:</span> You are logged into the Portal as "neoadmin", but your browser session is not at admin@neoays.com.
                        Actions may be restricted by the database.
                    </p>
                </div>
            )}

            <main className="max-w-7xl mx-auto p-6">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setViewMode('users')}
                        className={`px-4 py-2 rounded-lg font-bold ${viewMode === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                    >
                        Users Management
                    </button>
                    <button
                        onClick={() => setViewMode('vouchers')}
                        className={`px-4 py-2 rounded-lg font-bold ${viewMode === 'vouchers' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                    >
                        Offer Analytics
                    </button>
                    <button onClick={fetchData} className="ml-auto text-indigo-600 underline text-sm">Refresh Data</button>
                </div>

                {loading ? <div className="text-center p-10">Loading...</div> : (
                    <>
                        {viewMode === 'users' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Contact</th>
                                            <th className="p-4">Stats</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(user => (
                                            <tr key={user.username} className="hover:bg-slate-50">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900">@{user.username}</div>
                                                    <div className="text-xs text-slate-500">{user.businessCategory || user.categories?.[0] || 'N/A'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">{user.email}</div>
                                                    <div className="text-xs text-slate-400">{user.mobileNumber}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block">
                                                        {user.vouchers?.length || 0} Vouchers
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {user.isPublic ? (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Public</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold">Private</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => togglePublic(user.username, user.isPublic)}
                                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all ${user.isPublic ? 'text-green-600 border-green-100 bg-green-50 hover:bg-green-100' : 'text-slate-500 border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                                                            title="Toggle Public Visibility"
                                                        >
                                                            {user.isPublic ? 'Public' : 'Hidden'}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePasswordReset(user.email || '')}
                                                            className="p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all"
                                                            title="Send Password Reset"
                                                        >
                                                            <KeyIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetLink(user.username)}
                                                            className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
                                                            title="Reset Profile Link"
                                                        >
                                                            <LinkIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.username)}
                                                            className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                                                            title="Delete User"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {viewMode === 'vouchers' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.flatMap(u => (u.vouchers || []).map(v => ({ ...v, owner: u.username }))).map((v, idx) => (
                                    <div key={`${v.id}-${idx}`} className="bg-white p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-400">@{v.owner}</span>
                                                <h4 className="font-bold text-slate-900 mt-1">{v.title}</h4>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteVoucher(v.owner, v.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Voucher"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-sm text-slate-600 mt-2">Value: {v.value}</div>
                                        <div className="text-xs text-slate-400 mt-1">Code: {v.code || 'None'}</div>
                                        {v.isPublic && <div className="mt-2"><span className="text-[10px] bg-green-100 text-green-800 px-2 rounded-full">Public</span></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminPortal;
