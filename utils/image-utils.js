import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.1, // 100KB - balanced for premium clarity and speed
    maxWidthOrHeight: 800, // Balanced for HD details and performance
    useWebWorker: true,
    fileType: 'image/webp', // Superior compression for "Super Fast" goal
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original
  }
};
