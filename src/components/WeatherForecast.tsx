import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Thermometer, 
  Droplets, 
  Wind, 
  RefreshCw, 
  AlertCircle,
  MapPin,
  CalendarDays
} from 'lucide-react';

interface WeatherForecastProps {
  destination: string;
  startDate: string;
  endDate: string;
  themeAccent: string;
  themeBg: string;
  themeAccentLight: string;
  themeAccentBorder: string;
  activeDayIndex: number;
}

interface DailyForecastItem {
  dateString: string;
  formattedDay: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitation: number;
}

interface WeatherState {
  resolvedName: string;
  currentTemp: number;
  currentCode: number;
  currentWind: number;
  daily: DailyForecastItem[];
}

export default function WeatherForecast({
  destination,
  startDate,
  endDate,
  themeAccent,
  themeBg,
  themeAccentLight,
  themeAccentBorder,
  activeDayIndex
}: WeatherForecastProps) {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Map Open-Meteo weather codes to Lucide icons and descriptive strings
  const getWeatherDetails = (code: number) => {
    // Reference: https://open-meteo.com/en/docs
    if (code === 0) return { icon: <Sun className="w-5 h-5" />, label: 'Clear Sky', color: 'text-amber-500' };
    if (code === 1 || code === 2 || code === 3) return { icon: <CloudSun className="w-5 h-5" />, label: 'Partly Cloudy', color: 'text-sky-500' };
    if (code === 45 || code === 48) return { icon: <CloudFog className="w-5 h-5" />, label: 'Foggy Weather', color: 'text-slate-400' };
    if (code >= 51 && code <= 57) return { icon: <CloudDrizzle className="w-5 h-5" />, label: 'Light Drizzle', color: 'text-blue-400' };
    if (code >= 61 && code <= 67) return { icon: <CloudRain className="w-5 h-5" />, label: 'Rainy Showers', color: 'text-blue-500' };
    if (code >= 71 && code <= 77) return { icon: <CloudSnow className="w-5 h-5" />, label: 'Snowfall', color: 'text-indigo-300' };
    if (code >= 80 && code <= 82) return { icon: <CloudRain className="w-5 h-5" />, label: 'Heavy Showers', color: 'text-blue-600' };
    if (code === 85 || code === 86) return { icon: <CloudSnow className="w-5 h-5" />, label: 'Snow Showers', color: 'text-indigo-400' };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning className="w-5 h-5" />, label: 'Thunderstorms', color: 'text-amber-600' };
    return { icon: <Cloud className="w-5 h-5" />, label: 'Cloudy', color: 'text-slate-500' };
  };

  const fetchWeather = async () => {
    if (!destination) return;
    setLoading(true);
    setError('');

    try {
      // 1. Resolve Destination to Coordinates via Geocoding API
      let searchName = destination;
      let geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`;
      let geoResponse = await fetch(geoUrl);
      if (!geoResponse.ok) throw new Error('Geocoding service unavailable');
      
      let geoData = await geoResponse.json();
      if ((!geoData.results || geoData.results.length === 0) && destination.includes(',')) {
        // Fallback to searching the first component before the comma (e.g. "Istanbul")
        searchName = destination.split(',')[0].trim();
        geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`;
        const fallbackResponse = await fetch(geoUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.results && fallbackData.results.length > 0) {
            geoData = fallbackData;
          }
        }
      }

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location '${destination}' not found on weather registry.`);
      }

      const location = geoData.results[0];
      const { latitude, longitude, name, country } = location;
      const resolvedName = [name, country].filter(Boolean).join(', ');

      // 2. Fetch Forecast from Open-Meteo
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error('Weather forecast service unavailable');

      const forecastData = await forecastResponse.json();
      const current = forecastData.current_weather;
      const dailyData = forecastData.daily;

      // Parse the 7-day forecast
      const dailyItems: DailyForecastItem[] = [];
      if (dailyData && dailyData.time) {
        for (let i = 0; i < dailyData.time.length; i++) {
          const rawDate = dailyData.time[i];
          const dateObj = new Date(rawDate.replace(/-/g, '/'));
          const formattedDay = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          
          dailyItems.push({
            dateString: rawDate,
            formattedDay,
            tempMax: dailyData.temperature_2m_max[i],
            tempMin: dailyData.temperature_2m_min[i],
            weatherCode: dailyData.weathercode[i],
            precipitation: dailyData.precipitation_sum[i] || 0
          });
        }
      }

      setWeather({
        resolvedName,
        currentTemp: current.temperature,
        currentCode: current.weathercode,
        currentWind: current.windspeed,
        daily: dailyItems
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve weather data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [destination]);

  if (loading) {
    return (
      <div className="bg-white border border-[#EFE9E2] rounded-[1.8rem] p-6 shadow-xs animate-pulse flex flex-col justify-center items-center min-h-[140px] font-sans">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-400 mb-2" />
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Loading Weather Forecast...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#EFE9E2] rounded-[1.8rem] p-5 shadow-xs flex items-center justify-between font-sans">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Weather Unavailable</span>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchWeather}
          className="p-2 border border-[#EFE9E2] hover:bg-slate-50 rounded-xl transition-all text-slate-500 cursor-pointer"
          title="Retry loading weather"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const currentDetails = getWeatherDetails(weather.currentCode);

  // Let's check if we can display weather for the trip dates.
  // We'll generate the days array of the trip and try to match it with the returned daily forecast times.
  const activeDayDateStr = (() => {
    const startDt = new Date(startDate.replace(/-/g, '/'));
    if (isNaN(startDt.getTime())) return '';
    startDt.setDate(startDt.getDate() + activeDayIndex);
    const year = startDt.getFullYear();
    const month = String(startDt.getMonth() + 1).padStart(2, '0');
    const day = String(startDt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const activeDayForecast = weather.daily.find(item => item.dateString === activeDayDateStr);
  const activeDayDetails = activeDayForecast ? getWeatherDetails(activeDayForecast.weatherCode) : null;

  return (
    <div className="bg-white border border-[#EFE9E2] rounded-[1.8rem] overflow-hidden shadow-xs font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#EFE9E2]/60">
        
        {/* Left Side: Destination Overview & Current Weather */}
        <div className="p-6 md:col-span-5 flex flex-col justify-between">
          <div>
            {/* Header: Destination Pin */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin size={12} style={{ color: themeAccent }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Local Weather Overview</span>
            </div>
            
            <h3 className="font-serif italic font-bold text-slate-900 text-lg mt-1 tracking-tight">
              {weather.resolvedName}
            </h3>
            
            <div className="mt-4 flex items-center gap-4">
              <div className="p-3 bg-slate-50 border border-[#EFE9E2]/40 rounded-2xl flex-shrink-0">
                <span className={currentDetails.color}>
                  {currentDetails.icon}
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 flex items-start">
                  {weather.currentTemp}
                  <span className="text-base font-medium text-slate-500 mt-1">°C</span>
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {currentDetails.label}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 pt-4 border-t border-[#EFE9E2]/60 flex items-center gap-5 text-[10px] font-bold text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <Thermometer size={12} className="text-slate-400" />
              <span>CURRENT TEMP</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind size={12} className="text-slate-400" />
              <span>{weather.currentWind} km/h WIND</span>
            </div>
          </div>
        </div>

        {/* Right Side: 7-Day Forecast or Trip Dates match */}
        <div className="p-6 md:col-span-7 flex flex-col justify-between bg-[#FCFAF8]/60">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={11} style={{ color: themeAccent }} /> 7-Day Destination Forecast
              </span>
              {activeDayForecast && (
                <span 
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: themeAccentLight,
                    borderColor: themeAccentBorder,
                    color: themeAccent
                  }}
                >
                  Day {activeDayIndex + 1} Selected
                </span>
              )}
            </div>

            {/* Daily Scrollable List */}
            <div className="space-y-2.5 max-h-[145px] overflow-y-auto pr-1">
              {weather.daily.map((day) => {
                const dayDetails = getWeatherDetails(day.weatherCode);
                const isSelectedDay = day.dateString === activeDayDateStr;
                return (
                  <div 
                    key={day.dateString}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-300 ${
                      isSelectedDay 
                        ? 'bg-white shadow-xs' 
                        : 'bg-transparent border-transparent'
                    }`}
                    style={isSelectedDay ? { borderColor: themeAccentBorder } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1 bg-white border border-[#EFE9E2]/40 rounded-lg shadow-2xs ${dayDetails.color}`}>
                        {dayDetails.icon}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 leading-none">
                          {day.formattedDay}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          {dayDetails.label}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      {day.precipitation > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] font-bold font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">
                          <Droplets size={10} />
                          <span>{day.precipitation}mm</span>
                        </div>
                      )}
                      <div className="text-[11px] font-bold font-mono text-slate-800 leading-none">
                        {day.tempMax}° / <span className="text-slate-400">{day.tempMin}°</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecast Context notice */}
          <div className="mt-4 pt-3.5 border-t border-[#EFE9E2]/60 text-[10px] text-slate-400 leading-normal font-sans">
            {activeDayForecast && activeDayDetails ? (
              <span>
                On <strong>{activeDayForecast.formattedDay} (Day {activeDayIndex + 1})</strong>, expect <strong>{activeDayDetails.label}</strong> with temperature highs of {activeDayForecast.tempMax}°C and {activeDayForecast.precipitation > 0 ? `around ${activeDayForecast.precipitation}mm of precipitation.` : 'no expected precipitation.'}
              </span>
            ) : (
              <span>
                Daily forecast conditions are pulled dynamically from Open-Meteo. Select days of your trip soon to see matching scheduled temperatures.
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
