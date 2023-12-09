import { Column, Entity } from "typeorm"
import { Product as MedusaProduct } from "@medusajs/medusa"

@Entity()
export class Product extends MedusaProduct {
    @Column({type: 'boolean', nullable: true})
    has_text: boolean

    @Column({type: 'boolean', nullable: true})
    has_image: boolean
}