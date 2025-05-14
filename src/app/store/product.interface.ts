export interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    offerPrice?: number;
    imageUrl?: string;
    image_url?: string;
    inStock?: boolean;
    stock?: number;
    store_id?: string;
    isOffer?: boolean;
    discount?: number;
} 