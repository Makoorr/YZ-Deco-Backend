import { Column, Entity } from "typeorm"
import { ProductCollection as MedusaProductCollection } from "@medusajs/medusa"

@Entity()
export class ProductCollection extends MedusaProductCollection {
    
    @Column({type: 'varchar'})
    imageURL: string | null
}