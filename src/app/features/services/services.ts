import { Component, signal, computed, afterNextRender, inject } from '@angular/core';
import { NavbarComponent } from '../../layout/navbar/navbar';
import { DataService } from '../../services/data.service';
import type { Service } from '../../core/database.types';

const CATEGORY_LABELS: Record<string, string> = {
  todos: 'Todos',
  cabello: 'Cabello',
  unas: 'Uñas',
  cejas_pestanas: 'Cejas & Pestañas',
  facial: 'Facial',
  maquillaje: 'Maquillaje',
  depilacion: 'Depilación',
  spa: 'Spa',
};

const CATEGORY_ICONS: Record<string, string> = {
  cabello: '✂',
  unas: '💅',
  cejas_pestanas: '✨',
  facial: '🌿',
  maquillaje: '💄',
  depilacion: '🪶',
  spa: '🛁',
};

@Component({
  selector: 'app-services',
  imports: [NavbarComponent],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services {
  private data = inject(DataService);

  readonly agendaproUrl = 'https://link.agendapro.com/co/centrodeesteticadepeluqueriaqueen/b36067eb';
  readonly whatsappUrl = 'https://wa.me/573504132509?text=Hola,%20quiero%20información%20sobre%20sus%20servicios';

  allServices = signal<Service[]>([]);
  activeCategory = signal('todos');

  categories = computed(() => {
    const cats = [...new Set(this.allServices().map(s => s.category))];
    return ['todos', ...cats];
  });

  filtered = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'todos') return this.allServices();
    return this.allServices().filter(s => s.category === cat);
  });

  categoryLabel(cat: string): string { return CATEGORY_LABELS[cat] ?? cat; }
  categoryIcon(cat: string): string { return CATEGORY_ICONS[cat] ?? '✦'; }

  formatPrice(min: number, max?: number | null): string {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
    return max ? `${fmt(min)} – ${fmt(max)}` : `Desde ${fmt(min)}`;
  }

  formatDuration(min?: number | null): string {
    if (!min) return '';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }

  constructor() {
    afterNextRender(() => {
      this.data.getAllServices().then(s => this.allServices.set(s));
    });
  }
}
