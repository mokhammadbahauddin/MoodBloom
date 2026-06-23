// Strava Integration Service
const CLIENT_ID = (import.meta as any).env?.VITE_STRAVA_CLIENT_ID || "233128";

/**
 * Initiates the Strava OAuth 2.0 Authorization Code Flow.
 * Redirects the user to Strava's consent screen.
 */
export function initiateStravaAuth() {
  const redirectUri = `${window.location.origin}/`; // Redirects back to homepage
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=activity:read_all&approval_prompt=force`;

  window.location.href = authUrl;
}

interface StravaActivity {
  id: number;
  type: string;
  distance: number; // in meters
  elapsed_time: number; // in seconds
  start_date_local: string;
}

/**
 * Fetches the user's activities from Strava for today.
 * Converts distance of walking/running activities into steps.
 * @param accessToken The OAuth2 access token.
 */
export async function fetchStravaSteps(accessToken: string): Promise<{ steps: number; distance: number }> {
  try {
    // Start of today in ISO format (or just filter locally)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayMidnight = new Date(todayStr).getTime() / 1000; // Unix timestamp in seconds

    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${todayMidnight}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch Strava activities");

    const activities: StravaActivity[] = await response.json();
    let totalSteps = 0;
    let totalDistance = 0; // in meters

    activities.forEach((activity) => {
      // Standardize types
      const type = activity.type.toLowerCase();
      totalDistance += activity.distance;

      // Estimate steps only for walk, run, hike
      if (type === "run" || type === "walk" || type === "hike") {
        // Average step size is roughly 0.76 meters.
        // steps = distance_in_meters / 0.76
        const steps = Math.round(activity.distance / 0.76);
        totalSteps += steps;
      }
    });

    return {
      steps: totalSteps,
      distance: Math.round((totalDistance / 1000) * 100) / 100, // round to 2 decimal places in km
    };
  } catch (error) {
    console.error("Strava Fetch Error:", error);
    return { steps: 0, distance: 0 };
  }
}
