import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { UserProfile } from '../../types';
import * as Icons from '../../components/Icons';
import { getCroppedImg, compressImage, fileToDataUrl } from '../../utils/imageUtils';

const ProfilePhotoManager = ({ profileData, onUpdatePhoto, setNotification }: { profileData: UserProfile, onUpdatePhoto: (imageDataUrl: string) => Promise<void>, setNotification: (notif: { type: 'error' | 'success', message: string } | null) => void }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [autoCompress] = useState(true); // Forced true for stability
    const [customPrompt, setCustomPrompt] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // NOTE: YOU MUST REPLACE THIS EMPTY STRING WITH YOUR ACTUAL GEMINI API KEY
    const apiKey = "";

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
                await onUpdatePhoto(finalDataUrl);
                setIsCropping(false);
                setTempImage(null);
                setNotification({ type: 'success', message: 'Profile photo updated successfully!' });
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Failed to process image.' });
        } finally {
            setIsEditing(false);
        }
    };

    const handleGeminiEdit = async () => {
        if (!imagePreview && !profileData.photoURL) {
            setNotification({ type: 'error', message: 'Please select an image first.' });
            return;
        }

        const currentImage = (imagePreview as string) || profileData.photoURL;
        if (!currentImage) return;

        setIsEditing(true);
        setNotification({ type: 'success', message: 'Gemini is enhancing your photo... this may take a moment.' });

        // Extract base64 if it's a data URL, otherwise we can't easily send it to Gemini without fetching it first
        // For simplicity, we assume it's a data URL from the file reader or we skip if it's a remote URL for now
        let base64Data = "";
        if (currentImage.startsWith('data:image')) {
            base64Data = currentImage.split(',')[1];
        } else {
            setNotification({ type: 'error', message: 'AI editing is only available for newly uploaded photos.' });
            setIsEditing(false);
            return;
        }

        if (!apiKey) {
            setNotification({ type: 'error', message: 'Gemini API Key is missing. Feature disabled.' });
            setIsEditing(false);
            return;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const defaultPrompt = "Generate a professional profile picture suitable for a digital identity platform. The person should be clearly visible with a clean, transparent background. Output the result in a common image format.";
        const promptToSend = customPrompt.trim() !== "" ? customPrompt : defaultPrompt;

        const payload = {
            contents: [{
                parts: [
                    { text: promptToSend },
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                ]
            }],
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed with status: ${response.status}. Response: ${errorText}`);
            }

            const result = await response.json();
            const editedBase64Data = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

            if (editedBase64Data) {
                const finalImage = `data:image/png;base64,${editedBase64Data}`;
                setImagePreview(finalImage);
                await onUpdatePhoto(finalImage);
            } else {
                throw new Error("No image data returned from Gemini. The model may have refused the request.");
            }
        } catch (error: any) {
            console.error("Gemini editing failed:", error);
            setNotification({ type: 'error', message: `Image enhancement failed: ${error.message}` });
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <div className="relative group">
                <img
                    src={imagePreview?.toString() || profileData.photoURL || `https://ui-avatars.com/api/?name=${profileData.username}&size=128&background=random`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover bg-gray-100 border-4 border-white shadow-sm"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-full h-full bg-black bg-opacity-40 flex items-center justify-center rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <Icons.CameraIcon className="h-8 w-8" />
                </button>
            </div>

            {/* Optional AI Edit Button - Only show if we have an image */}
            {(imagePreview || profileData.photoURL) && (
                <button
                    onClick={() => setIsEditing(!isEditing ? true : false)} // Toggle simple view for now
                    className="mt-3 text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
                >
                    <Icons.SparklesIcon className="h-3 w-3 mr-1" />
                    {isEditing ? 'Enhancing...' : 'AI Enhance'}
                </button>
            )}

            {/* Hidden for now to keep UI clean, can be expanded */}
            {isEditing && !isCropping && (
                <div className="mt-2 w-full max-w-xs hidden">
                    {/* AI controls would go here */}
                </div>
            )}

            {/* Cropper Modal */}
            {isCropping && tempImage && (
                <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Crop your photo</h3>
                            <button onClick={() => { setIsCropping(false); setTempImage(null); }} className="text-gray-400">
                                <Icons.TimesCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="relative h-80 w-full bg-slate-900">
                            <Cropper
                                image={tempImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
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
                                {isEditing ? 'Processing...' : 'Save & Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoManager;
