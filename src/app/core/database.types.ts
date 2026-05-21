export type ServiceCategory =
  | 'cabello'
  | 'unas'
  | 'cejas_pestanas'
  | 'facial'
  | 'maquillaje'
  | 'depilacion'
  | 'spa';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price_min: number;
  price_max: number | null;
  duration_minutes: number | null;
  category: ServiceCategory;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  alt_text: string | null;
  category: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  service_name: string | null;
  is_visible: boolean;
  created_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service_name: string;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
}

export interface ContactLead {
  id?: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  service_interest: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at'>;
        Update: Partial<Omit<Service, 'id' | 'created_at'>>;
      };
      gallery: {
        Row: GalleryItem;
        Insert: Omit<GalleryItem, 'id' | 'created_at'>;
        Update: Partial<Omit<GalleryItem, 'id' | 'created_at'>>;
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, 'id' | 'created_at'>;
        Update: Partial<Omit<Testimonial, 'id' | 'created_at'>>;
      };
      contact_leads: {
        Row: Required<ContactLead>;
        Insert: ContactLead;
        Update: Partial<ContactLead>;
      };
    };
  };
}
