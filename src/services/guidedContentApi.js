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
 */
export const createContent = (contentType, data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  return axios.post(`${API_BASE}/${contentType}`, data, config).then(res => res.data);
};

/**
 * Update a content item
 */
export const updateContent = (contentType, id, data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  return axios.put(`${API_BASE}/${contentType}/${id}`, data, config).then(res => res.data);
};

/**
 * Delete a content item
 */
export const deleteContent = (contentType, id) => {
  return axios.delete(`${API_BASE}/${contentType}/${id}`).then(res => res.data);
};
