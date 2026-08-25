import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';

import {
  FileManagerService,
  ContentDto,
  SoundOption,
  SubtitleOption,
} from '../../services/file-manager.service';

@Component({
  selector: 'app-add-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
    ProgressBarModule,
    TabsModule,
    CheckboxModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './add-content.html',
  styleUrl: './add-content.css',
})
export class AddContent implements OnInit {
  /* ---- Core state ---- */
  contentId = '';
  contentType: 'movie' | 'serie' = 'movie';
  content: ContentDto | null = null;
  loading = true;

  /* ---- Target id (film → content id, serie → selected episode id) ---- */
  targetId = '';

  /* ---- File lists for the active target ---- */
  soundOptions: SoundOption[] = [];
  subtitleOptions: SubtitleOption[] = [];

  /* ---- Upload progress flags ---- */
  videoUploading = false;
  soundUploading = false;
  subtitleUploading = false;

  /* ---- Serie-specific ---- */
  episodes: ContentDto[] = [];
  selectedEpisode: ContentDto | null = null;

  /* ---- Episode dialog ---- */
  showEpisodeDialog = false;
  newEpisode = { title: '', season: 1, episode: 1, description: '' };

  /* ---- Add language dialogs ---- */
  showSoundDialog = false;
  showSubtitleDialog = false;
  newLanguage = '';

  /* ---- Video audio extraction dialog ---- */
  showVideoAudioDialog = false;
  pendingVideoFile: File | null = null;
  videoHasAudio = false;
  videoAudioLanguage = '';

  /* ---- OpenSubtitles search ---- */
  showOsSearchDialog = false;
  osResults: any[] = [];
  osSearching = false;
  osImporting: string | null = null;

  constructor(
    private fms: FileManagerService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private msgService: MessageService,
    private confirmService: ConfirmationService,
  ) {}

  /* ================================================================ */
  /*  LIFECYCLE                                                       */
  /* ================================================================ */

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idFromPath = params.get('id') || '';
      const idFromQuery =
        this.route.snapshot.queryParamMap.get('contentId') || '';
      this.contentId = idFromPath || idFromQuery;

      if (!this.contentId) {
        this.toast('error', 'Hata', 'İçerik ID bulunamadı.');
        return;
      }

