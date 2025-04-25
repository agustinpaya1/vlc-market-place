export interface Store {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  openTime: string;
  rating: number;
  categories: string[];
  hasOffers: boolean;
  distance: string | number;
} 