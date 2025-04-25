import { Injectable } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description of Product 1',
      price: 100,
      imageUrl: 'assets/images/product1.jpg'
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description of Product 2',
      price: 200,
      imageUrl: 'assets/images/product2.jpg'
    },
    {
      id: 3,
      name: 'Product 3',
      description: 'Description of Product 3',
      price: 1000,
      imageUrl: 'assets/images/product3.jpg'
    }
  ];

  constructor() {}

  getAllProducts(): Product[] {
    return this.products;
  }

  getProductById(id: number): Product | undefined {
    return this.products.find(product => product.id === id);
  }
} 