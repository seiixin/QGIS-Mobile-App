export const API_BASE_URL = 'https://qgis.gghsoftware.tech/api';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveApiUrl(path = '') {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
