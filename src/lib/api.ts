import { supabase } from './supabase';
import { AudioFile, Collection, CollectionTrack } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getAudioMetadata, getAudioDurationFromUrl } from './audioUtils';
import { checkCollectionEmbedAccess } from './subscriptionApi';

// Audio file operations
export const uploadAudioFile = async (
  file: File,
  title: string,
  userId: string,
  artist?: string,
  description?: string
): Promise<AudioFile> => {
  // Extract actual duration and metadata from the audio file
  const metadata = await getAudioMetadata(file);
  
  // Use extracted duration, fallback to provided title if metadata extraction failed
  const actualDuration = metadata.duration;
  const actualTitle = title || metadata.title;
  
  // Generate a unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/audio/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('audio-files')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(filePath);

  // Create a record in the database with actual duration
  const { error: dbError, data: audioFile } = await supabase
    .from('audio_files')
    .insert({
      user_id: userId,
      name: file.name,
      storage_path: filePath,
      type: file.type,
      size: file.size,
      title: actualTitle,
      artist: artist || metadata.artist,
      description,
      file_url: publicUrl,
      duration: actualDuration,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Error creating audio file record: ${dbError.message}`);
  }

  return audioFile;
};

export const getUserAudioFiles = async (userId: string): Promise<AudioFile[]> => {
  const { data, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching audio files: ${error.message}`);
  }

  return data || [];
};

export const getAudioFile = async (audioId: string): Promise<AudioFile> => {
  const { data, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('id', audioId)
    .single();

  if (error) {
    throw new Error(`Error fetching audio file: ${error.message}`);
  }

  return data;
};

// Function to update duration for existing audio files
export const updateAudioFileDuration = async (audioId: string, duration: number): Promise<void> => {
  const { error } = await supabase
    .from('audio_files')
    .update({ duration })
    .eq('id', audioId);

  if (error) {
    throw new Error(`Error updating audio file duration: ${error.message}`);
  }
};

// Function to refresh durations for files with placeholder values
export const refreshAudioFileDurations = async (audioFiles: AudioFile[]): Promise<AudioFile[]> => {
  const updatedFiles = [...audioFiles];
  
  for (let i = 0; i < updatedFiles.length; i++) {
    const file = updatedFiles[i];
    
    // Check if this file has a placeholder duration (180 seconds) or invalid duration
    if (file.duration === 180 || file.duration === 0 || !file.duration) {
      try {
        const actualDuration = await getAudioDurationFromUrl(file.file_url);
        
        // Update in database
        await updateAudioFileDuration(file.id, actualDuration);
        
        // Update local copy
        updatedFiles[i] = { ...file, duration: actualDuration };
      } catch (error) {
        console.warn(`Failed to update duration for ${file.title}:`, error);
        // Keep the original duration if we can't fetch it
      }
    }
  }
  
  return updatedFiles;
};

// Cover image operations
export const uploadCollectionCoverImage = async (
  file: File,
  collectionId: string,
  userId: string
): Promise<string> => {
  // Generate a unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `cover_${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/covers/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('audio-files')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading cover image: ${uploadError.message}`);
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(filePath);

  // Update the collection with the new cover URL
  const { error: updateError } = await supabase
    .from('collections')
    .update({ cover_url: publicUrl })
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (updateError) {
    // If database update fails, try to clean up the uploaded file
    await supabase.storage
      .from('audio-files')
      .remove([filePath]);
    
    throw new Error(`Error updating collection cover: ${updateError.message}`);
  }

  return publicUrl;
};

export const removeCollectionCoverImage = async (
  collectionId: string,
  userId: string
): Promise<void> => {
  // Get the current collection to find the cover URL
  const { data: collection, error: fetchError } = await supabase
    .from('collections')
    .select('cover_url')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching collection: ${fetchError.message}`);
  }

  // Update the collection to remove the cover URL
  const { error: updateError } = await supabase
    .from('collections')
    .update({ cover_url: null })
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Error removing collection cover: ${updateError.message}`);
  }

  // Try to delete the file from storage if it exists
  if (collection.cover_url) {
    try {
      // Extract the file path from the URL
      const url = new URL(collection.cover_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // Get the last 3 parts: userId/covers/filename
      
      await supabase.storage
        .from('audio-files')
        .remove([filePath]);
    } catch (error) {
      // Don't throw error if file deletion fails, as the database update succeeded
      console.warn('Failed to delete cover image file from storage:', error);
    }
  }
};

// Collection operations
export const createCollection = async (
  title: string,
  userId: string,
  description?: string,
  isPublic: boolean = true
): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      title,
      description,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating collection: ${error.message}`);
  }

  return data;
};

export const getUserCollections = async (userId: string): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching collections: ${error.message}`);
  }

  return data || [];
};

export const getCollection = async (collectionId: string): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single();

  if (error) {
    throw new Error(`Error fetching collection: ${error.message}`);
  }

  return data;
};

