/**
 * Centralized authentication utility for API calls
 * 
 * This utility ensures all API calls in production include the required
 * X-API-Key header for authentication with the middleware.
 */

const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '66c35a78cd1f6ef98da9c880b99cf77304de9cc9fe2d2101ea93a10fc550232c';

/**
 * Authenticated fetch wrapper that automatically includes API key headers
 * 
 * @param url - The URL to fetch from
 * @param options - Standard fetch options (method, body, etc.)
 * @returns Promise<Response>
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeaders = {
    'X-API-Key': API_KEY,
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers: authHeaders
  });
};

/**
 * Authenticated JSON fetch that automatically includes API key and Content-Type headers
 * 
 * @param url - The URL to fetch from
 * @param data - Data to send as JSON body
 * @param method - HTTP method (default: 'POST')
 * @returns Promise<Response>
 */
export const authenticatedJsonFetch = async (
  url: string, 
  data: any, 
  method: string = 'POST'
): Promise<Response> => {
  return authenticatedFetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

/**
 * Shorthand for authenticated GET requests
 */
export const authenticatedGet = (url: string) => authenticatedFetch(url);

/**
 * Shorthand for authenticated POST requests with JSON data
 */
export const authenticatedPost = (url: string, data: any) => 
  authenticatedJsonFetch(url, data, 'POST');

/**
 * Shorthand for authenticated PUT requests with JSON data
 */
export const authenticatedPut = (url: string, data: any) => 
  authenticatedJsonFetch(url, data, 'PUT');

/**
 * Shorthand for authenticated DELETE requests
 */
export const authenticatedDelete = (url: string, data?: any) => 
  data ? authenticatedJsonFetch(url, data, 'DELETE') : authenticatedFetch(url, { method: 'DELETE' });