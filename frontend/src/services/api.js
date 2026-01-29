import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, email, password, role = 'student') =>
    api.post('/auth/register', { username, email, password, role }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data) => api.put('/auth/profile', data),

  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/password', { currentPassword, newPassword }),

  getUsers: () => api.get('/auth/users'),
};

// Content API
export const contentAPI = {
  // Get all content with optional filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/content?${params.toString()}`);
  },

  // Get single content by ID
  getById: (id) => api.get(`/content/${id}`),

  // Upload new content (Admin only)
  upload: (formData) => api.post('/content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Update content metadata (Admin only)
  update: (id, data) => api.put(`/content/${id}`, data),

  // Delete content (Admin only)
  delete: (id) => api.delete(`/content/${id}`),

  // Get content statistics
  getStats: () => api.get('/content/stats/overview'),

  // Get download URL
  getDownloadUrl: (id) => `${API_BASE_URL}/content/${id}/download`,
};

// Generation API (Part 3)
export const generationAPI = {
  // Generate theory notes
  generateNotes: (data) => api.post('/generate/notes', data),

  // Generate slides outline
  generateSlides: (data) => api.post('/generate/slides', data),

  // Generate lab code
  generateCode: (data) => api.post('/generate/code', data),

  // Generate quiz
  generateQuiz: (data) => api.post('/generate/quiz', data),

  // Search Wikipedia for context
  searchWikipedia: (query, maxResults = 5) =>
    api.get(`/generate/wikipedia/search?query=${encodeURIComponent(query)}&max_results=${maxResults}`),

  // Get supported programming languages
  getSupportedLanguages: () => api.get('/generate/supported-languages'),
};

export default api;
