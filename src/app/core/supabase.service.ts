import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import type { Database } from './database.types';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly platformId = inject(PLATFORM_ID);
  private _client: SupabaseClient<Database> | null = null;

  get client(): SupabaseClient<Database> {
    if (!this._client) {
      this._client = createClient<Database>(
        environment.supabase.url,
        environment.supabase.key
      );
    }
    return this._client;
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
