export const environment = {
  production: true,
  apiUrl: (window as any)['env']?.['apiUrl'] ?? '',
  wsUrl: (window as any)['env']?.['wsUrl'] ?? '',
  googleMapsApiKey: (window as any)['env']?.['googleMapsApiKey'] ?? '',
};