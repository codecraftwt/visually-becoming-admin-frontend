// visually-becoming-admin-frontend\src\services\api.js
import axios from 'axios';


const API_BASE = import.meta.env.VITE_BASE_FRONTEND_URL || 'http://localhost:5000/api';

export const api = {
  // Categories
  getCategories: () => axios.get(`${API_BASE}/categories`).then(res => res.data),
  createCategory: (data) => axios.post(`${API_BASE}/categories`, data).then(res => res.data),
  updateCategory: (id, data) => axios.put(`${API_BASE}/categories/${id}`, data).then(res => res.data),
  deleteCategory: (id) => axios.delete(`${API_BASE}/categories/${id}`).then(res => res.data),


  // Daily Affirmations
  getDailyAffirmations: () => axios.get(`${API_BASE}/daily-affirmations`).then(res => res.data),
  createDailyAffirmation: (data) => axios.post(`${API_BASE}/daily-affirmations`, data).then(res => res.data),
  updateDailyAffirmation: (id, data) => axios.put(`${API_BASE}/daily-affirmations/${id}`, data).then(res => res.data),
  deleteDailyAffirmation: (id) => axios.delete(`${API_BASE}/daily-affirmations/${id}`).then(res => res.data),
  // Guided Audio
  getGuidedAudio: () => axios.get(`${API_BASE}/guided-audio`).then(res => res.data),
  createGuidedAudio: (data) => axios.post(`${API_BASE}/guided-audio`, data).then(res => res.data),
  updateGuidedAudio: (id, data) => axios.put(`${API_BASE}/guided-audio/${id}`, data).then(res => res.data),

  // Guided Meditations
  getGuidedMeditations: () => axios.get(`${API_BASE}/guided-meditations`).then(res => res.data),
  createGuidedMeditation: (data) => axios.post(`${API_BASE}/guided-meditations`, data).then(res => res.data),
  updateGuidedMeditation: (id, data) => axios.put(`${API_BASE}/guided-meditations/${id}`, data).then(res => res.data),

  // Guided Visualizations
  getGuidedVisualizations: () => axios.get(`${API_BASE}/guided-visualizations`).then(res => res.data),
  createGuidedVisualization: (data) => axios.post(`${API_BASE}/guided-visualizations`, data).then(res => res.data),
  updateGuidedVisualization: (id, data) => axios.put(`${API_BASE}/guided-visualizations/${id}`, data).then(res => res.data),

  // Daily Notifications
  getDailyNotifications: () => axios.get(`${API_BASE}/daily-notifications`).then(res => res.data),
  createDailyNotification: (data) => axios.post(`${API_BASE}/daily-notifications`, data).then(res => res.data),

  // Today's Content
  getTodayContent: () => axios.get(`${API_BASE}/today`).then(res => res.data),
};

export const {
  // categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // daily affirmations
  getDailyAffirmations,
  createDailyAffirmation,
  updateDailyAffirmation,
  deleteDailyAffirmation,

  // guided audio
  getGuidedAudio,
  createGuidedAudio,
  updateGuidedAudio,

  // guided meditations
  getGuidedMeditations,
  createGuidedMeditation,
  updateGuidedMeditation,

  // guided visualizations
  getGuidedVisualizations,
  createGuidedVisualization,
  updateGuidedVisualization,

  // daily notifications
  getDailyNotifications,
  createDailyNotification,

  // today's content
  getTodayContent,
} = api;