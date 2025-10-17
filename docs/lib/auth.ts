import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Fused Key Authentication System
interface AuthKey {
  key: string;
  timestamp: number;
  used: boolean;
}

// Store used keys in memory (in production, use Redis or database)
const usedKeys = new Map<string, AuthKey>();

// Generate a fused authentication key
export function generateAuthKey(): string {
  const key = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  
  usedKeys.set(key, {
    key,
    timestamp,
    used: false
  });
  
  // Clean up old keys (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const keysToDelete: string[] = [];
  
  usedKeys.forEach((v, k) => {
    if (v.timestamp < oneHourAgo) {
      keysToDelete.push(k);
    }
  });
  
  keysToDelete.forEach(k => usedKeys.delete(k));
  
  return key;
}

// Validate and consume an authentication key
export function validateAndConsumeAuthKey(key: string): boolean {
  const authKey = usedKeys.get(key);
  
  if (!authKey) {
    return false; // Key not found
  }
  
  if (authKey.used) {
    return false; // Key already used
  }
  
  // Check if key is expired (1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  if (authKey.timestamp < oneHourAgo) {
    usedKeys.delete(key);
    return false; // Key expired
  }
  
  // Mark key as used
  authKey.used = true;
  usedKeys.set(key, authKey);
  
  return true;
}

// Authenticated fetch wrapper
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authKey = generateAuthKey();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Key': authKey,
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

// Middleware for API route authentication
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const authKey = request.headers.get('X-Auth-Key');
    
    if (!authKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!validateAndConsumeAuthKey(authKey)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired authentication key' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, ...args);
  };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier.toLowerCase();
  
  let rateLimitData = rateLimitMap.get(key);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    // Reset or create new rate limit data
    rateLimitData = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  
  rateLimitData.count++;
  rateLimitMap.set(key, rateLimitData);
  
  const remaining = Math.max(0, maxRequests - rateLimitData.count);
  const allowed = rateLimitData.count <= maxRequests;
  
  return {
    allowed,
    remaining,
    resetTime: rateLimitData.resetTime
  };
}
