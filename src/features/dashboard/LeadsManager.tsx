import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SpinnerIcon, TrashIcon } from '../../components/Icons';

interface Lead {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    message: string;
    status: 'new' | 'contacted' | 'archived';
    createdAt: any;
}

const LeadsManager = ({ userId }: { userId: string }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'archived'>('all');

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db, `users/${userId}/leads`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeads: Lead[] = [];
            snapshot.forEach((doc) => {
                fetchedLeads.push({ id: doc.id, ...doc.data() } as Lead);
            });
            setLeads(fetchedLeads);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching leads:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateStatus = async (leadId: string, newStatus: Lead['status']) => {
        try {
            await updateDoc(doc(db, `users/${userId}/leads/${leadId}`), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating lead status:", error);
            alert("Failed to update status.");
        }
    };

    const deleteLead = async (leadId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/leads/${leadId}`));
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("Failed to delete lead.");
        }
    };

    const filteredLeads = leads.filter(l => filter === 'all' ? true : l.status === filter);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <SpinnerIcon className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>📥</span> Lead Capture CRM
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage inquiries sent from your public profile.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'new', 'contacted', 'archived'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filteredLeads.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">📭</div>
                    <h4 className="font-bold border-gray-800">No leads found</h4>
                    <p className="text-xs text-gray-500 mt-1">You have no {filter !== 'all' ? filter : ''} messages at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className={`p-5 rounded-xl border transition-all ${lead.status === 'new' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-gray-100'}`}>
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-gray-900 text-lg">{lead.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${lead.status === 'new' ? 'bg-green-100 text-green-700' :
                                                lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-200 text-gray-600'
                                            }`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                                        <a href={`mailto:${lead.email}`} className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1">
                                            ✉️ {lead.email}
                                        </a>
                                        {lead.mobile && (
                                            <a href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-green-600 hover:underline flex items-center gap-1">
                                                📱 {lead.mobile}
                                            </a>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.message}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-3 font-medium">
                                        Received: {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleString() : 'Just now'}
                                    </p>
                                </div>

                                <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4">
                                    {lead.status !== 'new' && (
                                        <button onClick={() => updateStatus(lead.id, 'new')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                                            Mark New
                                        </button>
                                    )}
                                    {lead.status !== 'contacted' && (
                                        <button onClick={() => updateStatus(lead.id, 'contacted')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                            Handled
                                        </button>
                                    )}
                                    {lead.status !== 'archived' && (
                                        <button onClick={() => updateStatus(lead.id, 'archived')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors">
                                            Archive
                                        </button>
                                    )}
                                    <button onClick={() => deleteLead(lead.id)} className="p-2 sm:mt-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeadsManager;
