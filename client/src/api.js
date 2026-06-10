const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let inMemoryToken = null;

async function request(endpoint, options = {}) {
  const token = inMemoryToken;
  
  const headers = {};
  
  // Set Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // If not sending multipart form data, set content type to JSON
  if (!options.isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };

  if (options.body && !options.isMultipart) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
}

const api = {
  setToken: (token) => {
    inMemoryToken = token;
  },
  getToken: () => inMemoryToken,
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData,
    isMultipart: true
  })
};

export default api;
