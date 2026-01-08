/**
 * Firebase Storage Service
 * 
 * Handles direct client-side uploads to Firebase Storage.
 * This bypasses Vercel's 4.5MB body size limit by uploading files directly from the browser.
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseClient';

/**
 * Get the storage path for a content type
 * @param {string} contentType - Content type (audio, meditation, visualization)
 * @returns {string} Storage path prefix
 */
const getStoragePath = (contentType) => {
  const paths = {
    audio: 'guided-audio',
    meditation: 'guided-meditation',
    visualization: 'guided-visualization'
  };
  return paths[contentType] || 'guided-content';
};

/**
 * Upload a file directly to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} contentType - Content type (audio, meditation, visualization)
 * @param {Function} onProgress - Progress callback (bytesTransferred, totalBytes) => void
 * @returns {Promise<string>} Public download URL
 */
export const uploadFileToStorage = async (file, contentType, onProgress = null) => {
  try {
    const storagePath = getStoragePath(contentType);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const fileRef = ref(storage, `${storagePath}/${fileName}`);

    // Create upload task
    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000' // 1 year cache
    });

    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(snapshot.bytesTransferred, snapshot.totalBytes, progress);
          }
        },
        (error) => {
          // Handle errors
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Firebase Storage upload completed!');
            console.log('📎 Generated download URL:', downloadURL);
            console.log('📊 File details:', {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              storagePath: `${storagePath}/${fileName}`,
              downloadURL: downloadURL
            });
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} contentType - Content type (audio, meditation, visualization)
 * @param {Function} onProgress - Progress callback (fileIndex, bytesTransferred, totalBytes, progress) => void
 * @returns {Promise<string[]>} Array of public download URLs
 */
export const uploadFilesToStorage = async (files, contentType, onProgress = null) => {
  console.log('🚀 Starting upload for', files.length, 'file(s) to Firebase Storage');
  console.log('📦 Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
  
  const uploadPromises = files.map((file, index) => {
    console.log(`📤 Uploading file ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    const fileProgress = onProgress
      ? (bytesTransferred, totalBytes, progress) => {
          onProgress(index, bytesTransferred, totalBytes, progress);
        }
      : null;
    
    return uploadFileToStorage(file, contentType, fileProgress);
  });

  const urls = await Promise.all(uploadPromises);
  
  console.log('✅ All files uploaded successfully!');
  console.log('🔗 Generated URLs:', urls);
  console.log('📋 URL Summary:', urls.map((url, index) => ({
    fileIndex: index + 1,
    fileName: files[index].name,
    url: url,
    urlLength: url.length
  })));
  
  return urls;
};

/**
 * Delete a file from Firebase Storage
 * @param {string} fileUrl - The public URL of the file to delete
 * @param {string} contentType - Content type (audio, meditation, visualization)
 * @returns {Promise<void>}
 */
export const deleteFileFromStorage = async (fileUrl, contentType) => {
  try {
    // Extract the file path from the URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid file URL format');
    }

    // Decode the path (URL encoded)
    const encodedPath = pathMatch[1];
    const decodedPath = decodeURIComponent(encodedPath);
    
    const fileRef = ref(storage, decodedPath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw - file might already be deleted
    console.warn('File deletion failed (may already be deleted):', fileUrl);
  }
};

/**
 * Delete multiple files from Firebase Storage
 * @param {string[]} fileUrls - Array of public URLs to delete
 * @param {string} contentType - Content type (audio, meditation, visualization)
 * @returns {Promise<void[]>}
 */
export const deleteFilesFromStorage = async (fileUrls, contentType) => {
  const deletePromises = fileUrls.map(url => deleteFileFromStorage(url, contentType));
  return Promise.all(deletePromises);
};