export const updateCollection = async (
  collectionId: string,
  updates: Partial<Pick<Collection, 'title' | 'description' | 'is_public'>>
): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating collection: ${error.message}`);
  }

  return data;
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  // First delete all tracks in the collection (cascade should handle this, but being explicit)
  const { error: tracksError } = await supabase
    .from('collection_tracks')
    .delete()
    .eq('collection_id', collectionId);

  if (tracksError) {
    throw new Error(`Error deleting collection tracks: ${tracksError.message}`);
  }

  // Then delete the collection itself
  const { error: collectionError } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (collectionError) {
    throw new Error(`Error deleting collection: ${collectionError.message}`);
  }
};

export const getCollectionTracks = async (collectionId: string): Promise<CollectionTrack[]> => {
  const { data, error } = await supabase
    .from('collection_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Error fetching collection tracks: ${error.message}`);
  }

  // Refresh durations for any tracks with placeholder values
  const tracks = data || [];
  const audioFiles = tracks.map(track => track.audio_file);
  const updatedAudioFiles = await refreshAudioFileDurations(audioFiles);
  
  // Map the updated audio files back to tracks
  const updatedTracks = tracks.map((track, index) => ({
    ...track,
    audio_file: updatedAudioFiles[index]
  }));

  return updatedTracks;
};

export const addTrackToCollection = async (
  collectionId: string,
  audioId: string,
  position: number
): Promise<void> => {
  const { error } = await supabase
    .from('collection_tracks')
    .insert({
      collection_id: collectionId,
      audio_id: audioId,
      position,
    });

  if (error) {
    throw new Error(`Error adding track to collection: ${error.message}`);
  }
};

export const removeTrackFromCollection = async (
  collectionTrackId: string
): Promise<void> => {
  const { error } = await supabase
    .from('collection_tracks')
    .delete()
    .eq('id', collectionTrackId);

  if (error) {
    throw new Error(`Error removing track from collection: ${error.message}`);
  }
};

export const moveTrackToCollection = async (
  trackId: string,
  fromCollectionId: string,
  toCollectionId: string
): Promise<void> => {
  // Get the audio_id from the current track
  const { data: currentTrack, error: fetchError } = await supabase
    .from('collection_tracks')
    .select('audio_id')
    .eq('id', trackId)
    .eq('collection_id', fromCollectionId)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching track: ${fetchError.message}`);
  }

  // Get the next position in the target collection
  const { data: targetTracks, error: positionError } = await supabase
    .from('collection_tracks')
    .select('position')
    .eq('collection_id', toCollectionId)
    .order('position', { ascending: false })
    .limit(1);

  if (positionError) {
    throw new Error(`Error getting target collection position: ${positionError.message}`);
  }

  const nextPosition = targetTracks.length > 0 ? targetTracks[0].position + 1 : 0;

  // Check if the track already exists in the target collection
  const { data: existingTrack } = await supabase
    .from('collection_tracks')
    .select('id')
    .eq('collection_id', toCollectionId)
    .eq('audio_id', currentTrack.audio_id)
    .single();

  if (existingTrack) {
    throw new Error('This track is already in the target collection');
  }

  // Remove from source collection
  const { error: removeError } = await supabase
    .from('collection_tracks')
    .delete()
    .eq('id', trackId);

  if (removeError) {
    throw new Error(`Error removing track from source collection: ${removeError.message}`);
  }

  // Add to target collection
  const { error: addError } = await supabase
    .from('collection_tracks')
    .insert({
      collection_id: toCollectionId,
      audio_id: currentTrack.audio_id,
      position: nextPosition,
    });

  if (addError) {
    // If adding fails, try to restore the track to the original collection
    await supabase
      .from('collection_tracks')
      .insert({
        collection_id: fromCollectionId,
        audio_id: currentTrack.audio_id,
        position: 0, // Add at the beginning as a fallback
      });
    
    throw new Error(`Error adding track to target collection: ${addError.message}`);
  }
};

export const updateCollectionTrackPositions = async (
  tracks: { id: string; position: number }[]
): Promise<void> => {
  // Using Promise.all to update all tracks concurrently
  await Promise.all(
    tracks.map(({ id, position }) => 
      supabase
        .from('collection_tracks')
        .update({ position })
        .eq('id', id)
    )
  );
};

export const getPublicCollection = async (collectionId: string): Promise<{
  collection: Collection;
  tracks: CollectionTrack[];
  hasEmbedAccess: boolean;
}> => {
  // First get the collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('is_public', true)
    .single();

  if (collectionError) {
    throw new Error(`Error fetching public collection: ${collectionError.message}`);
  }

  // Check if the collection owner has embed access
  const hasEmbedAccess = await checkCollectionEmbedAccess(collectionId);

  // Then get the tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('collection_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });

  if (tracksError) {
    throw new Error(`Error fetching collection tracks: ${tracksError.message}`);
  }

  // Refresh durations for any tracks with placeholder values
  const tracksData = tracks || [];
  const audioFiles = tracksData.map(track => track.audio_file);
  const updatedAudioFiles = await refreshAudioFileDurations(audioFiles);
  
  // Map the updated audio files back to tracks
  const updatedTracks = tracksData.map((track, index) => ({
    ...track,
    audio_file: updatedAudioFiles[index]
  }));

  return { collection, tracks: updatedTracks, hasEmbedAccess };
};