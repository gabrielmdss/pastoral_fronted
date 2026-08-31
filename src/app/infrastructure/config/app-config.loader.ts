import type { AppConfig } from './app-config';
export async function loadAppConfig(): Promise<AppConfig> {
  const response = await fetch('/config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('APP_CONFIG_UNAVAILABLE');
  const value: unknown = await response.json();
  if (!isAppConfig(value)) throw new Error('APP_CONFIG_INVALID');
  return { apiBaseUrl: value.apiBaseUrl.replace(/\/$/, '') };
}
function isAppConfig(value: unknown): value is AppConfig {
  return typeof value === 'object' && value !== null && 'apiBaseUrl' in value && typeof value.apiBaseUrl === 'string' && /^https?:\/\//.test(value.apiBaseUrl);
}
