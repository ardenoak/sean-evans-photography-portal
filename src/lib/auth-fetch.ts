/**
 * Secure client-side fetch utility for API calls
 * 
 * This utility provides secure client-side API calls without exposing
 * API keys to the browser. Authentication is handled server-side by
 * Next.js middleware and API routes.
 */

/**
 * Authenticated fetch wrapper for client-side API calls
 * 
 * @param url - The URL to fetch from
 * @param options - Standard fetch options (method, body, etc.)
 * @returns Promise<Response>
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Add credentials to include session cookies for server-side authentication
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  return fetch(url, defaultOptions);
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