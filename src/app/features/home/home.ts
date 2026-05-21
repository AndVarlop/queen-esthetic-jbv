import { Component, signal, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../layout/navbar/navbar';
import { DataService } from '../../services/data.service';
import type { Service, Testimonial, GalleryItem } from '../../core/database.types';

const WHATSAPP_URL = 'https://wa.me/573504132509?text=Hola,%20quiero%20agendar%20una%20cita%20en%20Queen%20Esthetic%20JBV';
const AGENDAPRO_URL = 'https://link.agendapro.com/co/centrodeesteticadepeluqueriaqueen/b36067eb';

const FALLBACK_SERVICES: Partial<Service>[] = [
  { id: '1', name: 'Corte & Peinado', category: 'cabello', price_min: 25000, price_max: 45000, description: 'Corte profesional + secado y estilizado', is_featured: true },
  { id: '2', name: 'Tinte & Color', category: 'cabello', price_min: 80000, price_max: 180000, description: 'Color completo, balayage o mechas', is_featured: true },
  { id: '3', name: 'Manicure & Pedicure', category: 'unas', price_min: 35000, price_max: 65000, description: 'Esmaltado permanente + diseño premium', is_featured: true },
  { id: '4', name: 'Lifting de Pestañas', category: 'cejas_pestanas', price_min: 60000, price_max: 80000, description: 'Curvado + tinte incluido', is_featured: true },
  { id: '5', name: 'Diseño de Cejas', category: 'cejas_pestanas', price_min: 20000, price_max: 35000, description: 'Depilación + diseño personalizado', is_featured: true },
  { id: '6', name: 'Facial Purificante', category: 'facial', price_min: 60000, price_max: 120000, description: 'Limpieza profunda + hidratación', is_featured: true },
];

const FALLBACK_TESTIMONIALS: Partial<Testimonial>[] = [
  { id: '1', client_name: 'María Alejandra', rating: 5, comment: 'Excelente servicio. Me encantó el resultado de mi balayage, quedé como nueva. 100% recomendado.', service_name: 'Tinte & Color' },
  { id: '2', client_name: 'Valentina Díaz', rating: 5, comment: 'Las chicas son muy profesionales y el ambiente es precioso. Mi manicure duró semanas perfecta.', service_name: 'Manicure Premium' },
  { id: '3', client_name: 'Sofía Romero', rating: 5, comment: 'Me hice el lifting de pestañas y quedé enamorada. Definitivamente mi salón favorito en Barranquilla.', service_name: 'Lifting de Pestañas' },
];

const CATEGORY_LABELS: Record<string, string> = {
  cabello: 'Cabello',
  unas: 'Uñas',
  cejas_pestanas: 'Cejas & Pestañas',
  facial: 'Facial',
  maquillaje: 'Maquillaje',
  depilacion: 'Depilación',
  spa: 'Spa',
};

@Component({
  selector: 'app-home',
  imports: [NavbarComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private data = inject(DataService);

  readonly whatsappUrl = WHATSAPP_URL;
  readonly agendaproUrl = AGENDAPRO_URL;
  readonly year = new Date().getFullYear();

  services = signal<Partial<Service>[]>(FALLBACK_SERVICES);
  testimonials = signal<Partial<Testimonial>[]>(FALLBACK_TESTIMONIALS);
  gallery = signal<GalleryItem[]>([]);

  categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }

  formatPrice(min: number, max?: number | null): string {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
    return max ? `${fmt(min)} – ${fmt(max)}` : `Desde ${fmt(min)}`;
  }

  stars(n: number): number[] {
    return Array.from({ length: n });
  }

  constructor() {
    afterNextRender(() => {
      this.runEntranceAnimations();
      this.loadData();
    });
  }

  private async loadData(): Promise<void> {
    const [services, testimonials, gallery] = await Promise.all([
      this.data.getFeaturedServices(),
      this.data.getTestimonials(),
      this.data.getFeaturedGallery(),
    ]);
    if (services.length) this.services.set(services);
    if (testimonials.length) this.testimonials.set(testimonials);
    if (gallery.length) this.gallery.set(gallery);
  }

  private async runEntranceAnimations(): Promise<void> {
    const { animate, stagger } = await import('animejs');

    animate('.hero-badge', { opacity: [0, 1], translateY: [-16, 0], duration: 700, easing: 'outExpo', delay: 300 });
    animate('.hero-title .line', { opacity: [0, 1], translateY: [70, 0], duration: 950, easing: 'outExpo', delay: stagger(180, { start: 550 }) });
    animate('.hero-subtitle', { opacity: [0, 1], translateY: [24, 0], duration: 750, easing: 'outExpo', delay: 1080 });
    animate('.hero-actions', { opacity: [0, 1], translateY: [24, 0], duration: 750, easing: 'outExpo', delay: 1260 });
    animate('.hero-stats', { opacity: [0, 1], translateY: [20, 0], duration: 700, easing: 'outExpo', delay: 1480 });
    animate('.hero-scroll', { opacity: [0, 0.65], translateY: [12, 0], duration: 600, easing: 'outExpo', delay: 1900 });

    animate('.hero-orb-1', { translateX: [0, 40], translateY: [0, -30], duration: 8000, easing: 'inOutSine', loop: true, direction: 'alternate' });
    animate('.hero-orb-2', { translateX: [0, -30], translateY: [0, 40], duration: 10000, easing: 'inOutSine', loop: true, direction: 'alternate' });
  }
}
