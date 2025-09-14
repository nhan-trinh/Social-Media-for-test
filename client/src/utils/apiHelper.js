// apiHelper.js - Utility functions để quản lý API calls với token

export class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenError';
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Kiểm tra và lấy token hợp lệ
 * @param {function} getToken - Clerk's getToken function
 * @returns {Promise<string>} - Valid token
 * @throws {TokenError} - Nếu không có token
 */
export const getValidToken = async (getToken) => {
  try {
    if (!getToken || typeof getToken !== 'function') {
      throw new TokenError('getToken function not available');
    }

    const token = await getToken();
    
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new TokenError('No valid token available');
    }
    
    return token.trim();
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }
    throw new TokenError(`Failed to get token: ${error.message}`);
  }
};

/**
 * Tạo authorized headers với token
 * @param {string} token - Valid token
 * @returns {object} - Headers object với Authorization
 */
export const createAuthHeaders = (token) => {
  if (!token) {
    throw new TokenError('Token is required for auth headers');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Wrapper function để thực hiện API call với token validation
 * @param {function} getToken - Clerk's getToken function  
 * @param {function} apiCall - Function thực hiện API call
 * @returns {Promise} - API response
 */
export const makeAuthenticatedRequest = async (getToken, apiCall) => {
  try {
    const token = await getValidToken(getToken);
    return await apiCall(token);
  } catch (error) {
    if (error instanceof TokenError) {
      console.error('Token validation failed:', error.message);
      throw error;
    }
    
    // Log API errors
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Utility để retry API call với exponential backoff
 * @param {function} apiCall - Function thực hiện API call
 * @param {number} maxRetries - Số lần retry tối đa
 * @param {number} baseDelay - Delay cơ bản (ms)
 * @returns {Promise} - API response
 */
export const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Không retry cho lỗi token hoặc 4xx errors
      if (error instanceof TokenError || 
          (error.response && error.response.status >= 400 && error.response.status < 500)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`API call failed, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Hook để sử dụng authenticated API calls
 * Sử dụng trong React components
 */
export const useAuthenticatedApi = (getToken) => {
  const makeRequest = async (apiCall) => {
    return makeAuthenticatedRequest(getToken, apiCall);
  };
  
  const makeRetryRequest = async (apiCall, maxRetries = 3) => {
    return retryApiCall(() => makeRequest(apiCall), maxRetries);
  };
  
  return {
    makeRequest,
    makeRetryRequest
  };
};

// Ví dụ sử dụng trong component:
/*
import { useAuth } from "@clerk/clerk-react";
import { useAuthenticatedApi } from './apiHelper';

const MyComponent = () => {
  const { getToken } = useAuth();
  const { makeRequest, makeRetryRequest } = useAuthenticatedApi(getToken);
  
  const fetchUserData = async () => {
    try {
      await makeRequest(async (token) => {
        const response = await api.get('/api/user/data', {
          headers: createAuthHeaders(token)
        });
        return response.data;
      });
    } catch (error) {
      if (error instanceof TokenError) {
        // Handle token error
      } else {
        // Handle other errors
      }
    }
  };
  
  return <div>...</div>;
};
*/