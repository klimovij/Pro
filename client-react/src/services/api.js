import axios from 'axios';

// В продакшене используем относительный путь (nginx проксирует /api на сервер)
// В разработке используем localhost:5000
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api'; // nginx проксирует на сервер
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 секунд для загрузки файлов
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Для загрузки файлов НЕ устанавливаем Content-Type - пусть браузер сам определит
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;