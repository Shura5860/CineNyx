import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { apiUrl, API_ENDPOINTS } from '../config/api';
import { AuthService } from '../services/auth';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

declare var SakuraPlayer: any;

interface Comment {
  _id: string;
  text: string;
  userId: {
    _id: string;
    username: string;
  } | null;
  likes: number;
  dislikes: number;
  createdAt: string;
}

interface Episode {
  _id: string;
  title: string;
  season: number;
  episode: number;
  imagePath?: string;
  description?: string;
}

interface SeasonGroup {
  season: number;
  episodes: Episode[];
}

interface SoundOption {
  _id: string;
  language: string;
  path: string;
}

interface SubtitleOption {
  _id: string;
  language: string;
  path: string;
}

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TextareaModule, ButtonModule, AvatarModule],
  templateUrl: './player.html',
  styleUrls: ['./player.css']
})
export class Player implements OnInit, AfterViewInit, OnDestroy {
  filmId: string = '';
  videoUrl360 = '';
  videoUrl480 = '';
  videoUrl720 = '';
  videoUrl1080 = '';
  hlsUrl = '';
  posterUrl = '';
  subtitleTr = '';
  subtitleEn = '';
  defaultSub = 'off';
  loading = true;
  
  // Film bilgileri
  filmTitle: string = '';
  filmDescription: string = '';
  filmYear: number = 0;
  filmImdb: number = 0;
  filmGenres: any[] = [];
  contentType: string = 'movie';
  serieId: string | null = null;
  
  // Dizi bölümleri
  episodes: Episode[] = [];
  seasonGroups: SeasonGroup[] = [];
  isSeries: boolean = false;
  
  // Yorumlar
  comments: Comment[] = [];
  newCommentText: string = '';
  isSubmittingComment: boolean = false;
  currentUser: any = null;

  // Ses ve Altyazı seçenekleri
  soundOptions: SoundOption[] = [];
  subtitleOptions: SubtitleOption[] = [];
  selectedSoundIndex: number = -1; // -1 = orijinal ses
  audioElement: HTMLAudioElement | null = null;
  private videoSyncHandlers: { event: string; handler: EventListener }[] = [];
  private driftCheckInterval: ReturnType<typeof setInterval> | null = null;
  private static readonly DRIFT_THRESHOLD = 0.08; // 80ms üzeri fark varsa düzelt
  private static readonly DRIFT_CHECK_MS = 500;   // 500ms'de bir kontrol et

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    console.log('Player component constructor çalıştı');
    this.currentUser = this.authService.getUser();
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit() {
    console.log('ngOnInit çalıştı');
    
    this.route.paramMap.subscribe(params => {
      this.filmId = params.get('id') || '';
      console.log('Film ID:', this.filmId);
      
      if (!this.filmId) {
        console.error('Film ID yok!');
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }
      
      this.loadFilm(this.filmId);
    });
  }

  ngAfterViewInit() {
    console.log('AfterViewInit - Player başlatılıyor');
  }

