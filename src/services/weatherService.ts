/**
 * Weather Service
 * Powered by Open-Meteo (Free, No API Key Required)
 */

export interface WeatherData {
  temperature: number;
  conditionCode: number;
  isHot: boolean;
  city: string | null;
}

export async function getCurrentWeather(): Promise<WeatherData | null> {
  try {
    // 1. Get Geolocation
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });

    const { latitude, longitude } = position.coords;

    // 2. Fetch from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data?.current_weather) return null;

    const temp = data.current_weather.temperature;
    
    return {
      temperature: temp,
      conditionCode: data.current_weather.weathercode,
      isHot: temp >= 30,
      city: null // Open-Meteo doesn't provide city name directly without reverse geocoding
    };
  } catch (error) {
    console.error("Weather Service Error:", error);
    return null;
  }
}
