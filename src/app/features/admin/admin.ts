import { Component, signal, computed, inject, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SupabaseService } from '../../core/supabase.service';
import type { Booking, BookingStatus, Service, GalleryItem, Testimonial } from '../../core/database.types';

type AdminTab = 'reservas' | 'servicios' | 'galeria' | 'testimonios';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada',
  cancelled: 'Cancelada', completed: 'Completada'
};

const CATEGORIES = ['cabello', 'unas', 'cejas_pestanas', 'facial', 'maquillaje', 'depilacion', 'spa'];

@Component({
  selector: 'app-admin',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private sb = inject(SupabaseService);

  /* Auth */
  email = signal('');
  password = signal('');
  isAuth = signal(false);
  authLoading = signal(false);
  authError = signal('');

  /* Nav */
  tab = signal<AdminTab>('reservas');

  /* Bookings */
  bookings = signal<Booking[]>([]);
  bookingFilter = signal<BookingStatus | 'all'>('all');
  filteredBookings = computed(() => {
    const f = this.bookingFilter();
    return f === 'all' ? this.bookings() : this.bookings().filter(b => b.status === f);
  });

  /* Services */
  services = signal<Service[]>([]);
  newService = signal({ name: '', description: '', price_min: 0, price_max: 0, duration_minutes: 0, category: 'cabello', is_featured: false, is_active: true });

  /* Gallery */
  gallery = signal<GalleryItem[]>([]);
  uploading = signal(false);
  uploadError = signal('');

  /* Testimonials */
  testimonials = signal<Testimonial[]>([]);
  newTestimonial = signal({ client_name: '', rating: 5, comment: '', service_name: '' });

  readonly statusLabels = STATUS_LABELS;
  readonly statuses: (BookingStatus | 'all')[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  readonly categories = CATEGORIES;

  /* ── Modal ── */
  modal = signal<{
    icon: string;
    title: string;
    message: string;
    confirmLabel: string;
    type: 'danger' | 'warning';
    onConfirm: () => Promise<void>;
  } | null>(null);

  private ask(icon: string, title: string, message: string, confirmLabel: string, type: 'danger' | 'warning', onConfirm: () => Promise<void>): void {
    this.modal.set({ icon, title, message, confirmLabel, type, onConfirm });
  }

  closeModal(): void { this.modal.set(null); }

  async confirmModal(): Promise<void> {
    const m = this.modal();
    if (!m) return;
    this.modal.set(null);
    await m.onConfirm();
  }

  constructor() {
    afterNextRender(async () => {
      const { data: { session } } = await this.sb.client.auth.getSession();
      if (session) { this.isAuth.set(true); this.loadAll(); }
    });
  }

  async login(): Promise<void> {
    this.authLoading.set(true);
    this.authError.set('');
    const { data, error } = await this.sb.client.auth.signInWithPassword({
      email: this.email(), password: this.password()
    });
    this.authLoading.set(false);
    if (error) { this.authError.set('Credenciales incorrectas: ' + error.message); return; }
    console.log('logged in as:', data.user?.email);
    this.isAuth.set(true);
    this.loadAll();
  }

  async logout(): Promise<void> {
    await this.sb.client.auth.signOut();
    this.isAuth.set(false);
  }

  private async loadAll(): Promise<void> {
    await Promise.all([this.loadBookings(), this.loadServices(), this.loadGallery(), this.loadTestimonials()]);
  }

  /* ── Bookings ── */
  private async loadBookings(): Promise<void> {
    const { data, error } = await this.sb.client.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) console.error('bookings error:', error.message, error.code);
    this.bookings.set((data as Booking[]) ?? []);
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
    await this.sb.client.from('bookings').update({ status } as never).eq('id', id);
    this.bookings.update(list => list.map(b => b.id === id ? { ...b, status } : b));
  }

  async cancelToday(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    this.ask(
      '🚫', 'Día lleno — cancelar hoy',
      `Se cancelarán TODAS las reservas pendientes del ${today}. Esta acción no se puede deshacer.`,
      'Sí, cancelar todo', 'warning',
      async () => {
        const { error } = await this.sb.client
          .from('bookings').update({ status: 'cancelled' } as never)
          .eq('preferred_date', today).neq('status', 'cancelled');
        if (!error) await this.loadBookings();
      }
    );
  }

  async deleteBooking(id: string): Promise<void> {
    this.ask(
      '🗑', 'Eliminar reserva',
      '¿Estás segura? La reserva se eliminará permanentemente.',
      'Eliminar', 'danger',
      async () => {
        await this.sb.client.from('bookings').delete().eq('id', id);
        this.bookings.update(list => list.filter(b => b.id !== id));
      }
    );
  }

  statusClass(s: BookingStatus): string {
    return { pending: 'badge--yellow', confirmed: 'badge--green', cancelled: 'badge--red', completed: 'badge--gray' }[s];
  }

  /* ── Services ── */
  private async loadServices(): Promise<void> {
    const { data } = await this.sb.client.from('services').select('*').order('name');
    this.services.set((data as Service[]) ?? []);
  }

  async addService(): Promise<void> {
    const s = this.newService();
    if (!s.name.trim()) return;
    const { data } = await this.sb.client.from('services').insert({
      name: s.name, description: s.description || null,
      price_min: Number(s.price_min), price_max: Number(s.price_max) || null,
      duration_minutes: Number(s.duration_minutes) || null,
      category: s.category, is_featured: s.is_featured, is_active: s.is_active
    } as never).select().single();
    if (data) this.services.update(list => [...list, data as Service]);
    this.newService.set({ name: '', description: '', price_min: 0, price_max: 0, duration_minutes: 0, category: 'cabello', is_featured: false, is_active: true });
  }

  async toggleServiceField(id: string, field: 'is_active' | 'is_featured', value: boolean): Promise<void> {
    await this.sb.client.from('services').update({ [field]: value } as never).eq('id', id);
    this.services.update(list => list.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  async deleteService(id: string): Promise<void> {
    this.ask(
      '🗑', 'Eliminar servicio',
      'El servicio se eliminará permanentemente y dejará de aparecer en la página.',
      'Eliminar', 'danger',
      async () => {
        await this.sb.client.from('services').delete().eq('id', id);
        this.services.update(list => list.filter(s => s.id !== id));
      }
    );
  }

  /* ── Gallery ── */
  private async loadGallery(): Promise<void> {
    const { data } = await this.sb.client.from('gallery').select('*').order('sort_order').order('created_at', { ascending: false });
    this.gallery.set((data as GalleryItem[]) ?? []);
  }

  async uploadPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.uploading.set(true);
    this.uploadError.set('');

    for (const file of files) {
      const path = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, '_')}`;
      const { error } = await this.sb.client.storage.from('gallery').upload(path, file);
      if (error) { this.uploadError.set(`Error: ${error.message}`); continue; }
      const { data: urlData } = this.sb.client.storage.from('gallery').getPublicUrl(path);
      const { data: row } = await this.sb.client.from('gallery').insert({
        image_url: urlData.publicUrl, alt_text: file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        is_featured: true, sort_order: 0
      } as never).select().single();
      if (row) this.gallery.update(list => [row as GalleryItem, ...list]);
    }
    this.uploading.set(false);
    input.value = '';
  }

  async toggleGalleryFeatured(id: string, val: boolean): Promise<void> {
    await this.sb.client.from('gallery').update({ is_featured: val } as never).eq('id', id);
    this.gallery.update(list => list.map(g => g.id === id ? { ...g, is_featured: val } : g));
  }

  async deleteGalleryItem(id: string, imagePath: string): Promise<void> {
    this.ask(
      '🖼', 'Eliminar foto',
      'La foto se eliminará del storage y de la galería permanentemente.',
      'Eliminar', 'danger',
      async () => {
        const path = imagePath.split('/gallery/').pop();
        if (path) await this.sb.client.storage.from('gallery').remove([path]);
        await this.sb.client.from('gallery').delete().eq('id', id);
        this.gallery.update(list => list.filter(g => g.id !== id));
      }
    );
  }

  /* ── Testimonials ── */
  private async loadTestimonials(): Promise<void> {
    const { data } = await this.sb.client.from('testimonials').select('*').order('created_at', { ascending: false });
    this.testimonials.set((data as Testimonial[]) ?? []);
  }

  async addTestimonial(): Promise<void> {
    const t = this.newTestimonial();
    if (!t.client_name.trim()) return;
    const { data } = await this.sb.client.from('testimonials').insert({
      client_name: t.client_name, rating: Number(t.rating),
      comment: t.comment || null, service_name: t.service_name || null, is_visible: true
    } as never).select().single();
    if (data) this.testimonials.update(list => [data as Testimonial, ...list]);
    this.newTestimonial.set({ client_name: '', rating: 5, comment: '', service_name: '' });
  }

  async toggleTestimonialVisible(id: string, val: boolean): Promise<void> {
    await this.sb.client.from('testimonials').update({ is_visible: val } as never).eq('id', id);
    this.testimonials.update(list => list.map(t => t.id === id ? { ...t, is_visible: val } : t));
  }

  async deleteTestimonial(id: string): Promise<void> {
    this.ask(
      '💬', 'Eliminar testimonio',
      'El testimonio se eliminará y dejará de mostrarse en la página.',
      'Eliminar', 'danger',
      async () => {
        await this.sb.client.from('testimonials').delete().eq('id', id);
        this.testimonials.update(list => list.filter(t => t.id !== id));
      }
    );
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
