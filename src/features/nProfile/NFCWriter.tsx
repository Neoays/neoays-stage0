import React, { useState } from 'react';
import { SparklesIcon } from '../../components/Icons';

const NFCWriter = ({ url }: { url: string }) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleWriteToNFC = async () => {
        if (!('NDEFReader' in window)) {
            setStatus('error');
            setMessage('NFC is not supported on this device/browser. Try Chrome on Android.');
            return;
        }

        setStatus('scanning');
        setMessage('Tap your NFC tag to write...');

        try {
            // @ts-ignore - NDEFReader is not yet in standard TypeScript types
            const ndef = new window.NDEFReader();
            await ndef.write({
                records: [{ recordType: "url", data: url }]
            });
            setStatus('success');
            setMessage('Success! Link written to NFC tag.');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Failed to write. Try again.');
        }
    };

    return (
        <div className="w-full max-w-sm rounded-xl p-6 mb-6 shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white animate-slide-up text-left">
            <h2 className="text-xl font-extrabold mb-4 border-b border-white/20 pb-2 flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Write to NFC
            </h2>

            <p className="text-blue-100 text-sm mb-4">
                Program your business card or tag instantly. Just tap "Start" and hold your phone near the tag.
            </p>

            {status === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-sm">
                    {message}
                </div>
            )}

            {status === 'success' && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4 text-sm font-bold">
                    {message}
                </div>
            )}

            <button
                onClick={handleWriteToNFC}
                disabled={status === 'scanning'}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center
                    ${status === 'scanning'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-white text-indigo-600 hover:bg-blue-50 hover:scale-[1.02]'
                    }`}
            >
                {status === 'scanning' ? (
                    <>
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75 mr-2"></span>
                        Scanning...
                    </>
                ) : (
                    <>Start NFC Write</>
                )}
            </button>
        </div>
    );
};

export default NFCWriter;
