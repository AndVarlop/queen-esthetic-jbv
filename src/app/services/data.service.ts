import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../core/supabase.service';
import type { Service, GalleryItem, Testimonial, ContactLead } from '../core/database.types';

export interface BookingPayload {
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  service_name: string;
  preferred_date: string;
  preferred_time?: string | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private supabase = inject(SupabaseService);

  async getFeaturedServices(): Promise<Service[]> {
    const { data } = await this.supabase.client
      .from('services')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('name');
    return data ?? [];
  }

  async getAllServices(): Promise<Service[]> {
    const { data } = await this.supabase.client
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');
    return data ?? [];
  }

  async getFeaturedGallery(): Promise<GalleryItem[]> {
    const { data } = await this.supabase.client
      .from('gallery')
      .select('*')
      .eq('is_featured', true)
      .order('sort_order');
    return data ?? [];
  }

  async getAllGallery(): Promise<GalleryItem[]> {
    const { data } = await this.supabase.client
      .from('gallery')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async getTestimonials(): Promise<Testimonial[]> {
    const { data } = await this.supabase.client
      .from('testimonials')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async submitLead(lead: ContactLead): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('contact_leads')
      .insert(lead as never);
    return !error;
  }

  async createBooking(payload: BookingPayload): Promise<string | null> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .insert(payload as never)
      .select('id')
      .single();
    if (error) return null;
    return (data as { id: string } | null)?.id ?? null;
  }
}
