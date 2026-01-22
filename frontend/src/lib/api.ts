
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Environment variables for API URLs
const LOCAL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TUNNEL_API_URL = process.env.NEXT_PUBLIC_TUNNEL_API_URL || '';

// Dynamically determine API URL based on current host
const getApiUrl = (): string => {
    // Server-side: use local API
    if (typeof window === 'undefined') {
        return LOCAL_API_URL;
    }

    // Client-side: detect if accessing via dev tunnels
    const host = window.location.hostname;

    // If accessing via dev tunnels and tunnel URL is configured, use it
    if (host.includes('devtunnels.ms') && TUNNEL_API_URL) {
        return TUNNEL_API_URL;
    }

    // Default: localhost
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

export default api;

