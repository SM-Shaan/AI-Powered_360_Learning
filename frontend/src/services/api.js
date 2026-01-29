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

  // Upload handwritten notes with OCR (Admin only)
  uploadHandwrittenNotes: (formData) => api.post('/content/handwritten-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Re-run OCR on existing handwritten notes (Admin only)
  reprocessOCR: (id, enhanceImage = true) =>
    api.post(`/content/handwritten-notes/${id}/reocr?enhance_image=${enhanceImage}`),

  // Update content metadata (Admin only)
  update: (id, data) => api.put(`/content/${id}`, data),

  // Delete content (Admin only)
  delete: (id) => api.delete(`/content/${id}`),

  // Get content statistics
  getStats: () => api.get('/content/stats/overview'),

  // Get download URL
  getDownloadUrl: (id) => `${API_BASE_URL}/content/${id}/download`,

  // Reprocess single content for search indexing (Admin only)
  reprocess: (id) => api.post(`/content/${id}/reprocess`),

  // Reprocess all content for search indexing (Admin only)
  reprocessAll: () => api.post('/content/reprocess-all'),
};

// Search API (Part 2)
export const searchAPI = {
  // Semantic search
  semantic: (query, options = {}) =>
    api.post('/search/semantic', { query, top_k: 10, threshold: 0.5, ...options }),

  // Hybrid search (keyword + semantic)
  hybrid: (query, options = {}) =>
    api.post('/search/hybrid', { query, top_k: 10, keyword_weight: 0.3, semantic_weight: 0.7, ...options }),

  // Code search
  code: (query, language = null, topK = 5) =>
    api.post('/search/code', { query, language, top_k: topK }),

  // RAG question answering
  ask: (question, options = {}) =>
    api.post('/search/ask', { question, max_context_chunks: 5, include_sources: true, ...options }),

  // Topic explanation
  explain: (topic, category = null, difficulty = 'intermediate') =>
    api.post(`/search/explain?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}${category ? `&category=${category}` : ''}`),

  // Find similar content
  similar: (contentId, topK = 5) =>
    api.get(`/search/similar/${contentId}?top_k=${topK}`),

  // Summarize content
  summarize: (contentId, length = 'medium') =>
    api.post(`/search/summarize/${contentId}?length=${length}`),

  // Test embedding
  testEmbedding: (text) =>
    api.get(`/search/test-embedding?text=${encodeURIComponent(text)}`),

  // Get supported features
  getFeatures: () =>
    api.get('/search/supported-features'),
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

// Chat API (Part 5)
export const chatAPI = {
  // Send a message
  sendMessage: (message, conversationId = 'new') =>
    api.post('/chat/message', { message, conversation_id: conversationId }),

  // Get all conversations
  getConversations: () =>
    api.get('/chat/conversations'),

  // Get a specific conversation
  getConversation: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}`),

  // Create a new conversation
  createConversation: () =>
    api.post('/chat/conversations/new'),

  // Delete a conversation
  deleteConversation: (conversationId) =>
    api.delete(`/chat/conversations/${conversationId}`),

  // Clear conversation history
  clearConversation: (conversationId) =>
    api.post(`/chat/conversations/${conversationId}/clear`),

  // Get suggested prompts
  getSuggestions: () =>
    api.get('/chat/suggestions'),
};

export default api;
