import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('תנא משקאות')
    .items([
      S.listItem()
        .title('🍷 מוצרים לפי קטגוריה')
        .id('products-by-category')
        .child(
          S.documentTypeList('category')
            .id('products-category-picker')
            .title('בחרו קטגוריה')
            .defaultOrdering([{ field: 'order', direction: 'asc' }])
            .child((categoryId) =>
              S.documentList()
                .id(`products-in-${categoryId}`)
                .title('מוצרים')
                .schemaType('product')
                .filter('_type == "product" && category._ref == $categoryId')
                .params({ categoryId })
                .initialValueTemplates([S.initialValueTemplateItem('product-in-category', { categoryId })]),
            ),
        ),
      S.documentTypeListItem('product').title('📦 כל המוצרים'),
      S.divider(),
      S.listItem()
        .title('הזמנות חדשות')
        .id('orders-new')
        .child(
          S.documentList()
            .id('orders-new-list')
            .title('הזמנות חדשות')
            .schemaType('order')
            .filter('_type == "order" && status == "new"')
            .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
        ),
      S.listItem()
        .title('תשלומים לטיפול')
        .id('orders-payment')
        .child(
          S.documentList()
            .id('orders-payment-list')
            .title('ממתינות לתשלום או לבדיקה')
            .schemaType('order')
            .filter('_type == "order" && paymentStatus in ["pending", "review", "failed"] && status != "cancelled"')
            .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
        ),
      S.listItem()
        .title('כל ההזמנות')
        .id('orders-all')
        .child(
          S.documentTypeList('order')
            .id('orders-all-list')
            .title('כל ההזמנות')
            .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
        ),
      S.documentTypeListItem('eventInquiry').title('פניות לאירועים'),
      S.divider(),
      S.documentTypeListItem('category').title('קטגוריות'),
      S.documentTypeListItem('promotion').title('מבצעים'),
      S.divider(),
      S.documentTypeListItem('deliveryZone').title('אזורי משלוח'),
      S.listItem()
        .title('הגדרות משלוחים')
        .id('deliverySettings')
        .child(S.document().schemaType('deliverySettings').documentId('deliverySettings')),
      S.listItem()
        .title('הגדרות אתר')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.documentTypeListItem('legalPage').title('עמודים משפטיים'),
    ]);
