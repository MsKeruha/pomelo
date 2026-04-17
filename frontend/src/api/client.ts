const BASE_URL = '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let message = 'API request failed';
            
            if (typeof errorData.detail === 'string') {
                message = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
                // Format FastAPI validation errors
                message = errorData.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('; ');
            } else if (errorData.message) {
                message = errorData.message;
            }
            
            throw new Error(message);
        }

        return await response.json();
    } catch (err: any) {
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            throw new Error('NETWORK_ERROR');
        }
        if (err.name === 'AbortError') {
            throw new Error('TIMEOUT_ERROR');
        }
        throw err;
    }
}

export const api = {
    get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => apiFetch(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(body) 
    }),
    put: (endpoint: string, body: any) => apiFetch(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(body) 
    }),
    delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' }),
    // Special case for login which uses form data
    login: async (formData: FormData) => {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Login failed');
        }
        return response.json();
    },
    // Special case for file uploads which uses multi-part/form-data
    upload: async (formData: FormData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/upload-image`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Upload failed');
        }
        return response.json();
    },
    // For user avatars
    uploadAvatar: async (formData: FormData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/users/me/upload-avatar`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Avatar upload failed');
        }
        return response.json();
    }
};
