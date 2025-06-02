export interface Store {
  id: string;
  name: string;
  description?: string;
  owner_id?: string;
  location?: string;
  location_text?: string;
  address?: string;
  image_url?: string;
  imageUrl?: string;  // Alias para compatibilidad
  is_open?: boolean;
  isOpen?: boolean;  // Alias para compatibilidad
  open_time?: string | null;
  openTime?: string;  // Alias para compatibilidad
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  categories?: string[];
  schedule?: any;
  contact_info?: any;
  hasOffers?: boolean;
  has_offers?: boolean;  // Alias para compatibilidad
  distance?: number | string;
  rating?: number;
  products?: any[];
  coordinates?: [number, number];
  contact_phone?: string;
  phone?: string;
  multiStore?: boolean;
  stores?: Array<{
    id: string;
    name: string;
  }>;
}

export interface StoreWithStats extends Store {
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  };
} 