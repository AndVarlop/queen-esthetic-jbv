import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'servicios',
    loadComponent: () => import('./features/services/services').then(m => m.Services)
  },
  {
    path: 'galeria',
    loadComponent: () => import('./features/gallery/gallery').then(m => m.Gallery)
  },
  {
    path: 'reservar',
    loadComponent: () => import('./features/booking/booking').then(m => m.Booking)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then(m => m.Admin)
  },
  { path: '**', redirectTo: '' }
];
