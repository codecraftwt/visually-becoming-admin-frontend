import axios from 'axios';

const API_BASE = import.meta.env.VITE_BASE_FRONTEND_URL || 'http://localhost:5000/api';

/**
 * Generic API service for guided content
 * Works with any content type (audio, meditation, visualization, etc.)
 */

/**
 * Get categories for a content type
 */
export const getCategories = (contentType) => {
  return axios.get(`${API_BASE}/${contentType}/categories`).then(res => res.data);
};

/**
 * Create a category for a content type
 */
export const createCategory = (contentType, data) => {
  return axios.post(`${API_BASE}/${contentType}/categories`, data).then(res => res.data);
};

/**
 * Update a category
 */
export const updateCategory = (contentType, id, data) => {
  return axios.put(`${API_BASE}/${contentType}/categories/${id}`, data).then(res => res.data);
};

/**
 * Delete a category
 */
export const deleteCategory = (contentType, id) => {
  return axios.delete(`${API_BASE}/${contentType}/categories/${id}`).then(res => res.data);
};

/**
 * Get all content items for a content type
 */
export const getContent = (contentType) => {
  return axios.get(`${API_BASE}/${contentType}`).then(res => res.data);
};

/**
 * Get content items by category
 */
export const getContentByCategory = (contentType, categoryId) => {
  return axios.get(`${API_BASE}/${contentType}/category/${categoryId}`).then(res => res.data);
};

/**
 * Create a content item
 * 
 * Now supports both:
 * - JSON data (for direct Firebase Storage uploads - files pre-uploaded)
 * - FormData (for legacy backend uploads)
 */
export const createContent = (contentType, data, onUploadProgress, signal) => {
  const isFormData = data instanceof FormData;
  
  // Debug logging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 API CALL: createContent');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Request Details:', {
    contentType,
    isFormData,
    dataType: typeof data,
    isPlainObject: data && typeof data === 'object' && !(data instanceof FormData),
    hasMedia: data?.media?.length > 0,
    mediaCount: data?.media?.length || 0,
    payloadSize: isFormData ? 'N/A (FormData)' : `${JSON.stringify(data).length} bytes`
  });
  
  if (isFormData) {
    console.error('❌ ERROR: FormData detected! Files should be uploaded to Firebase Storage first.');
    console.error('⚠️ This request will hit Vercel\'s 4.5MB limit if files are included.');
    console.error('🔍 Check why files are being sent instead of URLs.');
  } else {
    console.log('✅ Sending JSON (not FormData) - files should already be in Firebase Storage');
    console.log('🔗 Media URLs being sent:', data?.media?.map(m => m.url) || []);
    console.log('📊 Payload preview:', {
      title: data?.title,
      categoryId: data?.categoryId,
      mediaCount: data?.media?.length || 0,
      mediaTypes: data?.media?.map(m => m.type) || []
    });
  }
  
  const config = {
    ...(isFormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : { headers: { 'Content-Type': 'application/json' } }
    ),
    ...(onUploadProgress ? { onUploadProgress } : {}),
    ...(signal ? { signal } : {})
  };
  return axios.post(`${API_BASE}/${contentType}`, data, config).then(res => res.data);
};

/**
 * Update a content item
 * 
 * Now supports both:
 * - JSON data (for direct Firebase Storage uploads - files pre-uploaded)
 * - FormData (for legacy backend uploads)
 */
export const updateContent = (contentType, id, data, onUploadProgress, signal) => {
  const isFormData = data instanceof FormData;
  
  // Debug logging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 API CALL: updateContent');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Request Details:', {
    contentType,
    id,
    isFormData,
    dataType: typeof data,
    isPlainObject: data && typeof data === 'object' && !(data instanceof FormData),
    hasMedia: data?.media?.length > 0,
    mediaCount: data?.media?.length || 0,
    payloadSize: isFormData ? 'N/A (FormData)' : `${JSON.stringify(data).length} bytes`
  });
  
  if (isFormData) {
    console.error('❌ ERROR: FormData detected! Files should be uploaded to Firebase Storage first.');
    console.error('⚠️ This request will hit Vercel\'s 4.5MB limit if files are included.');
    console.error('🔍 Check why files are being sent instead of URLs.');
  } else {
    console.log('✅ Sending JSON (not FormData) - files should already be in Firebase Storage');
    console.log('🔗 Media URLs being sent:', data?.media?.map(m => m.url) || []);
    console.log('📊 Payload preview:', {
      title: data?.title,
      categoryId: data?.categoryId,
      mediaCount: data?.media?.length || 0,
      mediaTypes: data?.media?.map(m => m.type) || []
    });
  }
  
  const config = {
    ...(isFormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : { headers: { 'Content-Type': 'application/json' } }
    ),
    ...(onUploadProgress ? { onUploadProgress } : {}),
    ...(signal ? { signal } : {})
  };
  return axios.put(`${API_BASE}/${contentType}/${id}`, data, config).then(res => res.data);
};

/**
 * Delete a content item
 */
export const deleteContent = (contentType, id) => {
  return axios.delete(`${API_BASE}/${contentType}/${id}`).then(res => res.data);
};
