/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import secureLocalStorage from 'react-secure-storage';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
});

// Request Interceptor
axiosClient.interceptors.request.use(
  async (config: any) => {
    // ถ้า body เป็น FormData (เช่น อัปโหลดไฟล์) ต้องปล่อยให้ browser ตั้ง Content-Type
    // เองพร้อม boundary ของ multipart — ถ้าตั้ง 'application/json' ทับไป backend จะ parse ไม่ได้
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    config.headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...config.headers,
    };
    if (isFormData) delete config.headers['Content-Type'];

    // Add Bearer Token if it exists
    const token = secureLocalStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // token หมดอายุ/ถูก revoke (เช่น logout จากที่อื่น หรือ token เก่าก่อน backend เปลี่ยน tokenVersion)
      // เคลียร์ session ทิ้งแล้วพากลับไปหน้า login เพื่อไม่ให้หน้าเว็บค้างเป็น request ที่ fail เงียบๆ
      secureLocalStorage.removeItem('token');
      secureLocalStorage.removeItem('data');
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;