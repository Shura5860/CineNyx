import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { apiUrl } from '../../config/api';
import { API_ENDPOINTS } from '../../config/api';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

interface SearchResult {
  id: number;
  title: string;
  poster: string;
}

interface Genre {
  _id: string;
  name: string;
  tmdbId: number;
}

interface Movie {
  _id: string;
  id?: number | string;
  selected?: boolean;
  title: string;
  originalTitle: string;
  categories: Genre[];
  imdbScore: number;
  imagePath?: string;
  averageRating?: number;
  soundOptions: string[];
  subtitleOptions: string[];
  maxQuality: string;
  slug: string;
  description: string;
  shortDescription: string;
  contentType: string;
  releaseDate: string;
  likeCount: number;
  dislikeCount: number;
  watchCount: number;
  status: string;
  videoPath: string | null;
  completed: boolean;
  videoSize: number;
  movieStatus: number;
}

@Component({
  selector: 'app-admin-movies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    CheckboxModule,
    PaginatorModule,
    SelectModule
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.css',
  providers: [ConfirmationService, MessageService]
})
export class AdminMovies implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  selectedMovies: any[] = [];
  displayDialog: boolean = false;
  searchQuery: string = '';
  itemsPerPage: number = 12;
  first: number = 0;
  paginatedMovies: Movie[] = [];
  sortOption: string | null = null;
  sortOptions: any[] = [
    { label: 'Sıralama Seçin', value: null },
    { label: 'En Çok İzlenenler', value: 'totalViews-desc' },
    { label: 'En Az İzlenenler', value: 'totalViews-asc' },
    { label: 'En Çok Beğenilenler', value: 'likes-desc' },
    { label: 'En Az Beğenilenler', value: 'likes-asc' },
    { label: 'En Yüksek Puanlılar', value: 'averageRating-desc' },
    { label: 'En Düşük Puanlılar', value: 'averageRating-asc' },
    { label: 'En Çok Beğenilmeyenler', value: 'dislikes-desc' },
    { label: 'En Az Beğenilmeyenler', value: 'dislikes-asc' },
    { label: 'En Yüksek IMDB Puanı', value: 'rating-desc' },
    { label: 'En Düşük IMDB Puanı', value: 'rating-asc' }
  ];
  newMovie: any = {
    title: '',
    searchResults: [] as SearchResult[]
  };
  editingMovie: Movie | null = null;
  genres: Genre[] = [];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadGenres();
    this.loadMovies();
    this.updatePaginatedMovies();

    // Query parameter kontrolü - eğer addNew=true ise dialog'u aç
    this.route.queryParams.subscribe(params => {
      if (params['addNew'] === 'true') {
        this.openNew();
        // Query parametresini temizle
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredMovies = [...this.movies];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredMovies = this.movies.filter(m =>
        m.title.toLowerCase().includes(query)
      );
    }
    this.applySorting();
    this.first = 0;
    this.updatePaginatedMovies();
  }

  onSortChange() {
    this.applySorting();
    this.first = 0;
    this.updatePaginatedMovies();
  }

  applySorting() {
    if (!this.sortOption) {
      return;
    }

    const [field, order] = this.sortOption.split('-');
    this.filteredMovies = [...this.filteredMovies].sort((a, b) => {
      const aVal = a[field as keyof Movie];
      const bVal = b[field as keyof Movie];
      const aValue = typeof aVal === 'number' ? aVal : Number(aVal) || 0;
      const bValue = typeof bVal === 'number' ? bVal : Number(bVal) || 0;

      if (order === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }

  updatePaginatedMovies() {
    const start = this.first;
    const end = start + this.itemsPerPage;
    this.paginatedMovies = this.filteredMovies.slice(start, end);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  onPageChange(event: any) {
    const paginatorState = event as PaginatorState;
    this.first = paginatorState.first || 0;
    this.itemsPerPage = paginatorState.rows || 12;
    this.updatePaginatedMovies();
  }

  isSelected(movie: any): boolean {
    return this.selectedMovies.some(m => m._id === movie._id);
  }

  onMovieSelect(movie: any, selected: boolean) {
    if (selected) {
      if (!this.isSelected(movie)) {
        this.selectedMovies.push(movie);
      }
    } else {
      this.selectedMovies = this.selectedMovies.filter(m => m._id !== movie._id);
    }
  }

  openNew() {
    this.newMovie = {
      title: '',
      year: new Date().getFullYear(),
      rating: 0,
      genre: '',
      poster: '',
      totalViews: 0,
      likes: 0,
      dislikes: 0,
      averageRating: 0
    };
    this.editingMovie = null;
    this.displayDialog = true;
  }

  editMovie(movie: any) {
    this.editingMovie = { ...movie };
    this.newMovie = { ...movie };
    this.displayDialog = true;
  }

  saveMovie() {
    const editing = this.editingMovie;
    if (!editing) return;

    const url = apiUrl(API_ENDPOINTS.content.update(editing._id));
    const updateData = {
      title: this.newMovie.title,
      description: this.newMovie.description,
      shortDescription: this.newMovie.shortDescription,
      imdbScore: this.newMovie.imdbScore,
      maxQuality: this.newMovie.maxQuality,
    };

    this.http.put(url, updateData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Film güncellendi' });
        this.displayDialog = false;
        this.editingMovie = null;
        this.newMovie = {};
        this.loadMovies();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: err?.error?.message || 'Film güncellenemedi' });
      }
    });
  }

  deleteMovie(movie: any) {
    this.confirmationService.confirm({
      message: `"${movie.title}" filmini silmek istediğinizden emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const url = apiUrl(API_ENDPOINTS.content.delete(movie._id));
        this.http.delete(url).subscribe({
          next: () => {
            this.selectedMovies = this.selectedMovies.filter(m => m._id !== movie._id);
            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Film silindi' });
            this.loadMovies();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Hata', detail: err?.error?.message || 'Film silinemedi' });
          }
        });
      }
    });
  }

  deleteSelectedMovies() {
    this.confirmationService.confirm({
      message: `${this.selectedMovies.length} filmi silmek istediğinizden emin misiniz?`,
      header: 'Toplu Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const ids = this.selectedMovies.map(m => m._id);
        let completed = 0;
        let failed = 0;
        ids.forEach(id => {
          const url = apiUrl(API_ENDPOINTS.content.delete(id));
          this.http.delete(url).subscribe({
            next: () => {
              completed++;
              if (completed + failed === ids.length) {
                this.selectedMovies = [];
                this.loadMovies();
                if (failed > 0) {
                  this.messageService.add({ severity: 'warn', summary: 'Kısmi Başarı', detail: `${completed} film silindi, ${failed} silinemedi` });
                } else {
                  this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Filmler silindi' });
                }
              }
            },
            error: () => {
              failed++;
              if (completed + failed === ids.length) {
                this.selectedMovies = [];
                this.loadMovies();
                this.messageService.add({ severity: 'warn', summary: 'Kısmi Başarı', detail: `${completed} film silindi, ${failed} silinemedi` });
              }
            }
          });
        });
      }
    });
  }

  getYear(releaseDate: string | undefined): string {
    if (!releaseDate) return '-';
    const y = new Date(releaseDate).getFullYear();
    return isNaN(y) ? '-' : String(y);
  }

  getGenreNames(categories: Genre[] | undefined): string {
    if (!categories?.length) return '-';
    return categories.map(c => c.name).join(', ');
  }

  getSeverity(genre: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (genre) {
      case 'Aksiyon': return 'danger';
      case 'Bilim Kurgu': return 'info';
      case 'Komedi': return 'warn';
      case 'Dram': return 'success';
      default: return 'info';
    }
  }

  searchMovie() {
    const url = apiUrl(API_ENDPOINTS.content.search);
    this.http.post<SearchResult[] | { data: SearchResult[] }>(url, { type: 'movie', name: this.newMovie.title }).subscribe((res) => {
      const results = Array.isArray(res) ? res : (res?.data ?? []);
      this.newMovie.searchResults = results.filter((m: SearchResult) => m.poster != null && m.poster !== '');
    });
  }

  selectMovie(movie: SearchResult) {
    this.confirmationService.confirm({
      message: `"${movie.title}" filmi eklemek istediğinizden emin misiniz?`,
      header: 'Ekleme Onayı',
      icon: 'pi pi-plus',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        const url = apiUrl(API_ENDPOINTS.content.addAutoImport);
        this.http.post(url, { type: 'movie', tmdbId: movie.id }).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Film eklendi' });
          this.displayDialog = false;
          this.loadMovies();
        }, (error) => {
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: error.error.message });
        });
      }
    });
  }

  loadGenres() {
    const url = apiUrl(API_ENDPOINTS.kinds);
    this.http.get<Genre[]>(url).subscribe((res) => {
      this.genres = res;
    });
  }

  loadMovies() {
    const url = apiUrl(API_ENDPOINTS.content.main);
    this.http.get<Movie[]>(url).subscribe((res) => {
      const toAdd = (res || []).filter(m => m.contentType === 'movie');
      toAdd.forEach(movie => this.setMovieStatus(movie));
      this.movies = [...toAdd];
      this.filteredMovies = [...toAdd];
      this.onSearch();
      this.first = 0;
      this.updatePaginatedMovies();
      this.cdr.detectChanges();
    });
  }

  setMovieStatus(movie: Movie)
  {
    if (!movie.videoPath) {
      movie.movieStatus = 0;
    }
    else if (movie.videoPath && movie.status == "draft") {
      movie.movieStatus = 1;
    }
    else if (movie.videoPath && movie.status == "published") {
      movie.movieStatus = 2;
    }
  }

  openFileManager(movie: Movie) {
    // Dosya yöneticisi açma işlemi burada yapılacak
    // Örneğin, yeni bir sayfaya yönlendirebilirsiniz:
    this.router.navigate(['/admin/filemanager', movie._id]);
  }
}
