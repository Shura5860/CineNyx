import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../config/api';
import { API_ENDPOINTS } from '../../config/api';

interface HeroSlide {
  title: string;
  year: number;
  description: string;
  genres: string[];
  image: string;
}

interface Film {
  id: string;
  title: string;
  year: number;
  imdb: number;
  genres: string[];
  poster: string;
}

interface ContinueWatching {
  id: string;
  title: string;
  year: number;
  poster: string;
  type: 'film' | 'dizi';
  progress: number; // 0-100 arası yüzde
  currentTime: string; // "45:30" gibi
  totalTime: string; // "120:00" gibi
  episode?: string; // Dizi için bölüm bilgisi
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ButtonModule, CarouselModule, TagModule, ChipModule],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  slides: HeroSlide[] = [];
  activeIndex = 0;
  isUserInteracting = false;
  isProgressAnimating = false;
  private autoSlideTimeout: any = null;
  private progressAnimationTimeout: any = null;
  private readonly AUTO_SLIDE_DELAY = 7000; // 7 saniye
  private previousActiveIndex = -1;
  
  continueWatching: ContinueWatching[] = [];
  recentMovies: Film[] = [];
  recentSeries: Film[] = [];
  private readonly RECENT_LIMIT = 8;

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.slides = [
      {
        title: 'ZOOTROPOLİS 2 - ZOOTOPIA 2',
        year: 2025,
        description:
          'Dedektif Judy Hopps ve Nick Wilde, Zootropolis\'e gelen ve memeli metropolünü alt üst eden gizemli bir sürüngenin karmaşık izini sürüyor. Yeni bir tehdit ortaya çıkarken, ikili birlikte çalışarak şehri kurtarmak zorunda.',
        genres: ['Animasyon', 'Komedi', 'Macera'],
        image: 'https://uhdfilmindir.com/public/upload/cover/large-cover-zootropolis-2-zootopia-2.webp'
      },
      {
        title: 'SUÇÜSTÜ – CAUGHT STEALING',
        year: 2025,
        description:
          'Bir zamanların beyzbol yıldızı Hank Thompson, sakin bir hayat sürerken kendini suçlarla dolu tehlikeli bir ağın içinde bulur. Geçmişi onu yakalamıştır ve artık kaçış yoktur.',
        genres: ['Suç', 'Gerilim', 'Komedi'],
        image: 'https://uhdfilmindir.com/public/upload/cover/large-cover-anakonda-anaconda_1.webp'
      },
      {
        title: 'THE SILENT CODE',
        year: 2024,
        description:
          'Bir hacker, tek bir satır kodla bütün dünyayı kaosa sürükleyebilir. Siber güvenlik uzmanı Alex, bu tehdidi durdurmak için zamana karşı yarışırken kendi geçmişiyle yüzleşmek zorunda kalır.',
        genres: ['Aksiyon', 'Gerilim', 'Bilim Kurgu'],
        image: 'https://image.tmdb.org/t/p/w1280/74xTEgt7R36Fpooo50r9T25onhq.jpg'
      },
      {
        title: 'DUNE: PART TWO',
        year: 2024,
        description:
          'Paul Atreides, Arrakis\'teki Fremen halkıyla birleşerek, ailesinin düşmanlarına karşı intikam yolculuğuna çıkar. Efsanevi kurtarıcı olarak kaderini kabul ederken, galaksinin geleceği onun ellerindedir.',
        genres: ['Bilim Kurgu', 'Aksiyon', 'Drama'],
        image: 'https://image.tmdb.org/t/p/w1280/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'
      },
      {
        title: 'OPPENHEIMER',
        year: 2023,
        description:
          'Atom bombasının yaratıcısı J. Robert Oppenheimer\'ın hayatı ve Manhattan Projesi\'ndeki rolü. Bilim, etik ve güç arasındaki karmaşık ilişkiyi keşfeden epik bir hikaye.',
        genres: ['Drama', 'Tarih', 'Biyografi'],
        image: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'
      }
    ];

    this.loadContinueWatching();
    this.loadRecentContent();
  }

  loadRecentContent(): void {
    const url = apiUrl(API_ENDPOINTS.content.main);
    console.log('API URL:', url);
    
    this.http.get<any[]>(url).subscribe({
      next: (list) => {
        if (!list || list.length === 0) {
          this.recentMovies = [];
          this.recentSeries = [];
          this.cdr.detectChanges();
          return;
        }

        // Tarihe göre sırala (en yeni önce)
        const sorted = [...list].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });

        // Son 8 filmi al - sadece ana içerikler (episode değil)
        const movies = sorted
          .filter(c => {
            const isMovie = c.contentType === 'movie';
            // season veya episode field'ı varsa bu bir episode'dur, ana içerik değil
            const isMainContent = !(c.season !== undefined && c.season !== null) && 
                                  !(c.episode !== undefined && c.episode !== null);
            return isMovie && isMainContent;
          })
          .slice(0, this.RECENT_LIMIT);

        // Son 8 diziyi al - sadece ana içerikler (episode değil)
        const series = sorted
          .filter(c => {
            const isSerie = c.contentType === 'serie';
            // season veya episode field'ı varsa bu bir episode'dur, ana içerik değil
            const isMainContent = !(c.season !== undefined && c.season !== null) && 
                                  !(c.episode !== undefined && c.episode !== null);
            return isSerie && isMainContent;
          })
          .slice(0, this.RECENT_LIMIT);

        // Map et
        this.recentMovies = movies.map(c => this.mapContentToFilm(c));
        this.recentSeries = series.map(c => this.mapContentToFilm(c));
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Son eklenen içerikler yüklenirken hata:', err);
        console.error('Backend bağlantı hatası. Backend çalışıyor mu? Port 3000 dinleniyor mu?');
        // Hata durumunda boş array'ler set et
        this.recentMovies = [];
        this.recentSeries = [];
        this.cdr.detectChanges();
      }
    });
  }

  private mapContentToFilm(c: any): Film {
    const year = c.releaseDate ? new Date(c.releaseDate).getFullYear() : 0;
    const genres = (c.categories || []).map((cat: any) => cat?.name).filter(Boolean);
    return {
      id: c._id,
      title: c.title || '',
      year: isNaN(year) ? 0 : year,
      imdb: c.imdbScore ?? 0,
      genres,
      poster: c.imagePath || ''
    };
  }
  
  ngAfterViewInit(): void {
    // DOM hazır olduğunda slider'ı başlat
    // İlk slide için progress bar'ı başlat
    setTimeout(() => {
      if (this.slides.length > 0) {
        this.previousActiveIndex = this.activeIndex;
        this.startAutoSlide();
      }
    }, 300);
  }
  
  loadContinueWatching(): void {
    // TODO: API'den kullanıcının yarıda bıraktığı içerikleri çek
    // Şimdilik örnek veri
    this.continueWatching = [
      {
        id: '1',
        title: 'Dune: Part Two',
        year: 2024,
        poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
        type: 'film',
        progress: 65,
        currentTime: '78:30',
        totalTime: '120:00'
      },
      {
        id: '2',
        title: 'Breaking Bad',
        year: 2008,
        poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        type: 'dizi',
        progress: 45,
        currentTime: '22:15',
        totalTime: '48:00',
        episode: 'Sezon 2 - Bölüm 5'
      },
      {
        id: '3',
        title: 'The Batman',
        year: 2022,
        poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        type: 'film',
        progress: 30,
        currentTime: '36:00',
        totalTime: '120:00'
      },
      {
        id: '4',
        title: 'Stranger Things',
        year: 2016,
        poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
        type: 'dizi',
        progress: 80,
        currentTime: '38:24',
        totalTime: '48:00',
        episode: 'Sezon 4 - Bölüm 8'
      }
    ];
  }
  
  onContinueClick(item: ContinueWatching): void {
    // İzlemeye devam et
    console.log('Devam et:', item);
    // TODO: Player sayfasına yönlendir
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  resetProgressBar(): void {
    // Progress bar'ı kesinlikle sıfırla
    this.isProgressAnimating = false;
    this.stopAutoSlide();
    
    // DOM'un güncellenmesini sağla
    this.cdr.detectChanges();
  }
  
  checkAndResetProgressBar(): void {
    // activeIndex değiştiyse progress bar'ı sıfırla
    if (this.previousActiveIndex !== this.activeIndex) {
      this.previousActiveIndex = this.activeIndex;
      this.resetProgressBar();
    }
  }
  
  startAutoSlide(): void {
    // Önce mevcut timeout'u temizle
    this.stopAutoSlide();
    
    // Kullanıcı etkileşimdeyse başlatma
    if (this.isUserInteracting) {
      return;
    }
    
    // Progress bar'ı kesinlikle sıfırla
    this.resetProgressBar();
    
    // Force reflow için kısa bir gecikme - DOM'un güncellenmesini bekle
    // requestAnimationFrame kullanarak daha güvenilir bir başlatma
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!this.isUserInteracting) {
          // Progress animasyonunu başlat
          this.isProgressAnimating = true;
          this.cdr.detectChanges();
          
          // AUTO_SLIDE_DELAY kadar sonra slide'ı değiştir (progress bar ile senkronize)
          this.autoSlideTimeout = setTimeout(() => {
            if (!this.isUserInteracting && this.isProgressAnimating) {
              this.goToNextSlide();
            }
          }, this.AUTO_SLIDE_DELAY);
        }
      }, 50);
    });
  }
  
  goToNextSlide(): void {
    if (this.slides.length === 0) return;
    
    // Progress animasyonunu durdur
    this.isProgressAnimating = false;
    
    // Bir sonraki slide'a geç
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.checkAndResetProgressBar();
    
    // Yeni slide için progress'i tekrar başlat
    // requestAnimationFrame ile daha güvenilir başlatma
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!this.isUserInteracting) {
          this.startAutoSlide();
        }
      }, 100);
    });
  }

  onProgressComplete(): void {
    // Animation tamamlandığında bir sonraki slide'a geç (backup mekanizma)
    // Ana mekanizma timeout ile çalışıyor, bu sadece güvenlik için
    if (!this.isUserInteracting && this.slides.length > 0 && this.isProgressAnimating) {
      this.goToNextSlide();
    }
  }

  stopAutoSlide(): void {
    if (this.autoSlideTimeout !== null) {
      clearTimeout(this.autoSlideTimeout);
      this.autoSlideTimeout = null;
    }
    if (this.progressAnimationTimeout !== null) {
      clearTimeout(this.progressAnimationTimeout);
      this.progressAnimationTimeout = null;
    }
    this.isProgressAnimating = false;
  }

  nextSlide(): void {
    if (this.slides.length === 0) return;
    this.isUserInteracting = true;
    this.stopAutoSlide();
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.checkAndResetProgressBar();
    this.restartAutoSlide();
  }

  prevSlide(): void {
    if (this.slides.length === 0) return;
    this.isUserInteracting = true;
    this.stopAutoSlide();
    this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
    this.checkAndResetProgressBar();
    this.restartAutoSlide();
  }

  restartAutoSlide(): void {
    // Kullanıcı etkileşimini kaldır ve slider'ı yeniden başlat
    setTimeout(() => {
      this.isUserInteracting = false;
      // requestAnimationFrame ile daha güvenilir başlatma
      requestAnimationFrame(() => {
        this.startAutoSlide();
      });
    }, 300);
  }

  onSlideClick(index: number): void {
    if (index === this.activeIndex) return; // Aynı slide'a tıklanmışsa işlem yapma
    
    this.isUserInteracting = true;
    this.stopAutoSlide();
    this.activeIndex = index;
    this.checkAndResetProgressBar();
    this.restartAutoSlide();
  }

  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];  
}
