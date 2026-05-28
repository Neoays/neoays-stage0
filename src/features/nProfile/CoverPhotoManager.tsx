import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { UserProfile } from '../../types';
import * as Icons from '../../components/Icons';
import { getCroppedImg, compressImage, fileToDataUrl } from '../../utils/imageUtils';

const CoverPhotoManager = ({ profileData, onUpdateCover, setNotification }: { profileData: UserProfile, onUpdateCover: (imageDataUrl: string) => Promise<void>, setNotification: (notif: { type: 'error' | 'success', message: string } | null) => void }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [autoCompress] = useState(true); // Forced true for stability
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCrop = async () => {
        if (!tempImage || !croppedAreaPixels) return;

        try {
            setIsEditing(true);
            const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
            if (croppedBlob) {
                const finalDataUrl = autoCompress
                    ? await compressImage(croppedBlob)
                    : await fileToDataUrl(croppedBlob);

                setImagePreview(finalDataUrl);
                await onUpdateCover(finalDataUrl);
                setIsCropping(false);
                setTempImage(null);
                setNotification({ type: 'success', message: 'Cover photo updated successfully!' });
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Failed to process image.' });
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <div className="relative group w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 mb-2">
                <img
                    src={imagePreview?.toString() || profileData.coverURL || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80'}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Icons.CameraIcon className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Change Cover</span>
                </button>
            </div>

            {/* Cropper Modal */}
            {isCropping && tempImage && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Crop your cover photo</h3>
                            <button onClick={() => { setIsCropping(false); setTempImage(null); }} className="text-gray-400">
                                <Icons.TimesCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="relative h-80 w-full bg-slate-900">
                            <Cropper
                                image={tempImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={false}
                            />
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Auto-Compression is now mandatory for stability, hidden from UI */}

                            <button
                                onClick={handleSaveCrop}
                                disabled={isEditing}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                {isEditing ? <Icons.SpinnerIcon className="h-5 w-5 animate-spin" /> : <Icons.CheckCircleIcon className="h-5 w-5" />}
                                {isEditing ? 'Processing...' : 'Save & Upload Cover'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoverPhotoManager;
