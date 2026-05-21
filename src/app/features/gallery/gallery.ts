import { Component, signal, computed, afterNextRender, inject } from '@angular/core';
import { NavbarComponent } from '../../layout/navbar/navbar';
import { DataService } from '../../services/data.service';
import type { GalleryItem } from '../../core/database.types';

const CATEGORY_MAP: Record<string, string> = {
  todos: 'Todos',
  cabello: 'Cabello',
  unas: 'Uñas',
  cejas_pestanas: 'Cejas & Pestañas',
  facial: 'Facial',
  maquillaje: 'Maquillaje',
};

@Component({
  selector: 'app-gallery',
  imports: [NavbarComponent],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  private data = inject(DataService);

  readonly agendaproUrl = 'https://link.agendapro.com/co/centrodeesteticadepeluqueriaqueen/b36067eb';

  items = signal<GalleryItem[]>([]);
  activeCategory = signal('todos');
  lightboxItem = signal<GalleryItem | null>(null);

  categories = computed(() => {
    const cats = [...new Set(this.items().map(i => i.category).filter(Boolean))] as string[];
    return ['todos', ...cats];
  });

  filtered = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'todos') return this.items();
    return this.items().filter(i => i.category === cat);
  });

  categoryLabel(cat: string): string {
    return CATEGORY_MAP[cat] ?? cat;
  }

  placeholders = Array.from({ length: 12 });

  constructor() {
    afterNextRender(() => {
      this.data.getAllGallery().then(items => this.items.set(items));
    });
  }

  openLightbox(item: GalleryItem): void {
    this.lightboxItem.set(item);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxItem.set(null);
    document.body.style.overflow = '';
  }
}
