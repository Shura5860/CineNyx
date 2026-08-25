import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

interface UserItem {
  _id: string;
  username: string;
  email: string;
  role: string;
  blocked: boolean;
  profileImage: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, AvatarModule,
    TagModule, PaginatorModule, TooltipModule, DialogModule,
    RadioButtonModule, ToastModule, ConfirmDialogModule, ToggleSwitchModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsers implements OnInit {
  users: UserItem[] = [];
  totalUsers = 0;
  loading = false;

  searchQuery = '';
  selectedRole = 'all';

  // pagination
  first = 0;
  itemsPerPage = 12;
  currentPage = 1;

  // stats
  totalCount = 0;
  adminCount = 0;
  userCount = 0;
  blockedCount = 0;

  // edit dialog
  showEditDialog = false;
  editTarget: UserItem | null = null;
  editForm = {
    username: '',
    email: '',
    role: '',
    blocked: false
  };
  saving = false;

  private searchTimeout: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['role'] && params['role'] !== this.selectedRole) {
        this.selectedRole = params['role'];
        this.first = 0;
        this.currentPage = 1;
      }
      this.loadUsers();
      this.loadStats();
    });
  }

  loadUsers(): void {
    this.loading = true;
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());

    if (this.selectedRole !== 'all') {
      params = params.set('role', this.selectedRole);
    }
    if (this.searchQuery.trim()) {
      params = params.set('search', this.searchQuery.trim());
    }

    this.http.get<any>(`${API_BASE_URL}${API_ENDPOINTS.users.list}`, { params }).subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.totalUsers = res.total || 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kullanıcılar yüklenemedi' });
        this.cdr.markForCheck();
      }
    });
  }

  loadStats(): void {
    this.http.get<any>(`${API_BASE_URL}${API_ENDPOINTS.users.stats}`).subscribe({
      next: (res) => {
        this.totalCount = res.total || 0;
        this.adminCount = res.admins || 0;
        this.userCount = res.users || 0;
        this.blockedCount = res.blocked || 0;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.first = 0;
      this.currentPage = 1;
      this.loadUsers();
    }, 350);
  }

  filterByRole(role: string): void {
    this.selectedRole = role;
    this.first = 0;
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.itemsPerPage = event.rows;
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.loadUsers();
  }

  toggleBlock(user: UserItem): void {
    const action = user.blocked ? 'aktif' : 'engellenmiş';
    this.http.put<any>(`${API_BASE_URL}${API_ENDPOINTS.users.toggleBlock(user._id)}`, {}).subscribe({
      next: (res) => {
        user.blocked = res.data.blocked;
        this.messageService.add({
          severity: 'success',
          summary: 'Başarılı',
          detail: `${user.username} artık ${action}`
        });
        this.loadStats();
        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'İşlem başarısız' });
      }
    });
  }

  openEditDialog(user: UserItem): void {
    this.editTarget = user;
    this.editForm = {
      username: user.username,
      email: user.email,
      role: user.role,
      blocked: user.blocked
    };
    this.showEditDialog = true;
    this.cdr.markForCheck();
  }

  saveEdit(): void {
    if (!this.editTarget) return;

    const body: any = {};
    if (this.editForm.username !== this.editTarget.username) body.username = this.editForm.username;
    if (this.editForm.email !== this.editTarget.email) body.email = this.editForm.email;
    if (this.editForm.role !== this.editTarget.role) body.role = this.editForm.role;
    if (this.editForm.blocked !== this.editTarget.blocked) body.blocked = this.editForm.blocked;

    if (Object.keys(body).length === 0) {
      this.showEditDialog = false;
      return;
    }

    this.saving = true;
    this.http.put<any>(
      `${API_BASE_URL}${API_ENDPOINTS.users.update(this.editTarget._id)}`,
      body
    ).subscribe({
      next: (res) => {
        const updated = res.data;
        if (this.editTarget) {
          this.editTarget.username = updated.username;
          this.editTarget.email = updated.email;
          this.editTarget.role = updated.role;
          this.editTarget.blocked = updated.blocked;
        }
        this.saving = false;
        this.showEditDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'Kullanıcı bilgileri güncellendi'
        });
        this.loadStats();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || 'Güncelleme başarısız';
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: msg });
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(user: UserItem): void {
    this.confirmationService.confirm({
      message: `"${user.username}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      header: 'Kullanıcıyı Sil',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Sil',
      rejectLabel: 'İptal',
      accept: () => {
        this.http.delete(`${API_BASE_URL}${API_ENDPOINTS.users.delete(user._id)}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Başarılı',
              detail: `${user.username} silindi`
            });
            this.loadUsers();
            this.loadStats();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kullanıcı silinemedi' });
          }
        });
      }
    });
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (role) {
      case 'admin': return 'danger';
      case 'moderator': return 'warn';
      default: return 'info';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderatör';
      default: return 'Kullanıcı';
    }
  }

  getBlockSeverity(blocked: boolean): 'success' | 'danger' {
    return blocked ? 'danger' : 'success';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getInitial(user: UserItem): string {
    return (user.username || '?').charAt(0).toUpperCase();
  }
}
