import React, { useState } from 'react';
import { UserProfile } from '../../types';

import ProfileEditor from './ProfileEditor';
import { TimesCircleIcon, UserIcon, CameraIcon, PlayIcon, ShoppingBagIcon } from '../../components/Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileData: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    onUpdatePhoto: (imageDataUrl: string) => Promise<void>;
    setNotification: (notif: { type: 'error' | 'success', message: string } | null) => void;
    onSignOut: () => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    profileData,
    onUpdateProfile,
    onUpdatePhoto,
    setNotification,
    onSignOut
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">

                    {/* Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Account Settings</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Manage your login details and basic info</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 p-2"
                        >
                            <TimesCircleIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[70vh] overflow-y-auto px-6 py-8">
                        <div className="animate-fade-in">
                            <ProfileEditor
                                profileData={profileData}
                                onUpdateProfile={onUpdateProfile}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                            onClick={onSignOut}
                            className="text-red-500 text-xs font-bold hover:text-red-600"
                        >
                            Sign Out
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-100"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
