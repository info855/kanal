// Mock Data for Basit Kargo Advanced

export const mockShippingCompanies = [
  { id: 1, name: 'PTT Kargo', logo: 'https://cdn.basitkargo.com/kargo-firmalari/ptt-kargo.png', price: 79.96, deliveryTime: '2-3 gün' },
  { id: 2, name: 'Aras Kargo', logo: 'https://cdn.basitkargo.com/kargo-firmalari/aras-kargo.png', price: 85.50, deliveryTime: '1-2 gün' },
  { id: 3, name: 'Yurtiçi Kargo', logo: 'https://cdn.basitkargo.com/kargo-firmalari/yurtici-kargo.png', price: 82.30, deliveryTime: '2-3 gün' },
  { id: 4, name: 'MNG Kargo', logo: 'https://cdn.basitkargo.com/kargo-firmalari/mng-kargo.png', price: 78.90, deliveryTime: '2-4 gün' },
  { id: 5, name: 'Sürat Kargo', logo: 'https://cdn.basitkargo.com/kargo-firmalari/surat-kargo.png', price: 89.00, deliveryTime: '1-2 gün' },
  { id: 6, name: 'HepsiJet', logo: 'https://cdn.basitkargo.com/kargo-firmalari/hepsijet.png', price: 91.20, deliveryTime: '1-2 gün' }
];

export const mockOrders = [
  {
    id: 'KRG-2024-001',
    trackingCode: 'TRK123456789',
    recipient: 'Ahmet Yılmaz',
    recipientPhone: '+90 532 123 45 67',
    recipientAddress: 'Atatürk Cad. No:45 Kadıköy/İstanbul',
    shippingCompany: 'PTT Kargo',
    status: 'delivered',
    statusText: 'Teslim Edildi',
    createdAt: '2024-01-15',
    deliveredAt: '2024-01-17',
    price: 79.96,
    weight: 2.5,
    desi: 3,
    paymentType: 'prepaid',
    currentLocation: { lat: 41.0082, lng: 28.9784, city: 'İstanbul', district: 'Kadıköy' },
    timeline: [
      { date: '2024-01-15 10:30', status: 'created', description: 'Sipariş oluşturuldu' },
      { date: '2024-01-15 14:20', status: 'picked', description: 'Kargo alındı' },
      { date: '2024-01-16 09:15', status: 'in_transit', description: 'Transfer merkezinde' },
      { date: '2024-01-17 11:45', status: 'out_for_delivery', description: 'Dağıtıma çıktı' },
      { date: '2024-01-17 15:30', status: 'delivered', description: 'Teslim edildi' }
    ]
  },
  {
    id: 'KRG-2024-002',
    trackingCode: 'TRK987654321',
    recipient: 'Ayşe Demir',
    recipientPhone: '+90 533 987 65 43',
    recipientAddress: 'İnönü Bulvarı No:23 Çankaya/Ankara',
    shippingCompany: 'Aras Kargo',
    status: 'in_transit',
    statusText: 'Yolda',
    createdAt: '2024-01-18',
    price: 85.50,
    weight: 1.2,
    desi: 2,
    paymentType: 'cod',
    codAmount: 250.00,
    currentLocation: { lat: 39.9334, lng: 32.8597, city: 'Ankara', district: 'Keçiören' },
    timeline: [
      { date: '2024-01-18 11:00', status: 'created', description: 'Sipariş oluşturuldu' },
      { date: '2024-01-18 16:30', status: 'picked', description: 'Kargo alındı' },
      { date: '2024-01-19 08:20', status: 'in_transit', description: 'Transfer merkezinde' }
    ]
  },
  {
    id: 'KRG-2024-003',
    trackingCode: 'TRK456789123',
    recipient: 'Mehmet Kaya',
    recipientPhone: '+90 534 456 78 90',
    recipientAddress: 'Konak Meydanı No:12 Konak/İzmir',
    shippingCompany: 'Yurtiçi Kargo',
    status: 'out_for_delivery',
    statusText: 'Dağıtımda',
    createdAt: '2024-01-19',
    price: 82.30,
    weight: 3.0,
    desi: 4,
    paymentType: 'prepaid',
    currentLocation: { lat: 38.4192, lng: 27.1287, city: 'İzmir', district: 'Konak' },
    timeline: [
      { date: '2024-01-19 09:15', status: 'created', description: 'Sipariş oluşturuldu' },
      { date: '2024-01-19 13:45', status: 'picked', description: 'Kargo alındı' },
      { date: '2024-01-20 07:30', status: 'in_transit', description: 'Transfer merkezinde' },
      { date: '2024-01-20 10:15', status: 'out_for_delivery', description: 'Dağıtıma çıktı' }
    ]
  }
];

