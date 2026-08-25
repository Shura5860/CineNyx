import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    CardModule,
    DividerModule,
    BadgeModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  activeTab: 'overview' | 'settings' | 'subscription' | 'parental' = 'overview';
  activeLibraryTab: 'continue' | 'watchlist' | 'favorites' | 'history' | 'comments' = 'continue';
  activeContentType: 'all' | 'movies' | 'tvshows' = 'all';
  
  // Form data
  profileForm = {
    username: '',
    email: '',
    bio: '',
    avatar: ''
  };

  // Aktivite istatistikleri (mock data - gerçek API'den gelecek)
  stats = {
    moviesWatched: 142,
    hoursStreamed: 320,
    favoriteGenre: 'Bilim Kurgu'
  };

  // Kütüphane içeriği (mock data - gerçek API'den gelecek)
  continueWatching: any[] = [];
  watchlist: any[] = [];
  favorites: any[] = [];
  history: any[] = [];
  comments: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/']);
      return;
    }

    // Form'u kullanıcı bilgileriyle doldur
    this.profileForm = {
      username: this.currentUser.username || '',
      email: this.currentUser.email || '',
      bio: this.currentUser.bio || '',
      avatar: this.currentUser.profileImage || ''
    };

    // Kullanıcı değişikliklerini dinle
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm = {
          username: user.username || '',
          email: user.email || '',
          bio: user.bio || '',
          avatar: user.profileImage || ''
        };
      }
    });

    // TODO: Gerçek API'den veri çek
    // this.loadLibraryData();

    // Query parameter'dan sekme bilgisini al
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = params['tab'];
        if (tab === 'settings') {
          this.activeTab = 'settings';
        } else if (['continue', 'watchlist', 'favorites', 'history', 'comments'].includes(tab)) {
          this.activeTab = 'overview';
          this.activeLibraryTab = tab as 'continue' | 'watchlist' | 'favorites' | 'history' | 'comments';
        }
      }
    });
  }

  // Mock data yükleme (gerçek API'den gelecek)
  loadLibraryData() {
    // Örnek: this.authService.getContinueWatching().subscribe(data => this.continueWatching = data);
    // Örnek: this.authService.getWatchlist().subscribe(data => this.watchlist = data);
    // Örnek: this.authService.getFavorites().subscribe(data => this.favorites = data);
    // Örnek: this.authService.getHistory().subscribe(data => this.history = data);
  }

  setActiveTab(tab: 'overview' | 'settings' | 'subscription' | 'parental') {
    this.activeTab = tab;
  }

  setActiveLibraryTab(tab: 'continue' | 'watchlist' | 'favorites' | 'history' | 'comments') {
    this.activeLibraryTab = tab;
    // Sekme değiştiğinde içerik tipini sıfırla
    this.activeContentType = 'all';
  }

  getCurrentLibraryContent(): any[] {
    let content: any[] = [];
    switch(this.activeLibraryTab) {
      case 'continue':
        content = this.continueWatching;
        break;
      case 'watchlist':
        content = this.watchlist;
        break;
      case 'favorites':
        content = this.favorites;
        break;
      case 'history':
        content = this.history;
        break;
      case 'comments':
        return this.comments;
      default:
        return [];
    }

    // İçerik tipine göre filtrele
    if (this.activeContentType === 'movies') {
      return this.getMovies(content);
    } else if (this.activeContentType === 'tvshows') {
      return this.getTvShows(content);
    }
    return content;
  }

  setActiveContentType(type: 'all' | 'movies' | 'tvshows') {
    this.activeContentType = type;
  }

  getCurrentLibraryTitle(): string {
    switch(this.activeLibraryTab) {
      case 'continue':
        return 'İzlemeye Devam';
      case 'watchlist':
        return 'İzleme Listesi';
      case 'favorites':
        return 'Favoriler';
      case 'history':
        return 'Geçmiş';
      case 'comments':
        return 'Yorumlarım';
      default:
        return '';
    }
  }

  onSaveProfile() {
    // TODO: API'ye profil güncelleme isteği gönder
    console.log('Profil kaydediliyor:', this.profileForm);
    // Örnek: this.authService.updateProfile(this.profileForm).subscribe(...)
  }

  onLogout() {
    this.authService.logout();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: Math.floor(rating) }, (_, i) => i + 1);
  }

  // Film ve dizi ayırma helper fonksiyonları
  getMovies(content: any[]): any[] {
    return content.filter(item => item.type === 'movie' || (!item.type && !item.episode) || item.type === 'film');
  }

  getTvShows(content: any[]): any[] {
    return content.filter(item => item.type === 'series' || item.type === 'tv-show' || item.type === 'dizi' || item.episode);
  }

  getBaseContent(): any[] {
    switch(this.activeLibraryTab) {
      case 'continue':
        return this.continueWatching;
      case 'watchlist':
        return this.watchlist;
      case 'favorites':
        return this.favorites;
      case 'history':
        return this.history;
      default:
        return [];
    }
  }
}
