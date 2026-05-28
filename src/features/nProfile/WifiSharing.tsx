import React, { useState } from 'react';
import { WifiIcon, CheckCircleIcon, ClipboardIcon } from '../../components/Icons';

const WifiSharing = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [encryption, setEncryption] = useState('WPA');
    const [isHidden, setIsHidden] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [nfcMessage, setNfcMessage] = useState('');

    // WIFI:S:MySSID;T:WPA;P:MyPass;;
    const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password};H:${isHidden};;`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wifiString)}`;

    const handleGenerate = () => {
        if (!ssid) return;
        setShowQRCode(true);
    };

    const handleWriteNFC = async () => {
        if (!ssid) return;

        if (!('NDEFReader' in window)) {
            setNfcStatus('error');
            setNfcMessage('NFC not supported on this device.');
            return;
        }

        setNfcStatus('scanning');
        setNfcMessage('Tap NFC tag to write Wi-Fi config...');

        try {
            // @ts-ignore
            const ndef = new window.NDEFReader();
            await ndef.write({
                records: [{ recordType: "text", data: wifiString }]
            });
            setNfcStatus('success');
            setNfcMessage('Wi-Fi config written to tag!');
            setTimeout(() => setNfcStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setNfcStatus('error');
            setNfcMessage('Failed to write. Try again.');
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full bg-white hover:bg-blue-50 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all group mb-4 animate-fade-in"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <WifiIcon className="h-5 w-5" />
                    </div>
                    <span className="text-sm">Wi-Fi Sharing Tool</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase font-black">Open</span>
            </button>
        );
    }

    return (
        <div className="w-full max-w-sm rounded-xl p-6 mb-6 shadow-2xl bg-white/95 border border-gray-200 animate-slide-up text-left relative overflow-hidden">
            <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-2"
            >
                ✕
            </button>

            <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
                <WifiIcon className="h-6 w-6 mr-3 text-blue-500 animate-pulse" /> Wi-Fi Sharing
            </h2>

            <div className="space-y-3 mb-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Network Name (SSID)</label>
                    <input
                        type="text"
                        value={ssid}
                        onChange={(e) => setSsid(e.target.value)}
                        placeholder="e.g. Neoays_Guest"
                        className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
                    <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Wi-Fi Password"
                        className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Encryption</label>
                        <select
                            value={encryption}
                            onChange={(e) => setEncryption(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                        >
                            <option value="WPA">WPA/WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">None</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-5">
                        <label className="flex items-center text-xs font-bold text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isHidden}
                                onChange={(e) => setIsHidden(e.target.checked)}
                                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                            />
                            Hidden Network
                        </label>
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 hover:shadow-lg transition-all mb-4 transform active:scale-95"
            >
                Generate QR Code
            </button>

            {showQRCode && (
                <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-200 animate-scale-in">
                    <p className="text-xs text-gray-500 mb-3 font-semibold">Scan to Join Wi-Fi</p>
                    <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
                        <img src={qrCodeUrl} alt="Wi-Fi QR Code" className="w-32 h-32 rounded-lg" />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Or write to NFC Tag</p>

                        {nfcStatus === 'error' && <p className="text-xs text-red-500 mb-2 font-bold animate-shake">{nfcMessage}</p>}
                        {nfcStatus === 'success' && <p className="text-xs text-green-500 mb-2 font-bold animate-bounce">{nfcMessage}</p>}

                        <button
                            onClick={handleWriteNFC}
                            disabled={nfcStatus === 'scanning'}
                            className={`w-full py-2 rounded-lg font-bold text-xs border-2 transition-all flex items-center justify-center
                                ${nfcStatus === 'scanning'
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            {nfcStatus === 'scanning' ? 'Scanning...' : 'Write to NFC Tag'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WifiSharing;
