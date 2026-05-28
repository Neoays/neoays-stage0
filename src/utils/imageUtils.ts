import imageCompression from 'browser-image-compression';

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
}

export async function fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function compressImage(file: File | Blob, customOptions?: { maxSizeMB?: number, maxWidthOrHeight?: number }): Promise<string> {
    const options = {
        maxSizeMB: customOptions?.maxSizeMB || 0.07, // Aggressive 70KB limit for Firestore compatibility
        maxWidthOrHeight: customOptions?.maxWidthOrHeight || 1024,
        useWebWorker: true,
    };
    try {
        const compressedFile = await imageCompression(file as File, options);
        return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
        console.error('Compression failed:', error);
        // Fallback to original data URL if compression fails
        return await fileToDataUrl(file);
    }
}
