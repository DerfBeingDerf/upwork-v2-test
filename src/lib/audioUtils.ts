/**
 * Audio utility functions for extracting metadata from audio files
 */

export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
    };
    
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      }
    };
    
    const onCanPlayThrough = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      }
    };
    
    const onError = () => {
      cleanup();
      reject(new Error('Failed to load audio metadata'));
    };
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    
    // Set preload to metadata to get duration without downloading entire file
    audio.preload = 'metadata';
    audio.src = objectUrl;
    
    // Fallback timeout
    setTimeout(() => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      } else {
        cleanup();
        reject(new Error('Timeout loading audio metadata'));
      }
    }, 10000); // 10 second timeout
  });
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const getAudioMetadata = async (file: File): Promise<{
  duration: number;
  title: string;
  artist?: string;
}> => {
  try {
    const duration = await getAudioDuration(file);
    
    // Extract title from filename (remove extension)
    const title = file.name.split('.').slice(0, -1).join('.');
    
    return {
      duration,
      title,
      // We could extend this to extract ID3 tags in the future
      artist: undefined
    };
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    
    // Fallback to filename-based metadata
    const title = file.name.split('.').slice(0, -1).join('.');
    return {
      duration: 0, // Will be marked as unknown duration
      title,
      artist: undefined
    };
  }
};

// Helper function to get duration from URL (for existing files)
export const getAudioDurationFromUrl = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
    };
    
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      }
    };
    
    const onCanPlayThrough = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      }
    };
    
    const onError = () => {
      cleanup();
      reject(new Error('Failed to load audio from URL'));
    };
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    
    // Set preload to metadata
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous'; // For CORS
    audio.src = url;
    
    // Fallback timeout
    setTimeout(() => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      } else {
        cleanup();
        reject(new Error('Timeout loading audio from URL'));
      }
    }, 15000); // 15 second timeout for network requests
  });
};