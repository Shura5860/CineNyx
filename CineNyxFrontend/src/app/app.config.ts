import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./userPages/layout/layout').then((m) => m.Layout),
        children: [
            {
                path: '',
                loadComponent: () => import('./userPages/home/home').then((m) => m.Home)
            },
            {
                path: 'movies',
                loadComponent: () => import('./userPages/movies/movies').then((m) => m.Movies)
            },
            {
                path: 'tv-shows',
                loadComponent: () => import('./userPages/tv-shows/tv-shows').then((m) => m.TvShows)
            },
            {
                path: 'profile',
                loadComponent: () => import('./userPages/profile/profile').then((m) => m.ProfileComponent)
            },
            {
                path: 'film/:id',
                loadComponent: () => import('./player/player').then((m) => m.Player)
            }
        ]
    },
    {
        path: 'register',
        loadComponent: () => import('./userPages/register/register').then((m) => m.RegisterComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./adminPages/layout/layout').then((m) => m.Layout),
        children: [
            {
                path: '',
                loadComponent: () => import('./adminPages/dashboard/dashboard').then((m) => m.Dashboard)
            },
            {
                path: 'movies',
                loadComponent: () => import('./adminPages/movies/movies').then((m) => m.AdminMovies)
            },
            {
                path: 'tv-shows',
                loadComponent: () => import('./adminPages/tv-shows/tv-shows').then((m) => m.AdminTvShows)
            },
            {
                path: 'users',
                loadComponent: () => import('./adminPages/users/users').then((m) => m.AdminUsers)
            },
            {
                path: 'filemanager/:id',
                loadComponent: () => import('./adminPages/add-content/add-content').then((m) => m.AddContent)
            }
        ]
    }
];

export const CinemaPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#ffe5e7',
            100: '#ffbcc1',
            200: '#ff8a91',
            300: '#ff5861',
            400: '#ff2d39',
            500: '#E50914',
            600: '#c40811',
            700: '#a3070e',
            800: '#82060b',
            900: '#610508'
        }
    },
    colorScheme: {
        dark: {
            surface: {
                ground: '#0A0A0B',
                section: '#141417',
                card: '#141417',
                overlay: '#1C1C1F',
                border: 'rgba(255,255,255,0.06)'
            },
            text: {
                primary: '#FFFFFF',
                secondary: '#A3A3A3'
            },
            highlight: {
                background: 'rgba(229,9,20,0.25)',
                color: '#FFFFFF'
            }
        },
        light: {
            surface: {
                ground: '#F5F5F7',
                section: '#FFFFFF',
                card: '#FFFFFF',
                overlay: '#FFFFFF',
                border: '#E0E0E0'
            },
            text: {
                primary: '#111111',
                secondary: '#555555'
            },
            highlight: {
                background: 'rgba(229,9,20,0.12)',
                color: '#E50914'
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
        providePrimeNG({
            theme: {
                preset: CinemaPreset,
                options: {
                    darkModeSelector: '[data-theme="dark"]'
                }
            }
        })
    ]
};
