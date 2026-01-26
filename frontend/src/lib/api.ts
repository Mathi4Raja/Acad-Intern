
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
    headers: {
        'Content-Type': 'application/json',
    },
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

        return api.post(`/messages/application/${applicationId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Mark messages as seen
    markAsSeen: (applicationId: string) =>
        api.patch(`/messages/application/${applicationId}/seen`),

    // Get unread message count
    getUnreadCount: () => api.get('/messages/unread-count'),
};

export default api;


