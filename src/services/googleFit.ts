import { getTodayDateString } from "../lib/dateUtils";

// Google Fit Integration Service
// Required Scopes: activity.read
const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read";

/**
 * Initiates the Google OAuth 2.0 Implicit Flow.
 * Redirects the user to Google's consent screen.
 */
export async function initiateGoogleFitAuth() {
  const redirectUri = window.location.origin;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true&prompt=consent`;
  
  window.location.href = authUrl;
}

/**
 * Fetches the total step count for the current day from the Google Fit API.
 * @param accessToken The OAuth2 access token.
 */
export async function fetchGoogleFitSteps(accessToken: string): Promise<number> {
  const startTimeMillis = new Date().setHours(0, 0, 0, 0); // Start of today
  const endTimeMillis = new Date().getTime(); // Now
  
  // Google Fit uses nanoseconds for the dataset ID
  const datasetId = `${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`;
  const dataSourceId = "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps";
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataSources/${dataSourceId}/datasets/${datasetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) throw new Error("Failed to fetch steps");
    
    const data = await response.json();
    let totalSteps = 0;
    
    if (data.point) {
      data.point.forEach((point: any) => {
        if (point.value && point.value[0]) {
          totalSteps += point.value[0].intVal || 0;
        }
      });
    }
    
    return totalSteps;
  } catch (error) {
    console.error("Google Fit Error:", error);
    return 0;
  }
}
