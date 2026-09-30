import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('תנא משקאות')
    .items([
      S.listItem()
        .title('הזמנות חדשות')
        .id('orders-new')
        .child(
          S.documentList()
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
            .title('כל ההזמנות')
            .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
        ),
      S.documentTypeListItem('eventInquiry').title('פניות לאירועים'),
      S.divider(),
      S.documentTypeListItem('product').title('מוצרים'),
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
