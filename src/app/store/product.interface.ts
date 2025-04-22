export interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    offerPrice?: number;
    imageUrl: string;
    inStock: boolean;
} 