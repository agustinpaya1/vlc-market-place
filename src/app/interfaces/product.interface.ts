export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  quantity?: number;
} 