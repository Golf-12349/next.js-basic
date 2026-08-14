/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import secureLocalStorage from 'react-secure-storage';

const axiosClient = axios.create({
  baseURL: 'http://10.44.38.164:3000/api',
});

// Request Interceptor
axiosClient.interceptors.request.use(
  async (config: any) => {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

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
  (response) => {
    // Handle success responses
    // if (response.status === 200 || response.status === 201) {
    //   // return response?.data; // Return only the data for cleaner usage
    //   return response; 
    // }
    return response;
  },
  (error) => {
    // if (error.response) {
    //   const response = error.response;
    //   if (response?.data?.code === 401 && response?.data?.error === "Unauthorized") {
    //     // Handle unauthorized access (e.g., token expiration)
    //     console.log("Unauthorized", error.response);
    //     console.warn('Token expired or unauthorized, redirecting to login...');
    //     // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    //     localStorage.clear();
    //     secureLocalStorage.clear();
    //     window.location.replace('/auth/login');
    //   } else {
    //     console.error(
    //       `API Error: ${response.status} - ${response.statusText}`
    //     );
    //   }
    // } else {
    //   console.error('Network/Server Error:', error.message);
    // }

    // Re-throw the error for further handling
    return Promise.reject(error);
  }
);

export default axiosClient;