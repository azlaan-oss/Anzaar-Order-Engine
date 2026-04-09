import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.06, // ~60KB - target for Firestore document limits
    maxWidthOrHeight: 800, // Reduced from 1024 for better density
    useWebWorker: true,
    fileType: 'image/jpeg', // Ensure consistent size
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original
  }
};