export const mockUsers = [
  {
    id: 1,
    name: 'Ali Veli',
    email: 'ali@example.com',
    phone: '+90 532 111 22 33',
    role: 'user',
    company: 'ABC E-Ticaret',
    taxId: '1234567890',
    balance: 1500.50,
    totalShipments: 145,
    createdAt: '2023-06-15'
  },
  {
    id: 2,
    name: 'Zeynep Şahin',
    email: 'zeynep@example.com',
    phone: '+90 533 222 33 44',
    role: 'user',
    company: 'XYZ Mağaza',
    taxId: '0987654321',
    balance: 850.00,
    totalShipments: 89,
    createdAt: '2023-08-20'
  },
  {
    id: 3,
    name: 'Admin User',
    email: 'admin@basitkargo.com',
    phone: '+90 534 333 44 55',
    role: 'admin',
    company: 'Basit Kargo',
    createdAt: '2023-01-01'
  }
];

export const mockStats = {
  totalShipments: 1247,
  activeShipments: 342,
  deliveredShipments: 905,
  totalRevenue: 125430.50,
  monthlyGrowth: 15.3,
  averageDeliveryTime: 2.4,
  customerSatisfaction: 4.7
};

export const mockChartData = {
  daily: [
    { date: '15 Ocak', shipments: 45, revenue: 3850 },
    { date: '16 Ocak', shipments: 52, revenue: 4200 },
    { date: '17 Ocak', shipments: 48, revenue: 3950 },
    { date: '18 Ocak', shipments: 61, revenue: 5100 },
    { date: '19 Ocak', shipments: 55, revenue: 4600 },
    { date: '20 Ocak', shipments: 58, revenue: 4850 },
    { date: '21 Ocak', shipments: 63, revenue: 5250 }
  ],
  monthly: [
    { month: 'Tem', shipments: 890, revenue: 72500 },
    { month: 'Ağu', shipments: 1050, revenue: 85200 },
    { month: 'Eyl', shipments: 1200, revenue: 98400 },
    { month: 'Eki', shipments: 1150, revenue: 94300 },
    { month: 'Kas', shipments: 1300, revenue: 106500 },
    { month: 'Ara', shipments: 1450, revenue: 119000 }
  ]
};

export const mockNotifications = [
  {
    id: 1,
    type: 'success',
    title: 'Kargo Teslim Edildi',
    message: 'KRG-2024-001 numaralı kargonuz teslim edildi.',
    time: '5 dakika önce',
    read: false
  },
  {
    id: 2,
    type: 'info',
    title: 'Dağıtıma Çıktı',
    message: 'KRG-2024-003 numaralı kargonuz dağıtıma çıktı.',
    time: '1 saat önce',
    read: false
  },
  {
    id: 3,
    type: 'warning',
    title: 'Bakiye Uyarısı',
    message: 'Bakiyeniz 1000 TL altına düştü.',
    time: '2 saat önce',
    read: true
  }
];

export const mockPricing = [
  { desi: '0-1', pttKargo: 79.96, arasKargo: 85.50, yurticiKargo: 82.30 },
  { desi: '2-3', pttKargo: 79.96, arasKargo: 88.00, yurticiKargo: 85.00 },
  { desi: '4-5', pttKargo: 117.15, arasKargo: 125.50, yurticiKargo: 120.00 },
  { desi: '6-10', pttKargo: 155.00, arasKargo: 165.00, yurticiKargo: 158.00 },
  { desi: '11-20', pttKargo: 225.00, arasKargo: 235.00, yurticiKargo: 228.00 },
  { desi: '21-30', pttKargo: 325.00, arasKargo: 340.00, yurticiKargo: 330.00 }
];

export const mockIntegrations = [
  { name: 'Shopify', icon: '🛒', connected: true },
  { name: 'WooCommerce', icon: '🛍️', connected: true },
  { name: 'Wix', icon: '🌐', connected: false },
  { name: 'Ticimax', icon: '📦', connected: false },
  { name: 'OpenCart', icon: '🏪', connected: false },
  { name: 'PrestaShop', icon: '🛒', connected: false }
];
