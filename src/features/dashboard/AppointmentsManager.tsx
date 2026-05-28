import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SpinnerIcon, TrashIcon } from '../../components/Icons';

interface Appointment {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    date: string;
    time: string;
    notes?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: any;
}

const AppointmentsManager = ({ userId }: { userId: string }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db, `users/${userId}/appointments`),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAppointments: Appointment[] = [];
            snapshot.forEach((doc) => {
                fetchedAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
            });
            setAppointments(fetchedAppointments);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateStatus = async (apptId: string, newStatus: Appointment['status']) => {
        try {
            await updateDoc(doc(db, `users/${userId}/appointments/${apptId}`), {
                status: newStatus
            });
        } catch (error) {
            console.error("Error updating appointment status:", error);
            alert("Failed to update status.");
        }
    };

    const deleteAppointment = async (apptId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this appointment request?")) return;
        try {
            await deleteDoc(doc(db, `users/${userId}/appointments/${apptId}`));
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Failed to delete appointment.");
        }
    };

    const filteredAppointments = appointments.filter(a => filter === 'all' ? true : a.status === filter);

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
                        <span>📅</span> Appointments Manager
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage meeting requests from your public profile.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                    {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 text-xs font-bold capitalize rounded-md transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filteredAppointments.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">🗓️</div>
                    <h4 className="font-bold text-gray-800">No appointments found</h4>
                    <p className="text-xs text-gray-500 mt-1">You have no {filter !== 'all' ? filter : ''} appointments at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map(appt => (
                        <div key={appt.id} className={`p-5 rounded-xl border transition-all ${appt.status === 'pending' ? 'bg-amber-50/30 border-amber-100' : 'bg-white border-gray-100'}`}>
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-bold text-gray-900 text-lg">{appt.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                appt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mb-4 bg-white/50 p-2 rounded-lg border border-gray-50 inline-flex">
                                        <div className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                                            <span>📅</span>
                                            {new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        <div className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                                            <span>🕒</span>
                                            {appt.time}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                                        <a href={`mailto:${appt.email}`} className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1">
                                            ✉️ {appt.email}
                                        </a>
                                        {appt.mobile && (
                                            <a href={`https://wa.me/${appt.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-green-600 hover:underline flex items-center gap-1">
                                                📱 {appt.mobile}
                                            </a>
                                        )}
                                    </div>

                                    {appt.notes && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"><span className="font-bold text-xs text-gray-400 block mb-1">NOTES:</span>{appt.notes}</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-3 font-medium">
                                        Requested: {appt.createdAt?.toDate ? appt.createdAt.toDate().toLocaleString() : 'Just now'}
                                    </p>
                                </div>

                                <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4">
                                    {appt.status !== 'confirmed' && (
                                        <button onClick={() => updateStatus(appt.id, 'confirmed')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                            Confirm
                                        </button>
                                    )}
                                    {appt.status !== 'pending' && (
                                        <button onClick={() => updateStatus(appt.id, 'pending')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                                            Set Pending
                                        </button>
                                    )}
                                    {appt.status !== 'cancelled' && (
                                        <button onClick={() => updateStatus(appt.id, 'cancelled')} className="flex-1 sm:flex-none py-2 px-4 text-[10px] font-bold uppercase rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors">
                                            Cancel
                                        </button>
                                    )}
                                    <button onClick={() => deleteAppointment(appt.id)} className="p-2 sm:mt-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center">
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

export default AppointmentsManager;
