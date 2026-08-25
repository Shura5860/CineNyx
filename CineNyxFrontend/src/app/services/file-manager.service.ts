import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl, API_ENDPOINTS } from '../config/api';

/* ---- Shared interfaces ---- */

export interface ContentDto {
  _id: string;
  id?: string;
  title: string;
  originalTitle?: string;
  description?: string;
  shortDescription?: string;
  contentType: 'movie' | 'serie';
  serieId?: string;
  season?: number;
  episode?: number;
  status: 'draft' | 'published';
  videoPath?: string | null;
  video_url_1080?: string;
  hls_url?: string;
  imagePath?: string;
  poster_url?: string;
  slug?: string;
}

export interface SoundOption {
  _id: string;
  filmId: string;
  language: string;
  path: string;
}

export interface SubtitleOption {
  _id: string;
  filmId: string;
  language: string;
  path: string;
}

export interface EpisodeCreatePayload {
  serieId: string;
  title: string;
  season: number;
  episode: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class FileManagerService {

  constructor(private http: HttpClient) {}

  /* ---- Content ---- */

  getContentById(id: string): Observable<ContentDto> {
    return this.http.get<ContentDto>(apiUrl(API_ENDPOINTS.content.byId(id)));
  }

  /* ---- Episodes (serie) ---- */

  getEpisodesBySerie(serieId: string): Observable<ContentDto[]> {
    return this.http.get<ContentDto[]>(
      apiUrl(`${API_ENDPOINTS.content.episodesBySerie}/${serieId}`)
    );
  }

  createEpisode(payload: EpisodeCreatePayload): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.content.addepisode), payload);
  }

  deleteEpisode(id: string): Observable<any> {
    return this.http.delete(apiUrl(API_ENDPOINTS.content.delete(id)));
  }

  /* ---- Video ---- */

  uploadVideo(contentId: string, file: File, extractAudio: boolean = false, audioLanguage: string = ''): Observable<any> {
    const fd = new FormData();
    fd.append('video', file);
    if (extractAudio && audioLanguage) {
      fd.append('extractAudio', 'true');
      fd.append('audioLanguage', audioLanguage);
    }
    return this.http.post(apiUrl(API_ENDPOINTS.content.video(contentId)), fd);
  }

  /* ---- Sound Options ---- */

  getSoundOptions(filmId: string): Observable<SoundOption[]> {
    return this.http.get<SoundOption[]>(
      apiUrl(`${API_ENDPOINTS.soundoptions.film}/${filmId}`)
    );
  }

  createSoundOption(filmId: string, language: string): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.soundoptions.create), { filmId, language });
  }

  uploadSound(optionId: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('audio', file);
    return this.http.post(apiUrl(API_ENDPOINTS.soundoptions.upload(optionId)), fd);
  }

  uploadSoundFromVideo(optionId: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('video', file);
    return this.http.post(apiUrl(API_ENDPOINTS.soundoptions.uploadFromVideo(optionId)), fd);
  }

  deleteSound(optionId: string): Observable<any> {
    return this.http.delete(apiUrl(API_ENDPOINTS.soundoptions.delete(optionId)));
  }

  /* ---- Subtitle Options ---- */

  getSubtitleOptions(filmId: string): Observable<SubtitleOption[]> {
    return this.http.get<SubtitleOption[]>(
      apiUrl(`${API_ENDPOINTS.subtitleoptions.film}/${filmId}`)
    );
  }

  createSubtitleOption(filmId: string, language: string): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.subtitleoptions.create), { filmId, language });
  }

  uploadSubtitle(optionId: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('subtitle', file);
    return this.http.post(apiUrl(API_ENDPOINTS.subtitleoptions.upload(optionId)), fd);
  }

  deleteSubtitle(optionId: string): Observable<any> {
    return this.http.delete(apiUrl(API_ENDPOINTS.subtitleoptions.delete(optionId)));
  }

  /* ---- OpenSubtitles ---- */

  searchOpenSubtitles(filmId: string, languages?: string): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.opensubtitles.search), { filmId, languages });
  }

  importOpenSubtitle(fileId: number, filmId: string, language: string): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.opensubtitles.import), { fileId, filmId, language });
  }

  /* ---- Publish ---- */

  publishContent(id: string): Observable<any> {
    return this.http.post(apiUrl(API_ENDPOINTS.content.publish(id)), {});
  }
}
