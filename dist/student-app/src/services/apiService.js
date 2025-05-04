import axios from 'axios';
const API_BASE = '/api';

export function fetchVideoResources() {
    return axios.get(`${API_BASE}/resources/videos`);
} 