      this.loadContent();
    });
  }

  /* ================================================================ */
  /*  DATA LOADING                                                    */
  /* ================================================================ */

  loadContent(): void {
    this.loading = true;
    this.fms.getContentById(this.contentId).subscribe({
      next: (dto) => {
        this.content = {
          ...dto,
          _id: dto._id || (dto as any).id || this.contentId,
          videoPath:
            dto.videoPath || dto.video_url_1080 || dto.hls_url || null,
          imagePath: dto.imagePath || dto.poster_url || '',
          contentType: dto.contentType || 'movie',
          status: dto.status || 'draft',
        };
        this.contentType = this.content.contentType;

        if (this.contentType === 'movie') {
          this.targetId = this.content._id;
          this.loadFileOptions();
        } else {
          this.loadEpisodes();
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast('error', 'Hata', 'İçerik yüklenemedi.');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadEpisodes(): void {
    const serieId = this.content?.serieId || this.content?._id || '';
    this.fms.getEpisodesBySerie(serieId).subscribe({
      next: (eps) => {
        this.episodes = (eps || []).sort(
          (a, b) =>
            (a.season ?? 0) - (b.season ?? 0) ||
            (a.episode ?? 0) - (b.episode ?? 0),
        );
        // auto-select first episode
        if (this.episodes.length && !this.selectedEpisode) {
          this.selectEpisode(this.episodes[0]);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast('error', 'Hata', 'Bölümler yüklenemedi.');
      },
    });
  }

  loadFileOptions(): void {
    if (!this.targetId) return;

    this.fms.getSoundOptions(this.targetId).subscribe({
      next: (s) => {
        this.soundOptions = s || [];
        this.cdr.markForCheck();
      },
    });

    this.fms.getSubtitleOptions(this.targetId).subscribe({
      next: (s) => {
        this.subtitleOptions = s || [];
        this.cdr.markForCheck();
      },
    });
  }

  /* ================================================================ */
  /*  EPISODE MANAGEMENT                                              */
  /* ================================================================ */

  selectEpisode(ep: ContentDto): void {
    this.selectedEpisode = ep;
    this.targetId = ep._id;
    this.soundOptions = [];
    this.subtitleOptions = [];
    this.loadFileOptions();
  }

  openEpisodeDialog(): void {
    this.newEpisode = { title: '', season: 1, episode: 1, description: '' };
    this.showEpisodeDialog = true;
  }

  saveEpisode(): void {
    if (!this.newEpisode.title) {
      this.toast('warn', 'Uyarı', 'Bölüm adı zorunlu.');
      return;
    }

    const serieId = this.content?.serieId || this.content?._id || '';
    this.fms.createEpisode({ serieId, ...this.newEpisode }).subscribe({
      next: () => {
        this.toast('success', 'Başarılı', 'Bölüm eklendi.');
        this.showEpisodeDialog = false;
        this.loadEpisodes();
      },
      error: () => this.toast('error', 'Hata', 'Bölüm eklenemedi.'),
    });
  }

  confirmDeleteEpisode(ep: ContentDto): void {
    this.confirmService.confirm({
      message: `"${ep.title}" bölümünü silmek istediğinize emin misiniz?`,
      header: 'Bölüm Sil',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fms.deleteEpisode(ep._id).subscribe({
          next: () => {
            this.toast('success', 'Silindi', 'Bölüm silindi.');
            if (this.selectedEpisode?._id === ep._id) {
              this.selectedEpisode = null;
              this.targetId = '';
              this.soundOptions = [];
              this.subtitleOptions = [];
            }
            this.loadEpisodes();
          },
          error: () => this.toast('error', 'Hata', 'Bölüm silinemedi.'),
        });
      },
    });
  }

  /* ================================================================ */
  /*  VIDEO UPLOAD                                                    */
  /* ================================================================ */

  onVideoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.targetId) return;

    // Dosyayı sakla ve ses dialogını aç
    this.pendingVideoFile = file;
    this.videoHasAudio = false;
    this.videoAudioLanguage = '';
    this.showVideoAudioDialog = true;
    this.cdr.markForCheck();
  }

  confirmVideoUpload(): void {
    if (!this.pendingVideoFile || !this.targetId) return;

    const extractAudio = this.videoHasAudio;
    const audioLanguage = this.videoAudioLanguage;
    this.showVideoAudioDialog = false;

    this.videoUploading = true;
    this.cdr.markForCheck();

    this.fms.uploadVideo(this.targetId, this.pendingVideoFile, extractAudio, audioLanguage).subscribe({
      next: (res) => {
        this.videoUploading = false;
        this.pendingVideoFile = null;

        if (res?.extractedAudio?.error) {
          this.toast('warn', 'Kısmi Başarı', `Video yüklendi ancak ses çıkarılamadı: ${res.extractedAudio.error}`);
        } else if (res?.extractedAudio?.url) {
          this.toast('success', 'Başarılı', `Video yüklendi ve "${audioLanguage}" ses dosyası oluşturuldu.`);
        } else {
          this.toast('success', 'Başarılı', 'Video yüklendi.');
        }

        if (this.contentType === 'movie') {
          this.loadContent();
        } else {
          this.loadEpisodes();
          if (this.selectedEpisode) {
            this.fms.getContentById(this.selectedEpisode._id).subscribe({
              next: (dto) => {
                this.selectedEpisode = dto;
                this.cdr.markForCheck();
              },
            });
          }
        }
        // Ses listesini de güncelle
        this.loadFileOptions();
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast('error', 'Hata', 'Video yüklenemedi.');
        this.videoUploading = false;
        this.pendingVideoFile = null;
        this.cdr.markForCheck();
      },
    });
  }

  cancelVideoUpload(): void {
    this.showVideoAudioDialog = false;
    this.pendingVideoFile = null;
    this.videoHasAudio = false;
    this.videoAudioLanguage = '';
    // file input'ı temizle
    const videoInput = document.getElementById('videoInput') as HTMLInputElement;
    if (videoInput) videoInput.value = '';
  }

  /* ================================================================ */
  /*  SOUND OPTIONS                                                   */
  /* ================================================================ */

  openSoundDialog(): void {
    this.newLanguage = '';
    this.showSoundDialog = true;
  }

  addSoundOption(): void {
    if (!this.newLanguage || !this.targetId) return;
    this.fms.createSoundOption(this.targetId, this.newLanguage).subscribe({
      next: () => {
        this.toast('success', 'Başarılı', 'Ses seçeneği eklendi.');
        this.showSoundDialog = false;
        this.loadFileOptions();
      },
      error: () => this.toast('error', 'Hata', 'Ses seçeneği eklenemedi.'),
    });
  }

  onSoundFileSelected(event: Event, opt: SoundOption): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.soundUploading = true;
    this.cdr.markForCheck();

    this.fms.uploadSound(opt._id, file).subscribe({
      next: () => {
        this.toast(
          'success',
          'Başarılı',
          `"${opt.language}" ses dosyası yüklendi.`,
        );
        this.soundUploading = false;
        this.loadFileOptions();
      },
      error: () => {
        this.toast('error', 'Hata', 'Ses dosyası yüklenemedi.');
        this.soundUploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSoundVideoSelected(event: Event, opt: SoundOption): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.soundUploading = true;
    this.cdr.markForCheck();

    this.fms.uploadSoundFromVideo(opt._id, file).subscribe({
      next: () => {
        this.toast(
          'success',
          'Başarılı',
          `"${opt.language}" videodan ses çıkarıldı ve yüklendi.`,
        );
        this.soundUploading = false;
        this.loadFileOptions();
      },
      error: () => {
        this.toast('error', 'Hata', 'Videodan ses çıkarılamadı.');
        this.soundUploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  confirmDeleteSound(opt: SoundOption): void {
    this.confirmService.confirm({
      message: `"${opt.language}" ses seçeneğini silmek istediğinize emin misiniz?`,
      header: 'Ses Seçeneğini Sil',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fms.deleteSound(opt._id).subscribe({
          next: () => {
            this.toast('success', 'Silindi', 'Ses seçeneği silindi.');
            this.loadFileOptions();
          },
          error: () => this.toast('error', 'Hata', 'Silinemedi.'),
        });
      },
    });
  }

  /* ================================================================ */
  /*  SUBTITLE OPTIONS                                                */
  /* ================================================================ */

  openSubtitleDialog(): void {
    this.newLanguage = '';
    this.showSubtitleDialog = true;
  }

  addSubtitleOption(): void {
    if (!this.newLanguage || !this.targetId) return;
    this.fms.createSubtitleOption(this.targetId, this.newLanguage).subscribe({
      next: () => {
        this.toast('success', 'Başarılı', 'Altyazı seçeneği eklendi.');
        this.showSubtitleDialog = false;
        this.loadFileOptions();
      },
      error: () =>
        this.toast('error', 'Hata', 'Altyazı seçeneği eklenemedi.'),
    });
  }

  onSubtitleFileSelected(event: Event, opt: SubtitleOption): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.subtitleUploading = true;
    this.cdr.markForCheck();

    this.fms.uploadSubtitle(opt._id, file).subscribe({
      next: () => {
        this.toast(
          'success',
          'Başarılı',
          `"${opt.language}" altyazı dosyası yüklendi.`,
        );
        this.subtitleUploading = false;
        this.loadFileOptions();
      },
      error: () => {
        this.toast('error', 'Hata', 'Altyazı dosyası yüklenemedi.');
        this.subtitleUploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  confirmDeleteSubtitle(opt: SubtitleOption): void {
    this.confirmService.confirm({
      message: `"${opt.language}" altyazı seçeneğini silmek istediğinize emin misiniz?`,
      header: 'Altyazı Seçeneğini Sil',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fms.deleteSubtitle(opt._id).subscribe({
          next: () => {
            this.toast('success', 'Silindi', 'Altyazı seçeneği silindi.');
            this.loadFileOptions();
          },
          error: () => this.toast('error', 'Hata', 'Silinemedi.'),
        });
      },
    });
  }

  /* ================================================================ */
  /*  OPENSUBTITLES SEARCH                                            */
  /* ================================================================ */

  openOsSearch(): void {
    this.osResults = [];
    this.showOsSearchDialog = true;
    this.osSearching = true;
    this.cdr.markForCheck();

    // DB'den tmdbId çekilip otomatik aranacak
    this.fms.searchOpenSubtitles(this.targetId).subscribe({
      next: (data) => {
        this.osResults = data.results || [];
        this.osSearching = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast('error', 'Hata', err?.error?.message || 'OpenSubtitles araması başarısız.');
        this.osSearching = false;
        this.cdr.markForCheck();
      },
    });
  }

  importOsSubtitle(item: any): void {
    if (!this.targetId || !item.fileId) return;
    this.osImporting = item.fileId;
    this.cdr.markForCheck();

    this.fms.importOpenSubtitle(item.fileId, this.targetId, item.language).subscribe({
      next: () => {
        this.toast('success', 'Başarılı', `"${item.language}" altyazı içe aktarıldı.`);
        this.osImporting = null;
        // İndirilen dili listeden kaldır
        this.osResults = this.osResults.filter(r => r.language !== item.language);
        this.loadFileOptions();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast('error', 'Hata', err?.error?.message || 'İçe aktarma başarısız.');
        this.osImporting = null;
        this.cdr.markForCheck();
      },
    });
  }

  /* ================================================================ */
  /*  PUBLISH                                                         */
  /* ================================================================ */

  publishContent(): void {
    this.fms.publishContent(this.contentId).subscribe({
      next: () => {
        this.toast('success', 'Başarılı', 'İçerik yayınlandı.');
        this.loadContent();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Yayınlanamadı.';
        this.toast('error', 'Hata', msg);
      },
    });
  }

  /* ================================================================ */
  /*  NAVIGATION                                                      */
  /* ================================================================ */

  goBack(): void {
    if (this.contentType === 'movie') {
      this.router.navigate(['/admin/movies']);
    } else {
      this.router.navigate(['/admin/tv-shows']);
    }
  }

  /* ================================================================ */
  /*  HELPERS                                                         */
  /* ================================================================ */

  get currentVideoPath(): string | null {
    if (this.contentType === 'movie') {
      return (
        this.content?.videoPath ||
        this.content?.video_url_1080 ||
        this.content?.hls_url ||
        null
      );
    }
    return (
      this.selectedEpisode?.videoPath ||
      this.selectedEpisode?.video_url_1080 ||
      this.selectedEpisode?.hls_url ||
      null
    );
  }

  get targetLabel(): string {
    if (this.contentType === 'movie') {
      return this.content?.title || 'Film';
    }
    if (this.selectedEpisode) {
      return `S${this.selectedEpisode.season ?? '?'}E${this.selectedEpisode.episode ?? '?'} - ${this.selectedEpisode.title}`;
    }
    return 'Bölüm seçin';
  }

  private toast(
    severity: 'success' | 'info' | 'warn' | 'error',
    summary: string,
    detail: string,
  ): void {
    this.msgService.add({ severity, summary, detail, life: 4000 });
  }
}
