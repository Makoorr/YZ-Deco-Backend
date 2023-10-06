import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductCollectionCreate1696269105984 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"product_collection\"" + 
            " ADD COLUMN \"imageURL\" text"
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"product_collection\" DROP COLUMN \"imageURL\""
          );
    }

}
