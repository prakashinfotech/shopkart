export type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  badgeColor?: string;
  category: 'deals' | 'electronics' | 'fashion';
  freeDelivery: boolean;
};

// Unsplash CDN — stable, high-quality, free-to-use images
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

export const products: Product[] = [
  {
    id: 1,
    name: 'boAt Rockerz 450 Bluetooth Headphone',
    brand: 'boAt',
    price: 1299,
    mrp: 3990,
    rating: 4.3,
    reviews: 84210,
    image: U('1618609255-f7a6b8a49df9'),   // wireless over-ear headphones
    badge: '67% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'deals',
    freeDelivery: true,
  },
  {
    id: 2,
    name: 'Samsung 108cm (43") 4K Ultra HD Smart LED TV',
    brand: 'Samsung',
    price: 28990,
    mrp: 55900,
    rating: 4.5,
    reviews: 32100,
    image: U('1593642632559-0c6d3fc62b89'),  // modern flat-screen TV
    badge: '48% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'deals',
    freeDelivery: true,
  },
  {
    id: 3,
    name: 'Realme Narzo N55 (Prime Blue, 4GB RAM, 64GB)',
    brand: 'Realme',
    price: 8999,
    mrp: 12999,
    rating: 4.2,
    reviews: 15320,
    image: U('1598327105666-5b89351aff97'),   // blue smartphone
    badge: '30% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'deals',
    freeDelivery: true,
  },
  {
    id: 4,
    name: 'Prestige Iris 750W Mixer Grinder (3 Jars)',
    brand: 'Prestige',
    price: 1699,
    mrp: 4295,
    rating: 4.1,
    reviews: 9875,
    image: U('1556909114-f6e7ad7d3136'),    // kitchen appliance / blender
    badge: '60% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'deals',
    freeDelivery: false,
  },
  {
    id: 5,
    name: 'Apple iPhone 15 (Black, 128GB)',
    brand: 'Apple',
    price: 69999,
    mrp: 79900,
    rating: 4.7,
    reviews: 122400,
    image: U('1510557880182-3d4d3cba35a5'),  // dark iPhone on clean background
    badge: 'Best Seller',
    badgeColor: 'bg-accent/10 text-accent',
    category: 'electronics',
    freeDelivery: true,
  },
  {
    id: 6,
    name: 'Dell Inspiron 15 Intel Core i5 Laptop (8GB, 512GB SSD)',
    brand: 'Dell',
    price: 47990,
    mrp: 62990,
    rating: 4.4,
    reviews: 8230,
    image: U('1496181133206-80ce9b88a853'),  // open laptop on desk
    badge: '24% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'electronics',
    freeDelivery: true,
  },
  {
    id: 7,
    name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    brand: 'Sony',
    price: 24990,
    mrp: 34990,
    rating: 4.6,
    reviews: 41560,
    image: U('1505740420928-5e560c06d30e'),  // black premium headphones on white bg
    badge: '28% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'electronics',
    freeDelivery: true,
  },
  {
    id: 8,
    name: 'Canon EOS 1500D 24.1MP DSLR Camera (EF-S 18-55mm)',
    brand: 'Canon',
    price: 30995,
    mrp: 44995,
    rating: 4.5,
    reviews: 18900,
    image: U('1516035069371-29a1b244cc32'),  // DSLR camera on clean background
    badge: '31% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'electronics',
    freeDelivery: true,
  },
  {
    id: 9,
    name: 'Roadster Men Slim Fit Casual Shirt',
    brand: 'Roadster',
    price: 479,
    mrp: 1199,
    rating: 4.0,
    reviews: 5430,
    image: U('1602810318383-e386cc2a3ccf'),  // men's casual shirt
    badge: '60% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'fashion',
    freeDelivery: false,
  },
  {
    id: 10,
    name: 'Biba Women Ethnic Kurta Set (S–XXL)',
    brand: 'Biba',
    price: 1399,
    mrp: 2799,
    rating: 4.3,
    reviews: 7210,
    image: U('1490481651871-ab68de25d43d'),  // women's ethnic wear / kurta
    badge: '50% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'fashion',
    freeDelivery: false,
  },
  {
    id: 11,
    name: 'Puma Running Shoes (Black, UK 9)',
    brand: 'Puma',
    price: 1999,
    mrp: 4999,
    rating: 4.2,
    reviews: 22110,
    image: U('1542291026-7eec264c27ff'),     // athletic running shoes
    badge: '60% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'fashion',
    freeDelivery: true,
  },
  {
    id: 12,
    name: 'Ray-Ban Wayfarer RB2132 Sunglasses',
    brand: 'Ray-Ban',
    price: 5999,
    mrp: 9500,
    rating: 4.6,
    reviews: 3980,
    image: U('1572635196237-14b3f281503f'),  // stylish sunglasses
    badge: '36% off',
    badgeColor: 'bg-green-100 text-green-700',
    category: 'fashion',
    freeDelivery: true,
  },
];
