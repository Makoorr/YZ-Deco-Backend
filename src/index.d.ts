import { ProductCollection as ProductCol } from "@medusajs/medusa";
export declare module "@medusajs/medusa/dist/models/product-collection" {
    declare interface ProductCollection extends ProductCol {
      imageURL: string | null;
    }
}

export declare module "@medusajs/medusa/dist/models/product" {
  declare interface Product {
    has_text: boolean;
    has_image: boolean;
  }
}