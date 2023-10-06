export default async function () {
    const imports = (await import(
      "@medusajs/medusa/dist/api/routes/store/collections/index"
    )) as any
    imports.allowedStoreProductsFields = [
      ...imports.allowedStoreProductsFields,
      "imageURL",
    ]
    imports.defaultStoreProductsFields = [
      ...imports.defaultStoreProductsFields,
      "imageURL",
    ]
  }