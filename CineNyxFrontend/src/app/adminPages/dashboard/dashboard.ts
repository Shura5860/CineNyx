import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    TableModule,
    TagModule,
    ButtonModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  constructor(private router: Router) {}

  // İstatistikler
  stats = [
    {
      title: 'Toplam Film',
      value: '1,234',
      icon: 'pi pi-film',
      color: '#E50914',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Toplam Dizi',
      value: '456',
      icon: 'pi pi-tv',
      color: '#6366F1',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Aktif Kullanıcı',
      value: '8,901',
      icon: 'pi pi-users',
      color: '#10B981',
      change: '+23%',
      trend: 'up'
    },
    {
      title: 'Toplam İzlenme',
      value: '2.4M',
      icon: 'pi pi-eye',
      color: '#F59E0B',
      change: '+15%',
      trend: 'up'
    }
  ];

  // Grafik verisi
  chartData: any;
  chartOptions: any;

  // Son aktiviteler
  recentActivities = [
    {
      user: 'Ahmet Yılmaz',
      action: 'Yeni film ekledi',
      item: 'Dune: Part Two',
      time: '2 dakika önce',
      type: 'film'
    },
    {
      user: 'Mehmet Demir',
      action: 'Dizi güncelledi',
      item: 'Breaking Bad',
      time: '15 dakika önce',
      type: 'dizi'
    },
    {
      user: 'Ayşe Kaya',
      action: 'Kullanıcı kaydetti',
      item: 'yeni kullanıcı',
      time: '1 saat önce',
      type: 'user'
    },
    {
      user: 'Fatma Şahin',
      action: 'Film silindi',
      item: 'Eski Film',
      time: '2 saat önce',
      type: 'delete'
    }
  ];

  // Popüler içerikler
  popularContent = [
    {
      title: 'Dune: Part Two',
      type: 'Film',
      views: '125K',
      rating: 8.8,
      status: 'active'
    },
    {
      title: 'Breaking Bad',
      type: 'Dizi',
      views: '98K',
      rating: 9.5,
      status: 'active'
    },
    {
      title: 'Stranger Things',
      type: 'Dizi',
      views: '87K',
      rating: 8.7,
      status: 'active'
    },
    {
      title: 'The Dark Knight',
      type: 'Film',
      views: '76K',
      rating: 9.0,
      status: 'active'
    }
  ];

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = '#FFFFFF';
    const textColorSecondary = '#A3A3A3';
    const surfaceBorder = 'rgba(255, 255, 255, 0.06)';

    this.chartData = {
      labels: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
      datasets: [
        {
          label: 'İzlenme',
          data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
          fill: true,
          backgroundColor: 'rgba(229, 9, 20, 0.2)',
          borderColor: '#E50914',
          tension: 0.4
        },
        {
          label: 'Yeni Kullanıcı',
          data: [800, 1200, 1000, 1500, 1300, 1800, 1600],
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366F1',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    };
  }

  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'active' ? 'success' : 'danger';
  }

  getActivityIcon(type: string): string {
    switch(type) {
      case 'film': return 'pi pi-film';
      case 'dizi': return 'pi pi-tv';
      case 'user': return 'pi pi-user-plus';
      case 'delete': return 'pi pi-trash';
      default: return 'pi pi-info-circle';
    }
  }

  getActivityColor(type: string): string {
    switch(type) {
      case 'film': return '#E50914';
      case 'dizi': return '#6366F1';
      case 'user': return '#10B981';
      case 'delete': return '#EF4444';
      default: return '#A3A3A3';
    }
  }

  goToMovies() {
    this.router.navigate(['/admin/movies'], { queryParams: { addNew: true } });
  }

  goToTvShows() {
    this.router.navigate(['/admin/tv-shows'], { queryParams: { addNew: true } });
  }
}
