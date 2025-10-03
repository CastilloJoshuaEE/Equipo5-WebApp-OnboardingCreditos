import axios from 'axios';

const api = axios.create({
  // NEXT_PUBLIC_API_BASE_URL="http://localhost:8080/api/v1"
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;