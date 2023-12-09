import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductUpdate1702123063405 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"product\"" + 
            " ADD COLUMN \"has_text\" boolean"
        )
        await queryRunner.query(
            "ALTER TABLE \"product\"" + 
            " ADD COLUMN \"has_image\" boolean"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"product\" DROP COLUMN \"has_text\""
        )
        await queryRunner.query(
            "ALTER TABLE \"product\" DROP COLUMN \"has_image\""
        )
    }

}
