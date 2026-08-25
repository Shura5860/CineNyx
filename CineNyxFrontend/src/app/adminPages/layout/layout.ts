import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { Menu, MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Router, RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { MenuItem, MessageService } from 'primeng/api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AvatarModule, BadgeModule, MenuModule, RippleModule, 
    BreadcrumbModule, RouterModule, MenubarModule, ToastModule
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  providers: [MessageService]
})
export class Layout implements OnInit {
  items: MenuItem[] | undefined;
  isProfileMenuOpen: boolean = false;

  constructor(private router: Router) {}

    ngOnInit() {
        this.items = [
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                items: [
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-chart-bar',
                        command: () => {
                            this.router.navigate(['/admin']);
                        }
                    }
                ]
            },
            {
                separator: true
            },
            {
                label: 'İçerik Yönetimi',
                items: [
                    {
                        label: 'Filmler',
                        icon: 'pi pi-film',
                        routerLink: '/admin/movies'
                    },
                    {
                        label: 'Diziler',
                        icon: 'pi pi-tv',
                        routerLink: '/admin/tv-shows'
                    }
                ]
            },
            {
                separator: true
            },
            {
                label: 'Kullanıcılar',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Tüm Kullanıcılar',
                        icon: 'pi pi-users',
                        command: () => {
                            this.router.navigate(['/admin/users'], { queryParams: { role: 'all' } });
                        }
                    },
                    {
                        label: 'Admin',
                        icon: 'pi pi-shield',
                        command: () => {
                            this.router.navigate(['/admin/users'], { queryParams: { role: 'admin' } });
                        }
                    },
                    {
                        label: 'Moderatör',
                        icon: 'pi pi-star',
                        command: () => {
                            this.router.navigate(['/admin/users'], { queryParams: { role: 'moderator' } });
                        }
                    },
                    {
                        label: 'Üye',
                        icon: 'pi pi-user',
                        command: () => {
                            this.router.navigate(['/admin/users'], { queryParams: { role: 'user' } });
                        }
                    }
                ]
            },
            {
                label: 'Ayarlar',
                icon: 'pi pi-cog',
                routerLink: '/admin/settings'
            }
        ];
    }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  onLogout() {
    // Logout işlemi
    console.log('Logout');
    this.closeProfileMenu();
    // Gerçek logout işlemi buraya eklenecek
    // this.authService.logout();
    // this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const userSection = target.closest('.admin-user-section');
    if (!userSection && this.isProfileMenuOpen) {
      this.closeProfileMenu();
    }
  }
}
