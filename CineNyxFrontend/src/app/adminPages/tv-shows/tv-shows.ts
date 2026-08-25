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

interface TvShow {
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
  season?: number;
  episode?: number;
}

@Component({
  selector: 'app-admin-tv-shows',
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
  templateUrl: './tv-shows.html',
  styleUrl: './tv-shows.css',
  providers: [ConfirmationService, MessageService]
})
export class AdminTvShows implements OnInit {
  tvShows: any[] = [];
  filteredTvShows: any[] = [];
  selectedTvShows: any[] = [];
  displayDialog: boolean = false;
  searchQuery: string = '';
  itemsPerPage: number = 12;
  first: number = 0;
  paginatedTvShows: any[] = [];
  sortOption: any = null;
  sortOptions: any[] = [
    { label: 'Sıralama Seçin', value: null },
    { label: 'En Çok İzlenenler', value: 'watchCount-desc' },
    { label: 'En Az İzlenenler', value: 'watchCount-asc' },
    { label: 'En Çok Beğenilenler', value: 'likeCount-desc' },
    { label: 'En Az Beğenilenler', value: 'likeCount-asc' },
    { label: 'En Yüksek Puanlılar', value: 'averageRating-desc' },
    { label: 'En Düşük Puanlılar', value: 'averageRating-asc' },
    { label: 'En Çok Beğenilmeyenler', value: 'dislikeCount-desc' },
    { label: 'En Az Beğenilmeyenler', value: 'dislikeCount-asc' },
    { label: 'En Yüksek IMDB Puanı', value: 'imdbScore-desc' },
    { label: 'En Düşük IMDB Puanı', value: 'imdbScore-asc' }
  ];
  newTvShow: any = {
    title: '',
    searchResults: [] as SearchResult[]
  };
  editingTvShow: TvShow | null = null;
  genres: Genre[] = [];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTvShows();
    this.updatePaginatedTvShows();

