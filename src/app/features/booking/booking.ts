import { Component, signal, computed, afterNextRender, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../layout/navbar/navbar';
import { DataService } from '../../services/data.service';
import type { Service } from '../../core/database.types';

type Step = 'service' | 'datetime' | 'info' | 'confirm';

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

const FALLBACK_SERVICES = [
  'Corte & Peinado', 'Tinte & Color', 'Alisado / Keratina',
  'Manicure Premium', 'Pedicure Spa', 'Diseño de Cejas',
  'Lifting de Pestañas', 'Extensiones de Pestañas',
  'Facial Purificante', 'Maquillaje Social',
];

@Component({
  selector: 'app-booking',
  imports: [NavbarComponent, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking {
  private data = inject(DataService);

  readonly phone = '3504132509';
  readonly whatsappBase = 'https://wa.me/57' + this.phone;

  services = signal<Service[]>([]);
  serviceNames = computed(() =>
    this.services().length ? this.services().map(s => s.name) : FALLBACK_SERVICES
  );

  readonly timeSlots = TIME_SLOTS;

  step = signal<Step>('service');
  loading = signal(false);
  bookingId = signal<string | null>(null);

  selected = signal({
    serviceName: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  today = new Date().toISOString().split('T')[0];

  stepIndex = computed(() => ({ service: 0, datetime: 1, info: 2, confirm: 3 }[this.step()]));

  canNextService = computed(() => !!this.selected().serviceName);
  canNextDatetime = computed(() => !!this.selected().date && !!this.selected().time);
  canNextInfo = computed(() => !!this.selected().name.trim() && !!this.selected().phone.trim());

  update(field: keyof ReturnType<typeof this.selected>, value: string): void {
    this.selected.update(s => ({ ...s, [field]: value }));
  }

  next(): void {
    const steps: Step[] = ['service', 'datetime', 'info', 'confirm'];
    const idx = steps.indexOf(this.step());
    if (idx < steps.length - 1) this.step.set(steps[idx + 1]);
  }

  back(): void {
    const steps: Step[] = ['service', 'datetime', 'info', 'confirm'];
    const idx = steps.indexOf(this.step());
    if (idx > 0) this.step.set(steps[idx - 1]);
  }

  async confirm(): Promise<void> {
    const s = this.selected();
    this.loading.set(true);

    const id = await this.data.createBooking({
      client_name: s.name.trim(),
      client_phone: s.phone.trim(),
      client_email: s.email.trim() || null,
      service_name: s.serviceName,
      preferred_date: s.date,
      preferred_time: s.time || null,
      notes: s.notes.trim() || null,
    });

    this.loading.set(false);
    this.bookingId.set(id ?? 'local');
    this.step.set('confirm');
  }

  buildWhatsApp(): string {
    const s = this.selected();
    const msg = encodeURIComponent(
      `Hola! Acabo de hacer una reserva en la web.\n` +
      `📋 Servicio: ${s.serviceName}\n` +
      `📅 Fecha: ${s.date}\n` +
      `⏰ Hora: ${s.time}\n` +
      `👤 Nombre: ${s.name}\n` +
      `📞 Tel: ${s.phone}`
    );
    return `${this.whatsappBase}?text=${msg}`;
  }

  constructor() {
    afterNextRender(() => {
      this.data.getAllServices().then(s => this.services.set(s));
    });
  }
}
