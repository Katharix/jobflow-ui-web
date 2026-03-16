export interface WeatherForecastDay {
  date: string;
  highTempF: number;
  lowTempF: number;
  precipitationChance: number;
  weatherCode: number;
  condition: string;
  iconClass: string;
}

export interface WeatherDashboardDto {
  location: string;
  isApproximate: boolean;
  currentTempF: number;
  currentCondition: string;
  currentIconClass: string;
  forecast: WeatherForecastDay[];
}
