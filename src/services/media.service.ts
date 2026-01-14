import { supabase, Tables, Buckets } from '../config/supabase';
import { MediaAsset } from '../types';
import * as RNFS from 'react-native-fs';
import { decode } from 'base64-async';

// Custom error for media-related operations
export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaError';
  }
}

// Service to handle all media and storage operations
export class MediaService {
  /**
   * List all media assets for a user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of media assets.
   */
  static async listUserMedia(userId: string): Promise<MediaAsset[]> {
    try {
      const { data, error } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new MediaError(error.message);
      return data as MediaAsset[];
    } catch (error) {
      console.error('Error listing user media:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for a private media file.
   * @param filePath The path of the file in the storage bucket.
   * @returns A promise that resolves to the signed URL string.
   */
  static async getMediaUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(Buckets.MEDIA)
        .createSignedUrl(filePath, 60 * 5); // Expires in 5 minutes

      if (error) throw new MediaError(error.message);
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting media URL:', error);
      throw error;
    }
  }

  /**
   * Delete a media asset from storage and the database.
   * @param userId The ID of the user.
   * @param assetId The ID of the media asset to delete.
   */
  static async deleteMedia(userId: string, assetId: string): Promise<void> {
    try {
      // 1. Get asset details from the database
      const { data: asset, error: fetchError } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .select('file_path') // Assume `file_path` column stores the path in storage
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !asset) {
        throw new MediaError(fetchError?.message || 'Asset not found.');
      }

      // 2. Delete file from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(Buckets.MEDIA)
        .remove([asset.file_path]);

      if (storageError) {
        // Log error but proceed to delete DB record
        console.error('Error deleting from storage:', storageError.message);
      }

      // 3. Delete record from the database
      const { error: dbError } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .delete()
        .eq('id', assetId);

      if (dbError) throw new MediaError(dbError.message);

    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  /**
   * Upload a media file to Supabase Storage.
   * @param userId The ID of the user.
   * @param fileUri The local URI of the file.
   * @param fileName The name of the file.
   * @param mimeType The MIME type of the file.
   * @param onProgress Optional callback for upload progress.
   * @returns A promise that resolves to the newly created media asset.
   */
  static async uploadMedia(
    userId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<MediaAsset> {
    try {
      // Get file stats to know the size
      const stats = await RNFS.stat(fileUri);
      const fileSize = Number(stats.size);

      // Read the file content as a base64 string
      const base64Data = await RNFS.readFile(fileUri, 'base64');
      // Decode the base64 string into a Blob-like object (ArrayBuffer)
      const arrayBuffer = decode(base64Data);

      const filePath = `${userId}/${Date.now()}_${fileName}`;

      // The Supabase client's `upload` method can accept an ArrayBuffer.
      // For React Native, this approach combined with `react-native-url-polyfill`
      // allows the underlying XMLHttpRequest to handle the file correctly.
      // Supabase's storage client, when given a file of this type, will
      // automatically use the Tus protocol for resumable, chunked uploads.
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(Buckets.MEDIA)
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
          // Note: Progress events are not natively supported in this flow with RN.
          // A more advanced implementation might require a custom XMLHttpRequest wrapper.
          // For now, we will simulate progress completion at the end.
        });

      if (uploadError) {
        throw new MediaError(`Upload failed: ${uploadError.message}`);
      }

      // The media bucket is private. We store the path and generate signed URLs on demand.
      // The `file_url` column will be NULL.
      const mediaType = mimeType.startsWith('video') ? 'video' : mimeType.startsWith('audio') ? 'audio' : 'image';
      const { data: dbData, error: dbError } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .insert({
          user_id: userId,
          type: mediaType,
          file_name: fileName,
          file_size: fileSize,
          file_path: filePath, // Store the path for generating signed URLs
          mime_type: mimeType,
        })
        .select()
        .single();

      if (dbError) {
        // If the DB insert fails, we should try to clean up the stored file.
        await supabase.storage.from(Buckets.MEDIA).remove([filePath]);
        throw new MediaError(`Failed to create media record: ${dbError.message}`);
      }

      onProgress?.(1); // Simulate completion
      return dbData as MediaAsset;

    } catch (error) {
      console.error('Error uploading media:', error);
      if (error instanceof MediaError) {
        throw error;
      }
      throw new MediaError('An unexpected error occurred during upload.');
    }
  }
}
