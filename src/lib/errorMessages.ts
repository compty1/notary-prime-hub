// Centralized mapping of common Supabase/API error codes to user-friendly messages

const errorMap: Record<string, string> = {
  // Auth errors
  "Invalid login credentials": "Incorrect email or password. Please try again.",
  "Email not confirmed": "Please check your email and confirm your account before signing in.",
  "User already registered": "An account with this email already exists. Try signing in instead.",
  "Password should be at least 6 characters": "Your password must be at least 6 characters long.",
  "Signup requires a valid password": "Please enter a valid password.",
  "Email rate limit exceeded": "Too many attempts. Please wait a few minutes before trying again.",
  "For security purposes, you can only request this after": "Please wait before requesting another email.",

  // Database errors
  "new row violates row-level security policy": "You don't have permission to perform this action.",
  "duplicate key value violates unique constraint": "This record already exists.",
  "violates foreign key constraint": "This record references data that doesn't exist.",
  "null value in column": "A required field is missing. Please fill in all required fields.",

  // Network errors
  "Failed to fetch": "Unable to connect to the server. Please check your internet connection.",
  "NetworkError": "Network connection lost. Please check your internet and try again.",
  "FetchError": "Connection error. Please try again in a moment.",
  "TypeError: Failed to fetch": "Connection lost. Please check your internet and refresh.",

  // Storage errors
  "The resource already exists": "A file with this name already exists. Please rename and try again.",
  "Payload too large": "The file is too large. Maximum file size is 20MB.",
  "new row violates row-level security policy for table \"documents\"": "You don't have permission to upload documents. Please sign in.",

  // Rate limiting
  "rate limit": "You're making requests too quickly. Please wait a moment.",
};

export function getUserFriendlyError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = typeof error === "string" ? error : error.message || error.error_description || "";

  // Check exact matches first
  if (errorMap[message]) return errorMap[message];

  // Check partial matches
  for (const [key, friendly] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }

  // Generic fallbacks by error type
  if (message.includes("401") || message.includes("unauthorized")) {
    return "Your session has expired. Please sign in again.";
  }
  if (message.includes("403") || message.includes("forbidden")) {
    return "You don't have permission to perform this action.";
  }
  if (message.includes("404")) {
    return "The requested resource was not found.";
  }
  if (message.includes("500") || message.includes("internal")) {
    return "Something went wrong on our end. Please try again shortly.";
  }
  if (message.includes("timeout")) {
    return "The request timed out. Please try again.";
  }

  return message || "An unexpected error occurred. Please try again.";
}
