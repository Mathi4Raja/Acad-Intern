
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Environment variables for API URLs
const LOCAL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// Dynamically determine API URL based on current host
const getApiUrl = (): string => {
    return LOCAL_API_URL;
};

// Create an Axios instance - baseURL will be set dynamically per request
const api: AxiosInstance = axios.create({
    withCredentials: true, // Important for cookies (JWT)
    headers: {},
});

// Request interceptor - dynamically set baseURL on each request
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Set baseURL dynamically on each request (ensures client-side detection works)
        config.baseURL = getApiUrl();
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        // Handle specific status codes (e.g., 401 Unauthorized -> redirect to login)
        if (error.response && error.response.status === 401) {
            // Optional: Redirect logic can go here if not handled by components/context
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // This might be aggressive, letting AuthContext handle it is better usually
            }
        }
        return Promise.reject(error);
    }
);

// Message API functions
export const messageApi = {
    // Get all conversations
    getConversations: () => api.get('/messages/conversations'),

    // Get messages for a specific application
    getMessages: (applicationId: string) => api.get(`/messages/application/${applicationId}`),

    // Send a message
    sendMessage: (applicationId: string, content: string) =>
        api.post(`/messages/application/${applicationId}`, { content }),

    // Send a message with files
    sendMessageWithFiles: (applicationId: string, content: string, files: File[]) => {
        const formData = new FormData();
        formData.append('content', content);
        files.forEach(file => formData.append('files', file));

        return api.post(`/messages/application/${applicationId}`, formData);
    },

    // Mark messages as seen
    markAsSeen: (applicationId: string) =>
        api.patch(`/messages/application/${applicationId}/seen`),

    // Get unread message count
    getUnreadCount: () => api.get('/messages/unread-count'),

    // Mute/Unmute conversation
    muteConversation: (applicationId: string, mutedUntil: string | null) =>
        api.post(`/messages/application/${applicationId}/mute`, { mutedUntil }),

    getPreferences: (applicationId: string) =>
        api.get(`/messages/application/${applicationId}/preferences`),

    deleteConversation: (applicationId: string) =>
        api.delete(`/messages/application/${applicationId}`),
};

export const companyApi = {
    getProfile: (id: string) => api.get(`/companies/${id}`),
    getCompanies: (params?: any) => api.get('/companies', { params }),
};

export const studentApi = {
    // Get student profile by ID
    getProfile: (studentId: string) => api.get(`/students/profile/${studentId}`),
};

export const reportsApi = {
    createReport: (data: {
        internshipId?: string;
        applicationId?: string;
        reportedUserId?: string;
        subject: string;
        body: string;
        category?: string;
        priority?: string
    }) => api.post('/reports', data),
};

export const applicationsApi = {
    get: (id: string) => api.get(`/applications/${id}`),
};

export const adminApi = {
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (settings: any) => api.put('/admin/settings', settings),
};

export const internshipsApi = {
    getPopular: (limit: number = 6) => api.get(`/internships/popular?limit=${limit}`),
};

export default api;



export const settingsApi = {
    getPublic: () => api.get('/settings/public')
}
