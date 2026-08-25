import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { apiUrl, API_ENDPOINTS } from '../../config/api';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.css',
})
export class Movies implements OnInit {
  searchQuery = '';
  selectedGenre = 'all';
  selectedYear: string | null = null;
  selectedRating: string | null = null;
  
  genres = [
    { label: 'Tümü', value: 'all' },
    { label: 'Aksiyon', value: 'aksiyon-filmleri' },
    { label: 'Animasyon', value: 'animasyon-filmleri' },
    { label: 'Aile', value: 'aile-filmleri' },
    { label: 'Belgesel', value: 'belgeseller' },
    { label: 'Bilim Kurgu', value: 'bilim-kurgu-filmleri' },
    { label: 'Blu Ray', value: 'blu-ray-filmler' },
    { label: 'Çizgi Film', value: 'cizgi-filmler' },
    { label: 'Dram', value: 'dram-filmleri' },
    { label: 'Fantastik', value: 'fantastik-filmler' },
    { label: 'Gerilim', value: 'gerilim-filmleri' },
    { label: 'Gizem', value: 'gizem-filmleri' },
    { label: 'Hint', value: 'hint-filmleri' },
    { label: 'Komedi', value: 'komedi-filmleri' },
    { label: 'Korku', value: 'korku-filmleri' },
    { label: 'Macera', value: 'macera-filmleri' },
    { label: 'Müzikal', value: 'muzikal-filmler' },
    { label: 'Polisiye', value: 'polisiye-filmleri' },
    { label: 'Psikolojik', value: 'psikolojik-filmler' },
    { label: 'Romantik', value: 'romantik-filmler' }
  ];

  years = Array.from({ length: 30 }, (_, i) => {
    const year = 2025 - i;
    return { label: String(year), value: String(year) };
  });

  ratings = [
    { label: 'Tümü', value: null },
    { label: '8.0+', value: '8.0' },
    { label: '7.5+', value: '7.5' },
    { label: '7.0+', value: '7.0' },
    { label: '6.5+', value: '6.5' }
  ];

  movies: any[] = [];
  filteredMovies: any[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
    this.loading = true;
    const url = apiUrl(API_ENDPOINTS.content.main);
    this.http.get<any[]>(url).subscribe({
      next: (contents) => {
        // Sadece filmleri filtrele (episode olmayan, ana içerikler)
        const movies = (contents || []).filter(c => {
          const isMovie = c.contentType === 'movie';
          const isMainContent = !(c.season !== undefined && c.season !== null) && 
                                !(c.episode !== undefined && c.episode !== null);
          return isMovie && isMainContent;
        });

        // Backend verilerini frontend formatına dönüştür
        this.movies = movies.map(c => {
          const year = c.releaseDate ? new Date(c.releaseDate).getFullYear() : 0;
          const genres = (c.categories || []).map((cat: any) => cat?.name).filter(Boolean);
          // Kategori ismini film robotu formatına çevir
          const genreValue = genres.length > 0 ? this.mapCategoryToGenre(genres[0]) : 'all';
          
          return {
            id: c._id,
            title: c.title || '',
            year: isNaN(year) ? 0 : year,
            rating: c.imdbScore || 0,
            genre: genreValue,
            genres: genres, // Tüm kategorileri de sakla
            poster: c.imagePath || '',
            description: c.description || c.shortDescription || ''
          };
        });

        this.loading = false;
        this.filterMovies();
      },
      error: (err) => {
        console.error('Filmler yüklenirken hata:', err);
        this.movies = [];
        this.loading = false;
        this.filterMovies();
      }
    });
  }

  filterMovies() {
    let filtered = [...this.movies];
    
    // Genre filtresi
    if (this.selectedGenre !== 'all') {
      filtered = filtered.filter(movie => {
        // Genre değeri veya genres array'inde arama yap
        const movieGenre = movie.genre?.toLowerCase() || '';
        const movieGenres = (movie.genres || []).map((g: string) => g.toLowerCase());
        const selectedGenreLower = this.selectedGenre.toLowerCase();
        
        // Genre değeriyle eşleşme
        if (movieGenre === selectedGenreLower || movieGenre.includes(selectedGenreLower)) {
          return true;
        }
        
        // Genres array'inde arama
        return movieGenres.some((g: string) => {
          const mappedGenre = this.mapCategoryToGenre(g);
          return mappedGenre === selectedGenreLower || mappedGenre.includes(selectedGenreLower);
        });
      });
    }
    
    // Year filtresi
    if (this.selectedYear) {
      filtered = filtered.filter(movie => movie.year === parseInt(this.selectedYear!));
    }
    
    // Rating filtresi
    if (this.selectedRating) {
      const minRating = parseFloat(this.selectedRating);
      filtered = filtered.filter(movie => movie.rating >= minRating);
    }
    
    // Arama filtresi
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(query) ||
        (movie.description && movie.description.toLowerCase().includes(query))
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

  onYearChange() {
    this.filterMovies();
  }

  onRatingChange() {
    this.filterMovies();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedGenre = 'all';
    this.selectedYear = null;
    this.selectedRating = null;
    this.filterMovies();
  }

  // Backend kategori ismini film robotu formatına çevir
  private mapCategoryToGenre(categoryName: string): string {
    const categoryLower = categoryName.toLowerCase();
    const mapping: { [key: string]: string } = {
      'aksiyon': 'aksiyon-filmleri',
      'animasyon': 'animasyon-filmleri',
      'aile': 'aile-filmleri',
      'belgesel': 'belgeseller',
      'bilim kurgu': 'bilim-kurgu-filmleri',
      'blu ray': 'blu-ray-filmler',
      'çizgi film': 'cizgi-filmler',
      'dram': 'dram-filmleri',
      'fantastik': 'fantastik-filmler',
      'gerilim': 'gerilim-filmleri',
      'gizem': 'gizem-filmleri',
      'hint': 'hint-filmleri',
      'komedi': 'komedi-filmleri',
      'korku': 'korku-filmleri',
      'macera': 'macera-filmleri',
      'müzikal': 'muzikal-filmler',
      'polisiye': 'polisiye-filmleri',
      'psikolojik': 'psikolojik-filmler',
      'romantik': 'romantik-filmler'
    };

    // Tam eşleşme kontrolü
    if (mapping[categoryLower]) {
      return mapping[categoryLower];
    }

    // Kısmi eşleşme kontrolü
    for (const [key, value] of Object.entries(mapping)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return value;
      }
    }

    // Eşleşme bulunamazsa orijinal kategoriyi döndür
    return categoryLower.replace(/\s+/g, '-');
  }
}
