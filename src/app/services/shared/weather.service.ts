import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { WeatherDashboardDto, WeatherForecastDay } from '../../models/weather';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

interface Coordinates {
  latitude: number;
  longitude: number;
  location: string;
  isApproximate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private static readonly FORECAST_DAYS = 7;

  constructor(private api: BaseApiService) {}

  getWeatherDashboard(latitude?: number, longitude?: number): Observable<WeatherDashboardDto> {
    return this.resolveCoordinates(latitude, longitude).pipe(
      switchMap(coords => {
        if (!coords) {
          return of(this.locationUnavailableDto());
        }
        return this.getWeatherDashboardWithCoords(coords);
      })
    );
  }

  getWeatherDashboardByAddress(address: string): Observable<WeatherDashboardDto> {
    const trimmed = address?.trim();
    if (!trimmed) {
      return of(this.locationUnavailableDto());
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;

    return this.fetchJson(url).pipe(
      map((response: any) => {
        const result = response?.results?.[0];
        if (!result) {
          return null;
        }

        return {
          latitude: Number(result.latitude ?? 0),
          longitude: Number(result.longitude ?? 0),
          location: this.formatGeocodeLocation(result),
          isApproximate: false
        } as Coordinates;
      }),
      switchMap(coords => coords ? this.getWeatherDashboardWithCoords(coords) : of(this.locationUnavailableDto())),
      catchError(() => of(this.locationUnavailableDto()))
    );
  }

  private locationUnavailableDto(): WeatherDashboardDto {
    return {
      location: '',
      isApproximate: false,
      currentTempF: 0,
      currentCondition: 'unavailable',
      currentIconClass: 'pi pi-map-marker',
      forecast: []
    };
  }

  private loadOpenMeteoWeather(coords: Coordinates): Observable<WeatherDashboardDto> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
      '&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto';

    return this.fetchJson(url).pipe(
      map((response: any) => {
        const currentWeather = response?.current_weather;
        const daily = response?.daily;

        if (!currentWeather || !daily) {
          throw new Error('Invalid weather payload');
        }

        const currentCode = Number(currentWeather.weathercode ?? 0);
        const forecast: WeatherForecastDay[] = (daily.time ?? [])
          .slice(0, WeatherService.FORECAST_DAYS)
          .map((day: string, index: number) => {
          const weatherCode = Number(daily.weathercode?.[index] ?? 0);
          const highC = Number(daily.temperature_2m_max?.[index] ?? 0);
          const lowC = Number(daily.temperature_2m_min?.[index] ?? 0);
          const precipitationChance = Math.round(Number(daily.precipitation_probability_max?.[index] ?? 0));

          return {
            date: day,
            highTempF: this.celsiusToFahrenheit(highC),
            lowTempF: this.celsiusToFahrenheit(lowC),
            precipitationChance,
            weatherCode,
            condition: this.getWeatherLabel(weatherCode),
            iconClass: this.getWeatherIconClass(weatherCode)
          };
        });

        return {
          location: coords.location,
          isApproximate: coords.isApproximate,
          currentTempF: this.celsiusToFahrenheit(Number(currentWeather.temperature ?? 0)),
          currentCondition: this.getWeatherLabel(currentCode),
          currentIconClass: this.getWeatherIconClass(currentCode),
          forecast
        };
      }),
      catchError(() =>
        of({
          location: 'Local area',
          isApproximate: true,
          currentTempF: 0,
          currentCondition: 'Unavailable',
          currentIconClass: 'pi pi-cloud',
          forecast: []
        })
      )
    );
  }

  private getWeatherDashboardWithCoords(coords: Coordinates): Observable<WeatherDashboardDto> {
    return this.api
      .get<any>('weather/forecast', {
        lat: coords.latitude,
        lon: coords.longitude,
        days: WeatherService.FORECAST_DAYS
      })
      .pipe(
        map(apiPayload => this.mapToDashboardDto(apiPayload, coords)),
        catchError(() => this.loadOpenMeteoWeather(coords))
      );
  }

  private mapToDashboardDto(payload: any, coords: Coordinates): WeatherDashboardDto {
    if (payload?.forecast && payload?.currentTempF !== undefined) {
      return {
        location: payload.location || coords.location,
        isApproximate: payload.isApproximate ?? coords.isApproximate,
        currentTempF: Number(payload.currentTempF ?? 0),
        currentCondition: payload.currentCondition || 'Weather update',
        currentIconClass: payload.currentIconClass || 'pi pi-cloud',
        forecast: payload.forecast ?? []
      };
    }

    const current = payload?.current_weather;
    const daily = payload?.daily;

    if (!current || !daily || !Array.isArray(daily?.time)) {
      throw new Error('Unsupported weather response shape');
    }

    const currentCode = Number(current.weathercode ?? 0);
    const forecast: WeatherForecastDay[] = daily.time
      .slice(0, WeatherService.FORECAST_DAYS)
      .map((day: string, index: number) => {
      const weatherCode = Number(daily.weathercode?.[index] ?? 0);
      const highC = Number(daily.temperature_2m_max?.[index] ?? 0);
      const lowC = Number(daily.temperature_2m_min?.[index] ?? 0);
      const precipitationChance = Math.round(Number(daily.precipitation_probability_max?.[index] ?? 0));

      return {
        date: day,
        highTempF: this.celsiusToFahrenheit(highC),
        lowTempF: this.celsiusToFahrenheit(lowC),
        precipitationChance,
        weatherCode,
        condition: this.getWeatherLabel(weatherCode),
        iconClass: this.getWeatherIconClass(weatherCode)
      };
    });

    return {
      location: coords.location,
      isApproximate: coords.isApproximate,
      currentTempF: this.celsiusToFahrenheit(Number(current.temperature ?? 0)),
      currentCondition: this.getWeatherLabel(currentCode),
      currentIconClass: this.getWeatherIconClass(currentCode),
      forecast
    };
  }

  private resolveCoordinates(latitude?: number, longitude?: number): Observable<Coordinates | null> {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return of({
        latitude,
        longitude,
        location: 'Current location',
        isApproximate: false
      });
    }

    return of(null);
  }

  private fetchJson(url: string): Observable<any> {
    return new Observable(observer => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private formatGeocodeLocation(result: any): string {
    const parts = [result?.name, result?.admin1, result?.country]
      .map((part: string | undefined) => (part ?? '').trim())
      .filter(Boolean);
    return parts.join(', ') || 'Job location';
  }

  private celsiusToFahrenheit(value: number): number {
    return Math.round((value * 9) / 5 + 32);
  }

  private getWeatherLabel(code: number): string {
    if (code === 0) return 'Clear';
    if ([1, 2, 3].includes(code)) return 'Partly cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
    if ([71, 73, 75, 77].includes(code)) return 'Snow';
    if ([80, 81, 82].includes(code)) return 'Rain showers';
    if ([85, 86].includes(code)) return 'Snow showers';
    if ([95, 96, 99].includes(code)) return 'Thunderstorms';
    return 'Weather update';
  }

  private getWeatherIconClass(code: number): string {
    if (code === 0) return 'pi pi-sun';
    if ([1, 2, 3, 45, 48].includes(code)) return 'pi pi-cloud';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'pi pi-cloud-rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'pi pi-sparkles';
    if ([95, 96, 99].includes(code)) return 'pi pi-bolt';
    return 'pi pi-cloud';
  }
}