  loadFilm(id: string) {
    // Tüm içerikleri al ve ID'ye göre filtrele (detaylı bilgiler için)
    const allContentUrl = apiUrl(API_ENDPOINTS.content.main);
    this.http.get<any[]>(allContentUrl).subscribe({
      next: (contents) => {
        const film = contents.find(c => c._id === id);
        if (film) {
          this.filmTitle = film.title || '';
          this.filmDescription = film.description || '';
          this.filmYear = film.releaseDate ? new Date(film.releaseDate).getFullYear() : 0;
          this.filmImdb = film.imdbScore || 0;
          this.filmGenres = film.categories || [];
          this.posterUrl = film.imagePath || '';
          this.contentType = film.contentType || 'movie';
          this.serieId = film.serieId || null;
          
          // Dizi kontrolü: contentType 'serie' ise ve serieId varsa dizi
          // VEYA episode ise (season/episode field'ları varsa) ve serieId varsa dizi
          const isEpisode = (film.season !== undefined && film.season !== null) || 
                           (film.episode !== undefined && film.episode !== null);
          this.isSeries = (this.contentType === 'serie' || isEpisode) && !!this.serieId;
          
          console.log('Film bilgileri:', {
            title: this.filmTitle,
            contentType: this.contentType,
            serieId: this.serieId,
            isEpisode,
            isSeries: this.isSeries,
            season: film.season,
            episode: film.episode
          });
          
          // Eğer dizi ise bölümleri yükle
          if (this.isSeries && this.serieId) {
            console.log('Bölümler yükleniyor, serieId:', this.serieId);
            this.loadEpisodes(this.serieId);
          } else {
            console.log('Dizi değil veya serieId yok, bölümler yüklenmeyecek');
            this.episodes = [];
            this.seasonGroups = [];
          }
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('İçerik bilgileri yüklenemedi:', err);
        // Detaylı bilgi yoksa devam et
      }
    });
    
    // Video bilgilerini al
    const url = apiUrl(`/content/id/${id}`);
    console.log('API isteği gönderiliyor:', url);
    
    this.http.get(url).subscribe({
      next: (film: any) => {
        console.log(' Backend yanıtı:', film);
        
        this.videoUrl360 = film.video_url_360 || '';
        this.videoUrl480 = film.video_url_480 || '';
        this.videoUrl720 = film.video_url_720 || '';
        this.videoUrl1080 = film.video_url_1080 || '';
        this.hlsUrl = film.hls_url || '';
        this.posterUrl = this.posterUrl || film.poster_url || '';
        this.subtitleTr = film.subtitle_tr || '';
        this.subtitleEn = film.subtitle_en || '';
        this.defaultSub = film.default_subtitle || 'off';
        
        // Ses ve altyazı seçeneklerini yükle
        this.soundOptions = (film.soundOptions || []).filter((s: SoundOption) => s.path);
        this.subtitleOptions = (film.subtitleOptions || []).filter((s: SubtitleOption) => s.path);
        this.selectedSoundIndex = -1;
        this.cleanupAudio();
        
        console.log('Video URL 1080:', this.videoUrl1080);
        
        this.loading = false;
        this.cdr.detectChanges();
        
        // Yorumları yükle
        this.loadComments(id);
        
        // DOM'un ve attribute'ların hazır olduğundan emin ol - daha uzun bekle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              const playerElement = document.querySelector('.sakura-player') as HTMLElement;
              if (!playerElement) {
                console.error('⚠️ SakuraPlayer elementi bulunamadı!');
                return;
              }
              // Attribute'ların set edildiğini kontrol et
              const hasData = playerElement.dataset['mp41080'] || playerElement.dataset['mp4720'] || playerElement.dataset['mp4480'] || playerElement.dataset['mp4360'];
              if (!hasData) {
                console.warn('⚠️ Player data attribute\'ları henüz set edilmemiş, component source ile deneniyor...');
                const source = this.buildSource();
                setTimeout(() => this.initializeSakuraPlayer(source), 300);
                return;
              }
              console.log('✅ Player elementi ve data attribute\'ları hazır');
              // Source'u component'ten ver – DOM dataset timing'e güvenme
              const source = this.buildSource();
              console.log('✅ Source component\'ten build edildi:', source);
              setTimeout(() => {
                this.initializeSakuraPlayer(source);
              }, 200);
            }, 150);
          });
        });
        
        console.log('Loading false oldu ve view güncellendi');
      },
      error: (err) => {
        console.error(' Video yüklenemedi:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getYear(releaseDate: string | undefined): string {
    if (!releaseDate) return '';
    const y = new Date(releaseDate).getFullYear();
    return isNaN(y) ? '' : String(y);
  }

  getGenreNames(categories: any[] | undefined): string {
    if (!categories?.length) return '';
    return categories.map((c: any) => c?.name || c).join(', ');
  }

  loadComments(contentId: string) {
    const url = apiUrl(`${API_ENDPOINTS.comments.byContent}/${contentId}`);
    this.http.get<Comment[]>(url).subscribe({
      next: (comments) => {
        this.comments = comments || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorumlar yüklenemedi:', err);
        this.comments = [];
      }
    });
  }

  submitComment() {
    if (!this.currentUser) {
      alert('Yorum yapmak için giriş yapmanız gerekiyor');
      return;
    }
    
    if (!this.newCommentText.trim()) {
      return;
    }
    
    this.isSubmittingComment = true;
    const url = apiUrl(API_ENDPOINTS.comments.main);
    const token = this.authService.getToken();
    
    this.http.post<Comment>(url, {
      contentId: this.filmId,
      text: this.newCommentText.trim(),
      token
    }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newCommentText = '';
        this.isSubmittingComment = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorum eklenemedi:', err);
        alert(err?.error?.message || 'Yorum eklenirken bir hata oluştu');
        this.isSubmittingComment = false;
      }
    });
  }

  deleteComment(commentId: string) {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    const token = this.authService.getToken();
    const url = apiUrl(`${API_ENDPOINTS.comments.main}/${commentId}${token ? `?token=${token}` : ''}`);
    
    this.http.delete(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c._id !== commentId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorum silinemedi:', err);
        alert(err?.error?.message || 'Yorum silinirken bir hata oluştu');
      }
    });
  }

  canDeleteComment(comment: Comment): boolean {
    if (!this.currentUser || !comment.userId) return false;
    return comment.userId._id === this.currentUser._id || this.currentUser.role === 'admin';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getCommentAvatarLabel(comment: Comment): string {
    const username = comment.userId?.username;
    if (username && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  }

  openAuthModal() {
    this.authService.openAuthModal(true);
  }

  loadEpisodes(serieId: string) {
    const url = apiUrl(`${API_ENDPOINTS.content.episodesBySerie}/${serieId}`);
    console.log('Episode API URL:', url);
    this.http.get<Episode[]>(url).subscribe({
      next: (episodes) => {
        console.log('Gelen episode\'lar:', episodes);
        this.episodes = episodes || [];
        console.log('Episode sayısı:', this.episodes.length);
        this.groupEpisodesBySeason();
        console.log('Season groups:', this.seasonGroups);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Bölümler yüklenemedi:', err);
        console.error('Hata detayları:', err);
        this.episodes = [];
        this.seasonGroups = [];
        this.cdr.detectChanges();
      }
    });
  }

  groupEpisodesBySeason() {
    const groups: { [key: number]: Episode[] } = {};
    
    console.log('Episode\'lar gruplanıyor, toplam:', this.episodes.length);
    
    this.episodes.forEach(ep => {
      const season = ep.season || 1;
      if (!groups[season]) {
        groups[season] = [];
      }
      groups[season].push(ep);
    });
    
    this.seasonGroups = Object.keys(groups)
      .map(season => ({
        season: parseInt(season),
        episodes: groups[parseInt(season)].sort((a, b) => (a.episode || 0) - (b.episode || 0))
      }))
      .sort((a, b) => a.season - b.season);
    
    console.log('Gruplanmış sezonlar:', this.seasonGroups.length);
    this.seasonGroups.forEach(sg => {
      console.log(`Sezon ${sg.season}: ${sg.episodes.length} bölüm`);
    });
  }

  selectEpisode(episode: Episode) {
    // Route'u güncelle ve yeni bölümü yükle
    this.router.navigate(['/film', episode._id], { replaceUrl: false }).then(() => {
      this.filmId = episode._id;
      this.loadFilm(episode._id);
      // Sayfayı yukarı kaydır
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  isCurrentEpisode(episode: Episode): boolean {
    return episode._id === this.filmId;
  }

  /** Source objesini component'teki URL'lerden oluştur – DOM dataset timing'e güvenmiyoruz */
  buildSource(): any {
    const mp4: any = {};
    if (this.videoUrl1080) mp4[1080] = this.videoUrl1080;
    if (this.videoUrl720) mp4[720] = this.videoUrl720;
    if (this.videoUrl480) mp4[480] = this.videoUrl480;
    if (this.videoUrl360) mp4[360] = this.videoUrl360;
    const subtitles: any[] = [];
    // API'den gelen altyazı seçeneklerini kullan
    if (this.subtitleOptions.length > 0) {
      this.subtitleOptions.forEach(sub => {
        if (sub.path) {
          subtitles.push({
            lang: sub.language.toLowerCase().substring(0, 2),
            label: sub.language,
            src: sub.path
          });
        }
      });
    } else {
      // Fallback: eski hardcoded alanlar
      if (this.subtitleTr) subtitles.push({ lang: 'tr', label: 'Türkçe', src: this.subtitleTr });
      if (this.subtitleEn) subtitles.push({ lang: 'en', label: 'English', src: this.subtitleEn });
    }
    return {
      poster: this.posterUrl || '',
      hls: this.hlsUrl || '',
      mp4,
      subtitles,
      defaultSub: (this.defaultSub || 'off').toLowerCase(),
      start: 0,
      thumbs: { sprite: '', vtt: '' },
      title: '',
      autoplay: false,
      mutedAutoplay: true
    };
  }

  /** SakuraPlayer'ın preferMp4Quality'si varsayılan 720 – bizde yoksa "no supported sources" oluyor. Mevcut kaliteyi döndür. */
  getPreferMp4Quality(): string {
    if (this.videoUrl1080) return '1080';
    if (this.videoUrl720) return '720';
    if (this.videoUrl480) return '480';
    if (this.videoUrl360) return '360';
    return '1080';
  }

  initializeSakuraPlayer(sourceFromComponent?: any) {
    console.log('🎬 SakuraPlayer başlatılıyor...');
    
    if (typeof SakuraPlayer === 'undefined') {
      console.error('❌ SakuraPlayer bulunamadı!');
      return;
    }
    
    const playerElements = document.querySelectorAll('.sakura-player');
    if (!playerElements || playerElements.length === 0) {
      console.error('❌ SakuraPlayer elementi DOM\'da bulunamadı!');
      return;
    }
    
    // Component'ten gelen source varsa onu kullan (DOM dataset'e güvenme)
    const source = sourceFromComponent || this.buildSource();
    console.log('✅ SakuraPlayer bulundu:', SakuraPlayer);
    console.log('✅ Player elementleri bulundu:', playerElements.length);
    console.log('🎬 Kullanılan source:', source);
    
    try {
      // Eski player'ları temizle
      playerElements.forEach((el: any) => {
        if (el._sakuraPlayer) {
          console.log('🧹 Eski player temizleniyor...');
          try {
            el._sakuraPlayer.destroy();
          } catch (e) {
            console.warn('⚠️ Eski player temizlenirken hata:', e);
          }
        }
        if (el.shadowRoot) {
          try {
            el.shadowRoot.innerHTML = '';
            const newEl = el.cloneNode(false);
            el.parentNode?.replaceChild(newEl, el);
            (playerElements as any)[playerElements.length] = newEl;
          } catch (e) {
            console.warn('⚠️ Shadow root temizlenirken hata:', e);
          }
        }
      });
      
      const instances: any[] = [];
      
      playerElements.forEach((el, index: number) => {
        try {
          let htmlEl = el as HTMLElement;
          if (!htmlEl.isConnected) {
            console.warn(`⚠️ Element ${index} DOM'a bağlı değil!`);
            return;
          }
          if (htmlEl.shadowRoot) {
            try {
              const parent = htmlEl.parentNode;
              const newEl = htmlEl.cloneNode(false) as HTMLElement;
              if (parent) {
                parent.replaceChild(newEl, htmlEl);
                htmlEl = newEl;
              }
            } catch (e) {
              console.error(`❌ Shadow root temizlenirken hata:`, e);
            }
          }
          const opts = { preferMp4Quality: this.getPreferMp4Quality() };
          const instance = SakuraPlayer.create(htmlEl, source, opts);
          if (instance) {
            instances.push(instance);
            (htmlEl as any)._sakuraPlayer = instance;
            console.log(`✅ Player instance ${index} başarıyla oluşturuldu`);
          } else {
            console.warn(`⚠️ Player instance ${index} oluşturulamadı`);
          }
        } catch (err) {
          console.error(`❌ Player ${index} başlatılırken hata:`, err);
        }
      });
      
      console.log('✅ Toplam player instance sayısı:', instances.length);
    } catch (error) {
      console.error('❌ Player başlatılamadı:', error);
    }
  }

  /** Ses dili seçimi – ayrı bir <audio> elementi oluşturup video ile senkronize eder */
  selectAudioTrack(index: number) {
    this.selectedSoundIndex = index;
    this.cleanupAudio();

    const playerEl = document.querySelector('.sakura-player') as HTMLElement;
    if (!playerEl?.shadowRoot) {
      console.warn('⚠️ Player shadow root bulunamadı');
      return;
    }
    const video = playerEl.shadowRoot.querySelector('video');
    if (!video) {
      console.warn('⚠️ Video elementi bulunamadı');
      return;
    }

    if (index === -1) {
      // Orijinal ses – video'nun kendi sesini aç
      video.muted = false;
      return;
    }

    const sound = this.soundOptions[index];
    if (!sound?.path) return;

    // Video'nun kendi sesini kapat
    video.muted = true;

    // Harici ses elementi oluştur – preload ile gecikmeyi azalt
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.src = sound.path;
    this.audioElement.currentTime = video.currentTime;
    this.audioElement.playbackRate = video.playbackRate;

    // Video olaylarını senkronize et
    const onPlay = () => {
      if (this.audioElement) {
        // Oynatmaya başlarken zamanı eşitle
        this.audioElement.currentTime = video.currentTime;
        this.audioElement.play().catch(console.error);
      }
    };
    const onPause = () => this.audioElement?.pause();
    const onSeeking = () => {
      // seeking anında hemen zamanı eşitle (seeked'den önce)
      if (this.audioElement) {
        this.audioElement.currentTime = video.currentTime;
      }
    };
    const onSeeked = () => {
      if (this.audioElement) {
        this.audioElement.currentTime = video.currentTime;
      }
    };
    const onRateChange = () => {
      if (this.audioElement) {
        this.audioElement.playbackRate = video.playbackRate;
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('ratechange', onRateChange);

    this.videoSyncHandlers = [
      { event: 'play', handler: onPlay },
      { event: 'pause', handler: onPause },
      { event: 'seeking', handler: onSeeking },
      { event: 'seeked', handler: onSeeked },
      { event: 'ratechange', handler: onRateChange }
    ];

    // Periyodik drift kontrolü – zamanla biriken kaymaları düzeltir
    this.driftCheckInterval = setInterval(() => {
      if (!this.audioElement || video.paused) return;
      const drift = Math.abs(video.currentTime - this.audioElement.currentTime);
      if (drift > Player.DRIFT_THRESHOLD) {
        console.log(`🔄 Ses drift düzeltmesi: ${(drift * 1000).toFixed(0)}ms`);
        this.audioElement.currentTime = video.currentTime;
      }
    }, Player.DRIFT_CHECK_MS);

    // Video zaten oynuyorsa sesi de başlat
    if (!video.paused) {
      this.audioElement.play().catch(console.error);
    }

    console.log(`🔊 Ses dili değiştirildi: ${sound.language}`);
  }

  /** Harici ses elementini ve video olay dinleyicilerini temizle */
  cleanupAudio() {
    // Drift kontrolünü durdur
    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
      this.driftCheckInterval = null;
    }

    const playerEl = document.querySelector('.sakura-player') as HTMLElement;
    const video = playerEl?.shadowRoot?.querySelector('video');
    if (video) {
      this.videoSyncHandlers.forEach(({ event, handler }) => {
        video.removeEventListener(event, handler);
      });
    }
    this.videoSyncHandlers = [];

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  ngOnDestroy() {
    this.cleanupAudio();
  }
}
