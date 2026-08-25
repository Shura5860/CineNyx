import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    ProgressBarModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  currentStep = 1;
  totalSteps = 3;
  
  // Adım 1: Hesap Bilgileri
  formData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  };
  
  // Adım 2: Film Seçimi
  selectedMovies: number[] = [];
  searchQuery = '';
  selectedGenre = 'all';
  movies: any[] = [];
  filteredMovies: any[] = [];

  // Adım 3: Dizi Seçimi
  selectedTvShows: number[] = [];
  searchQueryStep3 = '';
  selectedGenreStep3 = 'all';
  tvShows: any[] = [];
  filteredTvShows: any[] = [];

  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  
  genres = [
    { label: 'Tümü', value: 'all' },
    { label: 'Aksiyon', value: 'aksiyon' },
    { label: 'Bilim Kurgu', value: 'bilim-kurgu' },
    { label: 'Komedi', value: 'komedi' },
    { label: 'Dram', value: 'dram' },
    { label: 'Korku', value: 'korku' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Body overflow'u düzelt
    this.renderer.setStyle(document.body, 'overflow-y', 'auto');
    this.renderer.setStyle(document.body, 'overflow-x', 'hidden');
    this.renderer.setStyle(document.body, 'height', 'auto');
    this.renderer.setStyle(document.documentElement, 'overflow-y', 'auto');
    this.renderer.setStyle(document.documentElement, 'overflow-x', 'hidden');
    this.renderer.setStyle(document.documentElement, 'height', 'auto');
    
    this.loadMovies();
    this.loadTvShows();
  }

  ngOnDestroy() {
    // Body overflow'u geri al (isteğe bağlı)
    this.renderer.removeStyle(document.body, 'overflow-y');
    this.renderer.removeStyle(document.body, 'overflow-x');
    this.renderer.removeStyle(document.body, 'height');
    this.renderer.removeStyle(document.documentElement, 'overflow-y');
    this.renderer.removeStyle(document.documentElement, 'overflow-x');
    this.renderer.removeStyle(document.documentElement, 'height');
  }

  loadMovies() {
    // Mock film verileri - gerçek API'ye bağlanacak
    this.movies = [
      { id: 1, title: 'Dune: Part Two', year: 2024, rating: 8.8, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Dune' },
      { id: 2, title: 'Neon Dreams', year: 2021, rating: 7.5, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Neon' },
      { id: 3, title: 'Cyber Blade', year: 2023, rating: 7.2, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Cyber' },
      { id: 4, title: 'The Silent', year: 2022, rating: 8.1, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Silent' },
      { id: 5, title: 'Lost Horizon', year: 2019, rating: 7.8, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Lost' },
      { id: 6, title: 'Prism', year: 2023, rating: 7.9, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Prism' },
      { id: 7, title: 'Fast Lane', year: 2020, rating: 6.9, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Fast' },
      { id: 8, title: 'Reflection', year: 2021, rating: 8.0, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Reflection' },
      { id: 9, title: 'Cosmos', year: 2022, rating: 8.5, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Cosmos' },
      { id: 10, title: 'The Woods', year: 2018, rating: 7.3, genre: 'korku', poster: 'https://via.placeholder.com/200x300?text=Woods' },
      { id: 11, title: 'Inception', year: 2010, rating: 8.8, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Inception' },
      { id: 12, title: 'Interstellar', year: 2014, rating: 8.7, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Interstellar' },
      { id: 13, title: 'The Dark Knight', year: 2008, rating: 9.0, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=DarkKnight' },
      { id: 14, title: 'Titanic', year: 1997, rating: 7.9, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Titanic' },
      { id: 15, title: 'Matrix', year: 1999, rating: 8.7, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Matrix' },
      { id: 16, title: 'Joker', year: 2019, rating: 8.4, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Joker' },
      { id: 17, title: 'Pulp Fiction', year: 1994, rating: 8.9, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Pulp' },
      { id: 18, title: 'Dune', year: 2021, rating: 8.0, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Dune' },
      { id: 19, title: 'Avatar', year: 2009, rating: 7.9, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Avatar' },
      { id: 20, title: 'Fight Club', year: 1999, rating: 8.8, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=FightClub' }
    ];
    this.filterMovies();
  }

  loadTvShows() {
    this.tvShows = [
      { id: 101, title: 'Breaking Bad', year: 2008, rating: 9.5, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=BB' },
      { id: 102, title: 'Stranger Things', year: 2016, rating: 8.7, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=ST' },
      { id: 103, title: 'The Crown', year: 2016, rating: 8.6, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Crown' },
      { id: 104, title: 'Squid Game', year: 2021, rating: 8.0, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Squid' },
      { id: 105, title: 'Dark', year: 2017, rating: 8.7, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Dark' },
      { id: 106, title: 'Game of Thrones', year: 2011, rating: 9.2, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=GOT' },
      { id: 107, title: 'The Witcher', year: 2019, rating: 8.2, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Witcher' },
      { id: 108, title: 'Wednesday', year: 2022, rating: 8.1, genre: 'komedi', poster: 'https://via.placeholder.com/200x300?text=Wed' },
      { id: 109, title: 'Lupin', year: 2021, rating: 7.9, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Lupin' },
      { id: 110, title: 'Money Heist', year: 2017, rating: 8.3, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=MH' },
      { id: 111, title: 'Black Mirror', year: 2011, rating: 8.8, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=BM' },
      { id: 112, title: 'The Last of Us', year: 2023, rating: 8.7, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=TLOU' },
      { id: 113, title: 'Sherlock', year: 2010, rating: 9.1, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Sherlock' },
      { id: 114, title: 'Friends', year: 1994, rating: 8.9, genre: 'komedi', poster: 'https://via.placeholder.com/200x300?text=Friends' },
      { id: 115, title: 'The Office', year: 2005, rating: 8.9, genre: 'komedi', poster: 'https://via.placeholder.com/200x300?text=Office' },
      { id: 116, title: 'Ozark', year: 2017, rating: 8.4, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Ozark' },
      { id: 117, title: 'Narcos', year: 2015, rating: 8.8, genre: 'aksiyon', poster: 'https://via.placeholder.com/200x300?text=Narcos' },
      { id: 118, title: 'Peaky Blinders', year: 2013, rating: 8.8, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=PB' },
      { id: 119, title: 'The Mandalorian', year: 2019, rating: 8.6, genre: 'bilim-kurgu', poster: 'https://via.placeholder.com/200x300?text=Mando' },
      { id: 120, title: 'Bridgerton', year: 2020, rating: 7.3, genre: 'dram', poster: 'https://via.placeholder.com/200x300?text=Bridge' }
    ];
    this.filterTvShows();
  }

  filterMovies() {
    let filtered = [...this.movies];
    
    // Genre filtresi
    if (this.selectedGenre !== 'all') {
      filtered = filtered.filter(movie => movie.genre === this.selectedGenre);
    }
    
    // Arama filtresi
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(query)
      );
    }
    
    this.filteredMovies = filtered;
  }

  onSearchChange() {
    this.filterMovies();
  }

  onGenreChange() {
    this.filterMovies();
  }

  toggleMovie(movieId: number) {
    const index = this.selectedMovies.indexOf(movieId);
    if (index > -1) {
      this.selectedMovies.splice(index, 1);
    } else {
      this.selectedMovies.push(movieId);
    }
  }

  isMovieSelected(movieId: number): boolean {
    return this.selectedMovies.includes(movieId);
  }

  filterTvShows() {
    let filtered = [...this.tvShows];
    if (this.selectedGenreStep3 !== 'all') {
      filtered = filtered.filter(show => show.genre === this.selectedGenreStep3);
    }
    if (this.searchQueryStep3.trim()) {
      const query = this.searchQueryStep3.toLowerCase();
      filtered = filtered.filter(show =>
        show.title.toLowerCase().includes(query)
      );
    }
    this.filteredTvShows = filtered;
  }

  onTvSearchChange() {
    this.filterTvShows();
  }

  onTvGenreChange() {
    this.filterTvShows();
  }

  toggleTvShow(showId: number) {
    const index = this.selectedTvShows.indexOf(showId);
    if (index > -1) {
      this.selectedTvShows.splice(index, 1);
    } else {
      this.selectedTvShows.push(showId);
    }
  }

  isTvShowSelected(showId: number): boolean {
    return this.selectedTvShows.includes(showId);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getStepTitle(): string {
    switch(this.currentStep) {
      case 1: return 'HESAP BİLGİLERİ';
      case 2: return 'KİŞİSELLEŞTİRME';
      case 3: return 'KİŞİSELLEŞTİRME';
      default: return '';
    }
  }

  canProceedStep1(): boolean {
    return !!(
      this.formData.fullName &&
      this.formData.email &&
      this.formData.password &&
      this.formData.confirmPassword &&
      this.formData.password === this.formData.confirmPassword &&
      this.formData.acceptTerms
    );
  }

  canProceedStep2(): boolean {
    return true; // Seçim zorunlu değil
  }
  
  skipStep2(): void {
    this.selectedMovies = [];
    this.nextStep();
  }
  
  skipStep3(): void {
    this.completeRegistration();
  }
  
  scrollMovies(direction: 'left' | 'right'): void {
    const gridWrapper = document.querySelector('.movies-grid-wrapper') as HTMLElement;
    if (!gridWrapper) return;
    
    const filmWidth = 200;
    const gapWidth = 24; // 1.5rem = 24px
    // Her 6 filmlik grup için scroll (2 satır x 3 sütun = 6 film)
    // 3 sütun genişliği + 2 gap = 648px
    const scrollAmount = (filmWidth * 3) + (gapWidth * 2);
    const currentScroll = gridWrapper.scrollLeft || 0;
    const maxScroll = gridWrapper.scrollWidth - gridWrapper.clientWidth;
    
    let newScroll: number;
    if (direction === 'left') {
      newScroll = Math.max(0, currentScroll - scrollAmount);
    } else {
      newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
    }
    
    gridWrapper.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.canProceedStep1()) {
        this.errorMessage = 'Lütfen tüm alanları doldurun ve şifrelerin eşleştiğinden emin olun.';
        return;
      }
      this.errorMessage = '';
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.errorMessage = '';
      this.currentStep = 3;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  completeRegistration() {
    this.loading = true;
    this.errorMessage = '';

    // Kullanıcı adını email'den oluştur (veya fullName'den)
    const username = this.formData.email.split('@')[0];

    this.authService.register({
      username: username,
      email: this.formData.email,
      password: this.formData.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && (res.success === true || res.status === 'success')) {
          // Başarılı kayıt sonrası ana sayfaya yönlendir
          this.router.navigate(['/']);
          setTimeout(() => window.location.reload(), 500);
        } else {
          this.errorMessage = res?.message || 'Kayıt başarısız';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Kayıt sırasında bir hata oluştu';
      }
    });
  }
}
