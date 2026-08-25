// API Base URL can be configured at runtime via window.__env or fallback to localhost
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__env?.API_BASE_URL) {
    return (window as any).__env.API_BASE_URL;
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    user: '/auth/user',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  upload: {
    image: '/upload/film-image',
    avatar: '/upload/avatar',
    subtitle: '/upload/subtitle',
    audio: '/upload/audio',
  },
  agerating: '/agerating',
  country: '/country',
  kinds: '/kinds',
  soundoptions: {
    create: '/soundoptions',
    film: '/soundoptions/film',
    upload: (id: string) => `/soundoptions/${id}/upload`,
    uploadFromVideo: (id: string) => `/soundoptions/${id}/upload-from-video`,
    delete: (id: string) => `/soundoptions/${id}`,
  },
  subtitleoptions: {
    create: '/subtitleoptions',
    film: '/subtitleoptions/film',
    upload: (id: string) => `/subtitleoptions/${id}/upload`,
    delete: (id: string) => `/subtitleoptions/${id}`,
  },
  content: {
    main: '/content',
    byId: (id: string) => `/content/id/${id}`,
    addepisode: '/content/episode',
    search: '/content/search',
    addAutoImport: '/content/importtmdb',
    episodesBySerie: '/content/episodes',
    video: (id: string) => `/content/${id}/video`,
    cover: (id: string) => `/content/${id}/cover`,
    publish: (id: string) => `/content/${id}/publish`,
    update: (id: string) => `/content/${id}`,
    delete: (id: string) => `/content/${id}`,
  },
  comments: {
    main: '/comments',
    byContent: '/comments/content'
  },
  opensubtitles: {
    search: '/opensubtitles/search',
    import: '/opensubtitles/import',
  },
  users: {
    list: '/users',
    stats: '/users/stats',
    byId: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    updateRole: (id: string) => `/users/${id}/role`,
    toggleBlock: (id: string) => `/users/${id}/block`,
    delete: (id: string) => `/users/${id}`,
  },
  health: '/health',
} as const;

export function apiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
