import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { AuthModalComponent } from './auth-modal';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AvatarModule, BadgeModule, 
    MenubarModule, InputTextModule, RippleModule, DividerModule, SelectModule, ButtonModule, AuthModalComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  @ViewChild(AuthModalComponent) authModal!: AuthModalComponent;
  
  items: MenuItem[] | undefined;
  isSearchRobotOpen = false;
  isNavbarHidden = false;
  isProfileMenuOpen = false;
  currentUser: any = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Mevcut kullanıcıyı hemen al
    this.currentUser = this.authService.getUser();
    
    // Kullanıcı değişikliklerini dinle
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      console.log('Layout: User updated:', user);
    });
    
    // Auth modal açma isteklerini dinle
    this.authService.openAuthModal$.subscribe(loginMode => {
      if (this.authModal) {
        this.authModal.show(loginMode);
      }
    });
  }
  
  // Arama Robotu seçenekleri
  filmTarzOptions = [
    { label: 'Dublaj', value: 'dublaj' },
    { label: 'Altyazı', value: 'altyazi' }
  ];
  
  filmTurOptions = [
    { label: 'Aksiyon Filmleri', value: 'aksiyon-filmleri' },
    { label: 'Animasyon Filmleri', value: 'animasyon-filmleri' },
    { label: 'Aile Filmleri', value: 'aile-filmleri' },
    { label: 'Belgeseller', value: 'belgeseller' },
    { label: 'Bilim Kurgu Filmleri', value: 'bilim-kurgu-filmleri' },
    { label: 'Blu Ray Filmler', value: 'blu-ray-filmler' },
    { label: 'Çizgi Filmler', value: 'cizgi-filmler' },
    { label: 'Dram Filmleri', value: 'dram-filmleri' },
    { label: 'Fantastik Filmler', value: 'fantastik-filmler' },
    { label: 'Gerilim Filmleri', value: 'gerilim-filmleri' },
    { label: 'Gizem Filmleri', value: 'gizem-filmleri' },
    { label: 'Hint Filmleri', value: 'hint-filmleri' },
    { label: 'Komedi Filmleri', value: 'komedi-filmleri' },
    { label: 'Korku Filmleri', value: 'korku-filmleri' },
    { label: 'Macera Filmleri', value: 'macera-filmleri' },
    { label: 'Müzikal Filmler', value: 'muzikal-filmler' },
    { label: 'Polisiye Filmleri', value: 'polisiye-filmleri' },
    { label: 'Psikolojik Filmler', value: 'psikolojik-filmler' },
    { label: 'Romantik Filmler', value: 'romantik-filmler' }
  ];
  
  filmYilOptions = Array.from({ length: 46 }, (_, i) => {
    const year = 2025 - i;
    return { label: String(year), value: String(year) };
  });
  
  imdbPuanOptions = Array.from({ length: 9 }, (_, i) => {
    const puan = 9.0 - i;
    return { label: `${puan.toFixed(1)}+`, value: puan.toFixed(1) };
  });
  
  filmKaliteOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'HD (720p, 1080p)', value: 'hd' },
    { label: 'FullHD (4K)', value: 'fullhd-4k' }
  ];
  
  // Seçilen değerler
  selectedFilmTarz: any = null;
  selectedFilmTur: any = null;
  selectedFilmYil: any = null;
  selectedImdbPuan: any = null;
  selectedFilmKalite: any = null;

  ngOnInit() {
    this.items = [
      {
        label: 'Anasayfa',
        icon: 'pi pi-home',
        routerLink: '/'
      },
      {
        label: 'Filmler',
        icon: 'pi pi-film',
        routerLink: '/movies'
      },
      {
        label: 'Diziler',
        icon: 'pi pi-tv',
        routerLink: '/tv-shows'
      },
      {
        label: 'Listeniz',
        icon: 'pi pi-list',
      }
    ];
  }
  
  ngOnDestroy() {
    // Cleanup gerekirse buraya eklenebilir
  }
  
  onSearch() {
    // Arama işlemi burada yapılacak
    console.log('Arama:', {
      tarz: this.selectedFilmTarz,
      tur: this.selectedFilmTur,
      yil: this.selectedFilmYil,
      imdb: this.selectedImdbPuan,
      kalite: this.selectedFilmKalite
    });
  }
  
  onReset() {
    this.selectedFilmTarz = null;
    this.selectedFilmTur = null;
    this.selectedFilmYil = null;
    this.selectedImdbPuan = null;
    this.selectedFilmKalite = null;
  }
  
  toggleSearchRobot() {
    this.isSearchRobotOpen = !this.isSearchRobotOpen;
  }
  
  onAuthClick() {
    if (this.authModal) {
      this.authModal.show(true);
    }
  }
  
  onProfileClick(event: Event) {
    if (this.currentUser) {
      // Giriş yapılmışsa profil menüsünü aç
      this.isProfileMenuOpen = !this.isProfileMenuOpen;
    } else {
      // Giriş yapılmamışsa giriş modalını aç
      if (this.authModal) {
        this.authModal.show(true); // true = giriş yap modu
      }
    }
    event.stopPropagation();
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-container')) {
      this.isProfileMenuOpen = false;
    }
  }
  
  onProfileMenuAction(action: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Profile action:', action);
    this.isProfileMenuOpen = false;
    
    switch(action) {
      case 'continue':
      case 'watchlist':
      case 'favorites':
      case 'history':
      case 'comments':
        // Profil sayfasına git ve ilgili sekmeyi aç
        this.router.navigate(['/profile'], { queryParams: { tab: action } });
        break;
      case 'edit':
        // Profil sayfasına git ve ayarlar sekmesini aç
        this.router.navigate(['/profile'], { queryParams: { tab: 'settings' } });
        break;
      case 'logout':
        this.authService.logout();
        break;
    }
  }
}