    this.route.queryParams.subscribe(params => {
      if (params['addNew'] === 'true') {
        this.openNew();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  loadTvShows() {
    const url = apiUrl(API_ENDPOINTS.content.main);
    this.http.get<TvShow[]>(url).subscribe((res) => {
      const toAdd = (res || []).filter(m => m.contentType === 'serie' && !m.season && !m.episode);
      toAdd.forEach(show => this.setTvShowStatus(show));
      this.tvShows = [...toAdd];
      this.filteredTvShows = [...toAdd];
      this.onSearch();
      this.first = 0;
      this.updatePaginatedTvShows();
      this.cdr.detectChanges();
    });
  }

  setTvShowStatus(show: TvShow) {
    if (!show.videoPath) {
      show.movieStatus = 0;
    } else if (show.videoPath && show.status === 'draft') {
      show.movieStatus = 1;
    } else if (show.videoPath && show.status === 'published') {
      show.movieStatus = 2;
    }
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredTvShows = [...this.tvShows];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredTvShows = this.tvShows.filter(t => 
        t.title.toLowerCase().includes(query)
      );
    }
    this.applySorting();
    this.first = 0;
    this.updatePaginatedTvShows();
  }

  onSortChange() {
    this.applySorting();
    this.first = 0;
    this.updatePaginatedTvShows();
  }

  applySorting() {
    if (!this.sortOption) return;
    const [field, order] = this.sortOption.split('-');
    this.filteredTvShows = [...this.filteredTvShows].sort((a, b) => {
      const aVal = a[field as keyof TvShow];
      const bVal = b[field as keyof TvShow];
      const aValue = typeof aVal === 'number' ? aVal : Number(aVal) || 0;
      const bValue = typeof bVal === 'number' ? bVal : Number(bVal) || 0;
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }

  updatePaginatedTvShows() {
    const start = this.first;
    const end = start + this.itemsPerPage;
    this.paginatedTvShows = this.filteredTvShows.slice(start, end);
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
    this.updatePaginatedTvShows();
  }

  isSelected(tvShow: any): boolean {
    return this.selectedTvShows.some(t => t._id === tvShow._id);
  }

  onTvShowSelect(tvShow: any, selected: boolean) {
    if (selected) {
      if (!this.isSelected(tvShow)) this.selectedTvShows.push(tvShow);
    } else {
      this.selectedTvShows = this.selectedTvShows.filter(t => t._id !== tvShow._id);
    }
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

  openNew() {
    this.newTvShow = {
      title: '',
      searchResults: [] as SearchResult[]
    };
    this.editingTvShow = null;
    this.displayDialog = true;
  }

  searchTvShow() {
    const url = apiUrl(API_ENDPOINTS.content.search);
    this.http.post<SearchResult[] | { data: SearchResult[] }>(url, { type: 'tv', name: this.newTvShow.title }).subscribe((res) => {
      const results = Array.isArray(res) ? res : (res?.data ?? []);
      this.newTvShow.searchResults = results.filter((m: SearchResult) => m.poster != null && m.poster !== '');
    });
  }

  selectTvShow(show: SearchResult) {
    this.confirmationService.confirm({
      message: `"${show.title}" dizisini eklemek istediğinizden emin misiniz?`,
      header: 'Ekleme Onayı',
      icon: 'pi pi-plus',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        const url = apiUrl(API_ENDPOINTS.content.addAutoImport);
        this.http.post(url, { type: 'tv', tmdbId: show.id }).subscribe(() => {
          this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Dizi eklendi' });
          this.displayDialog = false;
          this.loadTvShows();
        }, (error) => {
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: error?.error?.message || 'Dizi eklenemedi' });
        });
      }
    });
  }

  editTvShow(tvShow: any) {
    this.editingTvShow = { ...tvShow };
    this.newTvShow = { ...tvShow };
    this.displayDialog = true;
  }

  saveTvShow() {
    const editing = this.editingTvShow;
    if (!editing) return;

    const url = apiUrl(API_ENDPOINTS.content.update(editing._id));
    const updateData = {
      title: this.newTvShow.title,
      description: this.newTvShow.description,
      shortDescription: this.newTvShow.shortDescription,
      imdbScore: this.newTvShow.imdbScore,
      maxQuality: this.newTvShow.maxQuality,
    };

    this.http.put(url, updateData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Dizi güncellendi' });
        this.displayDialog = false;
        this.editingTvShow = null;
        this.newTvShow = {};
        this.loadTvShows();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: err?.error?.message || 'Dizi güncellenemedi' });
      }
    });
  }

  deleteTvShow(tvShow: any) {
    this.confirmationService.confirm({
      message: `"${tvShow.title}" dizisini silmek istediğinizden emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const url = apiUrl(API_ENDPOINTS.content.delete(tvShow._id));
        this.http.delete(url).subscribe({
          next: () => {
            this.selectedTvShows = this.selectedTvShows.filter(t => t._id !== tvShow._id);
            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Dizi silindi' });
            this.loadTvShows();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Hata', detail: err?.error?.message || 'Dizi silinemedi' });
          }
        });
      }
    });
  }

  deleteSelectedTvShows() {
    this.confirmationService.confirm({
      message: `${this.selectedTvShows.length} diziyi silmek istediğinizden emin misiniz?`,
      header: 'Toplu Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const ids = this.selectedTvShows.map(t => t._id);
        let completed = 0;
        let failed = 0;
        ids.forEach(id => {
          const url = apiUrl(API_ENDPOINTS.content.delete(id));
          this.http.delete(url).subscribe({
            next: () => {
              completed++;
              if (completed + failed === ids.length) {
                this.selectedTvShows = [];
                this.loadTvShows();
                if (failed > 0) {
                  this.messageService.add({ severity: 'warn', summary: 'Kısmi Başarı', detail: `${completed} dizi silindi, ${failed} silinemedi` });
                } else {
                  this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Diziler silindi' });
                }
              }
            },
            error: () => {
              failed++;
              if (completed + failed === ids.length) {
                this.selectedTvShows = [];
                this.loadTvShows();
                this.messageService.add({ severity: 'warn', summary: 'Kısmi Başarı', detail: `${completed} dizi silindi, ${failed} silinemedi` });
              }
            }
          });
        });
      }
    });
  }

  getSeverity(genre: string): 'success' | 'info' | 'warn' | 'danger' {
    switch(genre) {
      case 'Aksiyon': return 'danger';
      case 'Bilim Kurgu': return 'info';
      case 'Komedi': return 'warn';
      case 'Dram': return 'success';
      default: return 'info';
    }
  }

  openFileManager(tvShow: TvShow) {
    this.router.navigate(['/admin/filemanager', tvShow._id]);
  }
}
