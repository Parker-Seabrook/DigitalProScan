import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Team Members
export const getTeamMembers = async (activeOnly = false) => {
  const response = await api.get('/team-members', { params: { active_only: activeOnly } });
  return response.data;
};

export const getTeamMember = async (id) => {
  const response = await api.get(`/team-members/${id}`);
  return response.data;
};

export const createTeamMember = async (data) => {
  const response = await api.post('/team-members', data);
  return response.data;
};

export const updateTeamMember = async (id, data) => {
  const response = await api.patch(`/team-members/${id}`, data);
  return response.data;
};

export const deleteTeamMember = async (id) => {
  const response = await api.delete(`/team-members/${id}`);
  return response.data;
};

export const assignJobToMember = async (memberId, jobWoId, jobWoNumber) => {
  const response = await api.put(`/team-members/${memberId}/job`, null, { 
    params: { job_wo_id: jobWoId, job_wo_number: jobWoNumber } 
  });
  return response.data;
};

// Locations
export const submitLocation = async (data) => {
  const response = await api.post('/locations', data);
  return response.data;
};

export const getLocations = async (params = {}) => {
  const response = await api.get('/locations', { params });
  return response.data;
};

// Status
export const submitStatus = async (data) => {
  const response = await api.post('/status', data);
  return response.data;
};

export const getStatusUpdates = async (userId = null, limit = 50) => {
  const response = await api.get('/status', { params: { user_id: userId, limit } });
  return response.data;
};

export const getCurrentStatuses = async () => {
  const response = await api.get('/status/current');
  return response.data;
};

// Jobs/Work Orders
export const getJobs = async (activeOnly = true) => {
  const response = await api.get('/jobs', { params: { active_only: activeOnly } });
  return response.data;
};

export const createJob = async (data) => {
  const response = await api.post('/jobs', data);
  return response.data;
};

export const updateJob = async (id, isActive) => {
  const response = await api.patch(`/jobs/${id}`, null, { params: { is_active: isActive } });
  return response.data;
};

// Geofences
export const getGeofences = async (activeOnly = true) => {
  const response = await api.get('/geofences', { params: { active_only: activeOnly } });
  return response.data;
};

export const createGeofence = async (data) => {
  const response = await api.post('/geofences', data);
  return response.data;
};

export const deleteGeofence = async (id) => {
  const response = await api.delete(`/geofences/${id}`);
  return response.data;
};

export const getGeofenceEvents = async (params = {}) => {
  const response = await api.get('/geofence-events', { params });
  return response.data;
};

// Messages
export const getMessages = async (userId = null, limit = 50) => {
  const response = await api.get('/messages', { params: { user_id: userId, limit } });
  return response.data;
};

export const sendMessage = async (data) => {
  const response = await api.post('/messages', data);
  return response.data;
};

export const markMessageRead = async (id) => {
  const response = await api.patch(`/messages/${id}/read`);
  return response.data;
};

// SOS Alerts
export const getSOSAlerts = async (status = null, limit = 50) => {
  const response = await api.get('/alerts/sos', { params: { status, limit } });
  return response.data;
};

export const triggerSOSAlert = async (data) => {
  const response = await api.post('/alerts/sos', data);
  return response.data;
};

export const acknowledgeSOSAlert = async (id, acknowledgedBy) => {
  const response = await api.put(`/alerts/sos/${id}/acknowledge`, null, { 
    params: { acknowledged_by: acknowledgedBy } 
  });
  return response.data;
};

export const cancelSOSAlert = async (id, canceledBy, reason = null) => {
  const response = await api.put(`/alerts/sos/${id}/cancel`, null, { 
    params: { canceled_by: canceledBy, cancellation_reason: reason } 
  });
  return response.data;
};

export const resolveSOSAlert = async (id) => {
  const response = await api.put(`/alerts/sos/${id}/resolve`);
  return response.data;
};

// Reports
export const getProductivityReport = async (params = {}) => {
  const response = await api.get('/reports/productivity', { params });
  return response.data;
};

export const getWorkBarriersReport = async (params = {}) => {
  const response = await api.get('/reports/work-barriers', { params });
  return response.data;
};

// Stats
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

// Reference data
export const getSupportActivityTypes = async () => {
  const response = await api.get('/support-activities');
  return response.data;
};

export const getWorkDelayTypes = async () => {
  const response = await api.get('/work-delays');
  return response.data;
};

// Health
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
