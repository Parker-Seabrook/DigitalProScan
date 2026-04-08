import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents
export const getDocuments = async (params = {}) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocument = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const createDocument = async (data) => {
  const response = await api.post('/documents', data);
  return response.data;
};

export const updateDocument = async (id, data) => {
  const response = await api.patch(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

// Folders
export const getFolders = async () => {
  const response = await api.get('/folders');
  return response.data;
};

export const createFolder = async (data) => {
  const response = await api.post('/folders', data);
  return response.data;
};

export const deleteFolder = async (id) => {
  const response = await api.delete(`/folders/${id}`);
  return response.data;
};

// Tags
export const getTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const createTag = async (data) => {
  const response = await api.post('/tags', data);
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};

// Activities
export const getActivities = async (limit = 20) => {
  const response = await api.get('/activities', { params: { limit } });
  return response.data;
};

// Stats
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

// OCR
export const extractOCR = async (docId) => {
  const response = await api.post(`/ocr/${docId}`);
  return response.data;
};

// Health
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
