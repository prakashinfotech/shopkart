import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Cart from './models/Cart.js';
import Order from './models/Order.js';
import Review from './models/Review.js';

const SALT = 10;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const ri   = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));

// ─── Curated product images (Unsplash CDN — stable, high-quality, free) ───────
// Format: https://images.unsplash.com/photo-{ID}?w=800&q=80&auto=format&fit=crop
const U = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const CURATED = {
  // ── Smartphones (flagship) ────────────────────────────────────────────────────
  's24u':        [U('1610945265064-0e34e5519bbf'), U('1601784551446-4bb82b12ab9d'), U('1512941937669-90a1b58e7e9c')],
  'iphone15pm':  [U('1592750475338-74b7b21085ab'), U('1510557880182-3d4d3cba35a5'), U('1580910051074-3671e7d43a6f')],
  'op12r':       [U('1512941937669-90a1b58e7e9c'), U('1580910051074-3671e7d43a6f'), U('1598327105666-5b89351aff97')],
  'redminote13': [U('1598327105666-5b89351aff97'), U('1512941937669-90a1b58e7e9c'), U('1616348436168-de954834f041')],
  'pixel8':      [U('1565849904461-04a58ad377e0'), U('1512941937669-90a1b58e7e9c'), U('1580910051074-3671e7d43a6f')],
  'nothing2a':   [U('1616348436168-de954834f041'), U('1512941937669-90a1b58e7e9c'), U('1598327105666-5b89351aff97')],
  'vivov30':     [U('1598327105666-5b89351aff97'), U('1607936854279-5e38e5b3b3a7'), U('1512941937669-90a1b58e7e9c')],
  'realmegt6t':  [U('1580910051074-3671e7d43a6f'), U('1512941937669-90a1b58e7e9c'), U('1565849904461-04a58ad377e0')],

  // ── Mobile Phones (mid-range) ─────────────────────────────────────────────────
  'samsung-m34':      [U('1610945265064-0e34e5519bbf'), U('1601784551446-4bb82b12ab9d'), U('1512941937669-90a1b58e7e9c')],
  'redmi-12-5g':      [U('1565849904461-04a58ad377e0'), U('1598327105666-5b89351aff97'), U('1616348436168-de954834f041')],
  'realme-narzo60':   [U('1580910051074-3671e7d43a6f'), U('1512941937669-90a1b58e7e9c'), U('1607936854279-5e38e5b3b3a7')],
  'oneplus-nordce3':  [U('1616348436168-de954834f041'), U('1512941937669-90a1b58e7e9c'), U('1580910051074-3671e7d43a6f')],
  'poco-x6pro':       [U('1512941937669-90a1b58e7e9c'), U('1565849904461-04a58ad377e0'), U('1601784551446-4bb82b12ab9d')],
  'iqoo-z9':          [U('1598327105666-5b89351aff97'), U('1580910051074-3671e7d43a6f'), U('1512941937669-90a1b58e7e9c')],
  'moto-edge40neo':   [U('1601784551446-4bb82b12ab9d'), U('1610945265064-0e34e5519bbf'), U('1565849904461-04a58ad377e0')],
  'vivo-t2pro':       [U('1607936854279-5e38e5b3b3a7'), U('1598327105666-5b89351aff97'), U('1512941937669-90a1b58e7e9c')],

  // ── Mobile Accessories ────────────────────────────────────────────────────────
  'anker-gancharger':  [U('1586864387967-d02ef85d93e8'), U('1593642632559-0c6d3fc62b89'), U('1583864697784-a0efc8379f70')],
  'boat-bassheads100': [U('1484704849700-f032a568e944'), U('1505740420928-5e560c06d30e'), U('1618609255-f7a6b8a49df9')],
  'spigen-iphone15':   [U('1592750475338-74b7b21085ab'), U('1580910051074-3671e7d43a6f'), U('1510557880182-3d4d3cba35a5')],

  // ── Laptops ───────────────────────────────────────────────────────────────────
  'macbookairm2': [U('1496181133206-80ce9b88a853'), U('1517336714731-489689fd1ca8'), U('1531297484001-80022131f5a1')],
  'dellxps15':    [U('1541807084-5c52e6e76cf4'), U('1588872657578-7efd1f1555ef'), U('1496181133206-80ce9b88a853')],
  'thinkpade14':  [U('1531297484001-80022131f5a1'), U('1496181133206-80ce9b88a853'), U('1588872657578-7efd1f1555ef')],
  'zenbook14':    [U('1517336714731-489689fd1ca8'), U('1541807084-5c52e6e76cf4'), U('1496181133206-80ce9b88a853')],
  'hppavilion':   [U('1588872657578-7efd1f1555ef'), U('1531297484001-80022131f5a1'), U('1517336714731-489689fd1ca8')],
  'acerasp7':     [U('1496181133206-80ce9b88a853'), U('1541807084-5c52e6e76cf4'), U('1517336714731-489689fd1ca8')],

  // ── Tablets ───────────────────────────────────────────────────────────────────
  'ipadairm1':  [U('1589739900243-4b52cd9b104e'), U('1544244015-0df4b3ffc6b0'), U('1589739900243-4b52cd9b104e')],
  'tabs9fe':    [U('1544244015-0df4b3ffc6b0'), U('1589739900243-4b52cd9b104e'), U('1544244015-0df4b3ffc6b0')],
  'lenovotab':  [U('1589739900243-4b52cd9b104e'), U('1544244015-0df4b3ffc6b0'), U('1589739900243-4b52cd9b104e')],
  'xiaomipad6': [U('1544244015-0df4b3ffc6b0'), U('1589739900243-4b52cd9b104e'), U('1544244015-0df4b3ffc6b0')],

  // ── Audio ─────────────────────────────────────────────────────────────────────
  'sonywh1000':  [U('1505740420928-5e560c06d30e'), U('1484704849700-f032a568e944'), U('1618609255-f7a6b8a49df9')],
  'airpodspro2': [U('1484704849700-f032a568e944'), U('1618609255-f7a6b8a49df9'), U('1505740420928-5e560c06d30e')],
  'jblflip6':    [U('1608043152269-423dbba4e7e1'), U('1572536147248-ac59a8abfa4b'), U('1608041344986-9ba990c3fdf8')],
  'boatrockz':   [U('1618609255-f7a6b8a49df9'), U('1505740420928-5e560c06d30e'), U('1484704849700-f032a568e944')],
  'boseqc45':    [U('1484704849700-f032a568e944'), U('1618609255-f7a6b8a49df9'), U('1505740420928-5e560c06d30e')],

  // ── Cameras ───────────────────────────────────────────────────────────────────
  'canoneosr50': [U('1516035069371-29a1b244cc32'), U('1563738942-40e46ee19e6b'), U('1510127034890-ba27b985da55')],
  'sonyzve10':   [U('1563738942-40e46ee19e6b'), U('1516035069371-29a1b244cc32'), U('1510127034890-ba27b985da55')],
  'nikonz30':    [U('1510127034890-ba27b985da55'), U('1516035069371-29a1b244cc32'), U('1563738942-40e46ee19e6b')],

  // ── Men's Clothing ────────────────────────────────────────────────────────────
  'levisjeans':       [U('1542272604-787c3835535d'), U('1591047139829-d91aecb6caea'), U('1602810318383-e386cc2a3ccf')],
  'allensollyformal': [U('1602810318383-e386cc2a3ccf'), U('1591047139829-d91aecb6caea'), U('1542272604-787c3835535d')],
  'niketshirt':       [U('1591047139829-d91aecb6caea'), U('1602810318383-e386cc2a3ccf'), U('1542272604-787c3835535d')],
  'pechinos':         [U('1542272604-787c3835535d'), U('1602810318383-e386cc2a3ccf'), U('1591047139829-d91aecb6caea')],
  'tommypolo':        [U('1602810318383-e386cc2a3ccf'), U('1542272604-787c3835535d'), U('1591047139829-d91aecb6caea')],

  // ── Women's Clothing ──────────────────────────────────────────────────────────
  'bibaanarkali':  [U('1490481651871-ab68de25d43d'), U('1515886657613-9f3515b0c78f'), U('1489987707025-afc232f7ea0f')],
  'wkurta':        [U('1489987707025-afc232f7ea0f'), U('1490481651871-ab68de25d43d'), U('1515886657613-9f3515b0c78f')],
  'hmwrapdress':   [U('1515886657613-9f3515b0c78f'), U('1489987707025-afc232f7ea0f'), U('1490481651871-ab68de25d43d')],
  'libassuitset':  [U('1490481651871-ab68de25d43d'), U('1515886657613-9f3515b0c78f'), U('1489987707025-afc232f7ea0f')],
  'aureliapalazo': [U('1515886657613-9f3515b0c78f'), U('1490481651871-ab68de25d43d'), U('1489987707025-afc232f7ea0f')],

  // ── Footwear ──────────────────────────────────────────────────────────────────
  'nikeairmax':       [U('1542291026-7eec264c27ff'), U('1595950653106-6c9ebd614d3a'), U('1460355976672-e86659d2a4dc')],
  'adidasultraboost': [U('1595950653106-6c9ebd614d3a'), U('1542291026-7eec264c27ff'), U('1460355976672-e86659d2a4dc')],
  'pumasoftride':     [U('1460355976672-e86659d2a4dc'), U('1542291026-7eec264c27ff'), U('1595950653106-6c9ebd614d3a')],
  'bataoxford':       [U('1542291026-7eec264c27ff'), U('1460355976672-e86659d2a4dc'), U('1595950653106-6c9ebd614d3a')],
  'skechersgowalk':   [U('1595950653106-6c9ebd614d3a'), U('1460355976672-e86659d2a4dc'), U('1542291026-7eec264c27ff')],

  // ── Kitchen Appliances ────────────────────────────────────────────────────────
  'prestigemixer':   [U('1556909114-f6e7ad7d3136'), U('1585515320310-259814833e62'), U('1585747860715-2ba37e788b70')],
  'lgmicrowave':     [U('1585515320310-259814833e62'), U('1556909114-f6e7ad7d3136'), U('1585747860715-2ba37e788b70')],
  'philipsairfryer': [U('1585747860715-2ba37e788b70'), U('1556909114-f6e7ad7d3136'), U('1585515320310-259814833e62')],
  'pigeonpc':        [U('1556909114-f6e7ad7d3136'), U('1585515320310-259814833e62'), U('1585747860715-2ba37e788b70')],
  'instantpot':      [U('1585515320310-259814833e62'), U('1585747860715-2ba37e788b70'), U('1556909114-f6e7ad7d3136')],

  // ── Home Decor ────────────────────────────────────────────────────────────────
  'nilkamalchair': [U('1555041469-a586c61ea9bc'), U('1493552152781-9b1c7c41cc78'), U('1540518614846-7eded433c457')],
  'bedsheet':      [U('1540518614846-7eded433c457'), U('1555041469-a586c61ea9bc'), U('1493552152781-9b1c7c41cc78')],
  'wallclock':     [U('1493552152781-9b1c7c41cc78'), U('1555041469-a586c61ea9bc'), U('1540518614846-7eded433c457')],
  'decorvase':     [U('1555041469-a586c61ea9bc'), U('1540518614846-7eded433c457'), U('1493552152781-9b1c7c41cc78')],

  // ── Sports & Fitness ─────────────────────────────────────────────────────────
  'hexdumbbell': [U('1517836357463-d25dfeac3438'), U('1571019613454-1cb2f99b2d8b'), U('1518611012118-696072aa579a')],
  'yogamat':     [U('1518611012118-696072aa579a'), U('1571019613454-1cb2f99b2d8b'), U('1517836357463-d25dfeac3438')],
  'spinbike':    [U('1571019613454-1cb2f99b2d8b'), U('1517836357463-d25dfeac3438'), U('1518611012118-696072aa579a')],
  'cricketbat':  [U('1517836357463-d25dfeac3438'), U('1518611012118-696072aa579a'), U('1571019613454-1cb2f99b2d8b')],

  // ── Books ─────────────────────────────────────────────────────────────────────
  'alchemist':   [U('1524995997946-a1c2e315a42f'), U('1497633762265-9d179a990aa6'), U('1456513080510-7bf3a84b82f8')],
  'wingsoffire': [U('1497633762265-9d179a990aa6'), U('1524995997946-a1c2e315a42f'), U('1456513080510-7bf3a84b82f8')],
  'atomichabits':[U('1456513080510-7bf3a84b82f8'), U('1524995997946-a1c2e315a42f'), U('1497633762265-9d179a990aa6')],
  'psychmoney':  [U('1524995997946-a1c2e315a42f'), U('1456513080510-7bf3a84b82f8'), U('1497633762265-9d179a990aa6')],

  // ── Skincare ──────────────────────────────────────────────────────────────────
  'minimalist-niacinamide': [U('1556228852-6d35a585d2d6'), U('1629198735660-e39ea93f5f22'), U('1571781926291-c477ebfd024b')],
  'dotkey-vitc':            [U('1629198735660-e39ea93f5f22'), U('1556228852-6d35a585d2d6'), U('1620916566398-39f1143ab7be')],
  'cetaphil-cream':         [U('1571781926291-c477ebfd024b'), U('1556228852-6d35a585d2d6'), U('1629198735660-e39ea93f5f22')],
  'neutrogena-hydroboost':  [U('1620916566398-39f1143ab7be'), U('1629198735660-e39ea93f5f22'), U('1571781926291-c477ebfd024b')],
  'plum-greentea-toner':    [U('1556228852-6d35a585d2d6'), U('1571781926291-c477ebfd024b'), U('1629198735660-e39ea93f5f22')],
  'wow-vitc-facewash':      [U('1571781926291-c477ebfd024b'), U('1620916566398-39f1143ab7be'), U('1556228852-6d35a585d2d6')],
  'lashield-sunscreen':     [U('1629198735660-e39ea93f5f22'), U('1620916566398-39f1143ab7be'), U('1556228852-6d35a585d2d6')],

  // ── Makeup ────────────────────────────────────────────────────────────────────
  'maybelline-fitme':    [U('1522335789203-aabd1fc54bc9'), U('1583241475880-083f84372725'), U('1543637219-f5b1a39b3a2a')],
  'loreal-matte-lip':    [U('1606190498906-70b1a4a44b52'), U('1543637219-f5b1a39b3a2a'), U('1522335789203-aabd1fc54bc9')],
  'sugar-matte-lip':     [U('1543637219-f5b1a39b3a2a'), U('1606190498906-70b1a4a44b52'), U('1583241475880-083f84372725')],
  'lakme-kajal':         [U('1583241475880-083f84372725'), U('1522335789203-aabd1fc54bc9'), U('1606190498906-70b1a4a44b52')],
  'nyx-buttergloss':     [U('1606190498906-70b1a4a44b52'), U('1583241475880-083f84372725'), U('1543637219-f5b1a39b3a2a')],
  'facescanada-palette': [U('1522335789203-aabd1fc54bc9'), U('1543637219-f5b1a39b3a2a'), U('1583241475880-083f84372725')],

  // ── Hair Care ─────────────────────────────────────────────────────────────────
  'loreal-shampoo':     [U('1527799820374-dcf8d9d4a388'), U('1515377905703-c4788e51af15'), U('1571781926291-c477ebfd024b')],
  'tresemme-keratin':   [U('1515377905703-c4788e51af15'), U('1527799820374-dcf8d9d4a388'), U('1571781926291-c477ebfd024b')],
  'mamaearth-onionoil': [U('1571781926291-c477ebfd024b'), U('1527799820374-dcf8d9d4a388'), U('1515377905703-c4788e51af15')],
  'dove-conditioner':   [U('1527799820374-dcf8d9d4a388'), U('1571781926291-c477ebfd024b'), U('1515377905703-c4788e51af15')],

  // ── Educational Toys ──────────────────────────────────────────────────────────
  'lego-classic':            [U('1558618666-fcd25c85cd64'), U('1566576912321-d58ddd7a6088'), U('1587654780291-39c9404d746b')],
  'fisherprice-learninghome':[U('1566576912321-d58ddd7a6088'), U('1558618666-fcd25c85cd64'), U('1587654780291-39c9404d746b')],
  'rubiks-cube':             [U('1587654780291-39c9404d746b'), U('1558618666-fcd25c85cd64'), U('1566576912321-d58ddd7a6088')],
  'funskool-monopoly':       [U('1558618666-fcd25c85cd64'), U('1587654780291-39c9404d746b'), U('1566576912321-d58ddd7a6088')],
  'meccano-set':             [U('1566576912321-d58ddd7a6088'), U('1587654780291-39c9404d746b'), U('1558618666-fcd25c85cd64')],
  'skillmatics-guessin10':   [U('1587654780291-39c9404d746b'), U('1566576912321-d58ddd7a6088'), U('1558618666-fcd25c85cd64')],

  // ── Action Figures ────────────────────────────────────────────────────────────
  'hotwheels-20pack':    [U('1558618047-3c8c76ca7d13'), U('1564507592333-c60657eea523'), U('1566576912321-d58ddd7a6088')],
  'marvel-ironman':      [U('1564507592333-c60657eea523'), U('1558618047-3c8c76ca7d13'), U('1587654780291-39c9404d746b')],
  'chhota-bheem-set':    [U('1566576912321-d58ddd7a6088'), U('1564507592333-c60657eea523'), U('1558618047-3c8c76ca7d13')],
  'barbie-fashionista':  [U('1558618047-3c8c76ca7d13'), U('1566576912321-d58ddd7a6088'), U('1564507592333-c60657eea523')],
  'minecraft-creeper':   [U('1564507592333-c60657eea523'), U('1566576912321-d58ddd7a6088'), U('1558618047-3c8c76ca7d13')],

  // ── Bikes ─────────────────────────────────────────────────────────────────────
  'hero-splendor':     [U('1568772585407-9361f9bf3a87'), U('1558979158-65a1eaa08691'), U('1449426468159-d96dbf08f19f')],
  'bajaj-pulsarns200': [U('1558979158-65a1eaa08691'), U('1568772585407-9361f9bf3a87'), U('1449426468159-d96dbf08f19f')],
  're-meteor350':      [U('1449426468159-d96dbf08f19f'), U('1568772585407-9361f9bf3a87'), U('1558979158-65a1eaa08691')],
  'honda-cbshine':     [U('1568772585407-9361f9bf3a87'), U('1449426468159-d96dbf08f19f'), U('1558979158-65a1eaa08691')],
  'tvs-apache160':     [U('1558979158-65a1eaa08691'), U('1449426468159-d96dbf08f19f'), U('1568772585407-9361f9bf3a87')],
  'yamaha-fzs':        [U('1449426468159-d96dbf08f19f'), U('1558979158-65a1eaa08691'), U('1568772585407-9361f9bf3a87')],

  // ── Scooters ──────────────────────────────────────────────────────────────────
  'honda-activa125':  [U('1568772585407-9361f9bf3a87'), U('1449426468159-d96dbf08f19f'), U('1558979158-65a1eaa08691')],
  'tvs-jupiter':      [U('1449426468159-d96dbf08f19f'), U('1568772585407-9361f9bf3a87'), U('1558979158-65a1eaa08691')],
  'suzuki-access125': [U('1558979158-65a1eaa08691'), U('1568772585407-9361f9bf3a87'), U('1449426468159-d96dbf08f19f')],
  'yamaha-fascino':   [U('1568772585407-9361f9bf3a87'), U('1558979158-65a1eaa08691'), U('1449426468159-d96dbf08f19f')],
};

// img() — returns curated Unsplash images when available, picsum as fallback
const img = (seed, n = 3) =>
  CURATED[seed] ??
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/fk-${seed}-${i}/800/800`);

// ─── Category Data ────────────────────────────────────────────────────────────
const PARENTS = [
  { name: 'Electronics',       image: 'https://picsum.photos/seed/cat-electronics/400/300' },
  { name: 'Fashion',           image: 'https://picsum.photos/seed/cat-fashion/400/300' },
  { name: 'Home & Kitchen',    image: 'https://picsum.photos/seed/cat-home/400/300' },
  { name: 'Sports & Fitness',  image: 'https://picsum.photos/seed/cat-sports/400/300' },
  { name: 'Books',             image: 'https://picsum.photos/seed/cat-books/400/300' },
  { name: 'Mobiles',           image: 'https://picsum.photos/seed/cat-mobiles/400/300' },
  { name: 'Beauty',            image: 'https://picsum.photos/seed/cat-beauty/400/300' },
  { name: 'Toys',              image: 'https://picsum.photos/seed/cat-toys/400/300' },
  { name: 'Two Wheelers',      image: 'https://picsum.photos/seed/cat-twowheelers/400/300' },
];

const SUBS = {
  'Electronics':      ['Smartphones', 'Laptops', 'Tablets', 'Audio', 'Cameras'],
  'Fashion':          ["Men's Clothing", "Women's Clothing", 'Footwear'],
  'Home & Kitchen':   ['Kitchen Appliances', 'Home Decor'],
  'Sports & Fitness': ['Exercise Equipment'],
  'Books':            ['Fiction', 'Non-Fiction'],
  'Mobiles':          ['Mobile Phones', 'Mobile Accessories'],
  'Beauty':           ['Skincare', 'Makeup', 'Hair Care'],
  'Toys':             ['Educational Toys', 'Action Figures'],
  'Two Wheelers':     ['Bikes', 'Scooters'],
};

const SUB_IMAGES = {
  Smartphones: 'https://picsum.photos/seed/cat-phones/400/300',
  Laptops:     'https://picsum.photos/seed/cat-laptops/400/300',
  Tablets:     'https://picsum.photos/seed/cat-tablets/400/300',
  Audio:       'https://picsum.photos/seed/cat-audio/400/300',
  Cameras:     'https://picsum.photos/seed/cat-cameras/400/300',
  "Men's Clothing":   'https://picsum.photos/seed/cat-men/400/300',
  "Women's Clothing": 'https://picsum.photos/seed/cat-women/400/300',
  Footwear:           'https://picsum.photos/seed/cat-footwear/400/300',
  'Kitchen Appliances': 'https://picsum.photos/seed/cat-kitchen/400/300',
  'Home Decor':         'https://picsum.photos/seed/cat-decor/400/300',
  'Exercise Equipment': 'https://picsum.photos/seed/cat-exercise/400/300',
  Fiction:     'https://picsum.photos/seed/cat-fiction/400/300',
  'Non-Fiction': 'https://picsum.photos/seed/cat-nonfiction/400/300',
  'Mobile Phones':      'https://picsum.photos/seed/cat-mobilephones/400/300',
  'Mobile Accessories': 'https://picsum.photos/seed/cat-mobileacc/400/300',
  Skincare:             'https://picsum.photos/seed/cat-skincare/400/300',
  Makeup:               'https://picsum.photos/seed/cat-makeup/400/300',
  'Hair Care':          'https://picsum.photos/seed/cat-haircare/400/300',
  'Educational Toys':   'https://picsum.photos/seed/cat-edutoys/400/300',
  'Action Figures':     'https://picsum.photos/seed/cat-actionfigure/400/300',
  Bikes:                'https://picsum.photos/seed/cat-bikes/400/300',
  Scooters:             'https://picsum.photos/seed/cat-scooters/400/300',
};

// ─── Product Data (keyed by sub-category name) ────────────────────────────────
const PRODUCTS = {
  Smartphones: [
    {
      name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 134999, mrp: 154999,
      stock: 45, isFeatured: true, images: img('s24u'),
      description: 'The ultimate Galaxy experience with built-in S Pen, 200MP camera, and AI-powered features. Titanium frame with Corning Gorilla Armor glass.',
      specs: { Display: '6.8" QHD+ Dynamic AMOLED 2X', Processor: 'Snapdragon 8 Gen 3', RAM: '12GB', Storage: '256GB', Camera: '200MP + 12MP + 10MP + 10MP', Battery: '5000mAh', OS: 'Android 14', Charging: '45W Wired + 15W Wireless' },
    },
    {
      name: 'Apple iPhone 15 Pro Max', brand: 'Apple', price: 159900, mrp: 179900,
      stock: 30, isFeatured: true, images: img('iphone15pm'),
      description: 'Forged in titanium with the groundbreaking A17 Pro chip, a customizable Action Button, and the most powerful iPhone camera system ever.',
      specs: { Display: '6.7" Super Retina XDR OLED', Processor: 'Apple A17 Pro', RAM: '8GB', Storage: '256GB', Camera: '48MP + 12MP + 12MP', Battery: '4422mAh', OS: 'iOS 17', Charging: '27W + 15W MagSafe' },
    },
    {
      name: 'OnePlus 12R', brand: 'OnePlus', price: 39999, mrp: 49999,
      stock: 80, isFeatured: true, images: img('op12r'),
      description: 'Snapdragon 8 Gen 1 powered flagship with 50MP Sony IMX890 camera and 100W SUPERVOOC charging. Flagship performance at a mid-range price.',
      specs: { Display: '6.78" AMOLED 120Hz', Processor: 'Snapdragon 8 Gen 1', RAM: '8GB', Storage: '128GB', Camera: '50MP + 8MP + 2MP', Battery: '5400mAh', OS: 'OxygenOS 14', Charging: '100W SUPERVOOC' },
    },
    {
      name: 'Redmi Note 13 Pro+', brand: 'Xiaomi', price: 29999, mrp: 36999,
      stock: 150, images: img('redminote13'),
      description: '200MP primary camera with OIS and MediaTek Dimensity 7200 Ultra. Best camera phone in its segment with 120W HyperCharge.',
      specs: { Display: '6.67" AMOLED 120Hz', Processor: 'Dimensity 7200 Ultra', RAM: '8GB', Storage: '256GB', Camera: '200MP + 8MP + 2MP', Battery: '5000mAh', OS: 'MIUI 14', Charging: '120W HyperCharge' },
    },
    {
      name: 'Google Pixel 8', brand: 'Google', price: 75999, mrp: 84999,
      stock: 40, images: img('pixel8'),
      description: 'Google Tensor G3 chip with advanced AI, 7 years of OS updates, and the most intelligent camera on any Pixel phone.',
      specs: { Display: '6.2" Actua OLED 120Hz', Processor: 'Google Tensor G3', RAM: '8GB', Storage: '128GB', Camera: '50MP + 12MP', Battery: '4575mAh', OS: 'Android 14', Charging: '27W + 18W Wireless' },
    },
    {
      name: 'Nothing Phone 2a', brand: 'Nothing', price: 23999, mrp: 29999,
      stock: 120, images: img('nothing2a'),
      description: "MediaTek Dimensity 7200 Pro with Nothing's iconic Glyph Interface. Radical design with a fantastic 50MP dual camera at an accessible price.",
      specs: { Display: '6.7" AMOLED 120Hz', Processor: 'Dimensity 7200 Pro', RAM: '8GB', Storage: '128GB', Camera: '50MP + 50MP', Battery: '5000mAh', OS: 'Nothing OS 2.5', Charging: '45W' },
    },
    {
      name: 'Vivo V30 Pro', brand: 'Vivo', price: 34999, mrp: 44999,
      stock: 70, images: img('vivov30'),
      description: 'Aura Light Portrait System with 50MP Sony IMX920 sensor, 3D curved AMOLED display, and Dimensity 8200 processor.',
      specs: { Display: '6.78" Curved AMOLED 120Hz', Processor: 'Dimensity 8200', RAM: '12GB', Storage: '256GB', Camera: '50MP + 50MP + 8MP', Battery: '5000mAh', OS: 'Funtouch OS 14', Charging: '80W FlashCharge' },
    },
    {
      name: 'Realme GT 6T', brand: 'Realme', price: 35999, mrp: 44999,
      stock: 95, images: img('realmegt6t'),
      description: 'Snapdragon 7+ Gen 3 with 120Hz AMOLED display and 50MP Sony LYT800 camera. Blazing 120W SUPERVOOC charging.',
      specs: { Display: '6.78" AMOLED 120Hz', Processor: 'Snapdragon 7+ Gen 3', RAM: '8GB', Storage: '256GB', Camera: '50MP + 8MP + 2MP', Battery: '5500mAh', OS: 'Realme UI 5.0', Charging: '120W SUPERVOOC' },
    },
  ],

  Laptops: [
    {
      name: 'Apple MacBook Air 13" M2', brand: 'Apple', price: 114900, mrp: 124900,
      stock: 25, isFeatured: true, images: img('macbookairm2'),
      description: 'Supercharged by Apple M2 with 8-core CPU and 8-core GPU. Fanless design, up to 18 hours battery life, and stunning Liquid Retina display.',
      specs: { Processor: 'Apple M2 8-core', RAM: '8GB Unified', Storage: '256GB SSD', Display: '13.6" Liquid Retina 2560x1664', Battery: 'Up to 18 hrs', OS: 'macOS Sonoma', Weight: '1.24 kg' },
    },
    {
      name: 'Dell XPS 15 (2024)', brand: 'Dell', price: 149990, mrp: 179990,
      stock: 15, images: img('dellxps15'),
      description: 'Intel Core i7-13th Gen with NVIDIA RTX 4060 and a gorgeous 3.5K OLED touch display. The pinnacle of Windows laptop engineering.',
      specs: { Processor: 'Intel Core i7-13700H', RAM: '16GB DDR5', Storage: '512GB SSD', Display: '15.6" 3.5K OLED Touch', Graphics: 'NVIDIA RTX 4060 8GB', Battery: '86Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'Lenovo ThinkPad E14 Gen 5', brand: 'Lenovo', price: 69990, mrp: 89990,
      stock: 35, images: img('thinkpade14'),
      description: 'Business-grade reliability with AMD Ryzen 7 and MIL-SPEC tested durability. 16GB RAM and 512GB SSD for demanding workloads.',
      specs: { Processor: 'AMD Ryzen 7 7730U', RAM: '16GB DDR4', Storage: '512GB SSD', Display: '14" FHD IPS', Battery: '57Whr', OS: 'Windows 11 Pro', Weight: '1.67 kg' },
    },
    {
      name: 'Asus ZenBook 14 OLED', brand: 'Asus', price: 74990, mrp: 89990,
      stock: 28, isFeatured: true, images: img('zenbook14'),
      description: 'Stunning 2.8K OLED display with Intel Core Ultra 7 and Harman Kardon tuned audio. Ultra-thin 14.9mm design with Intel Arc graphics.',
      specs: { Processor: 'Intel Core Ultra 7 155H', RAM: '16GB LPDDR5', Storage: '512GB SSD', Display: '14" 2.8K OLED 120Hz', Graphics: 'Intel Arc', Battery: '75Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'HP Pavilion 15', brand: 'HP', price: 54990, mrp: 67990,
      stock: 50, images: img('hppavilion'),
      description: 'Everyday performance with Intel Core i5-13th Gen, Full HD IPS display, and long battery life. Versatile for work, study, and entertainment.',
      specs: { Processor: 'Intel Core i5-1335U', RAM: '8GB DDR4', Storage: '512GB SSD', Display: '15.6" FHD IPS', Graphics: 'Intel Iris Xe', Battery: '41Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'Acer Aspire 7', brand: 'Acer', price: 59990, mrp: 74990,
      stock: 42, images: img('acerasp7'),
      description: 'AMD Ryzen 5 with NVIDIA GTX 1650, 144Hz display, and 512GB SSD. Gaming-ready performance at an accessible price point.',
      specs: { Processor: 'AMD Ryzen 5 5500U', RAM: '8GB DDR4', Storage: '512GB SSD', Display: '15.6" FHD IPS 144Hz', Graphics: 'NVIDIA GTX 1650 4GB', Battery: '48Whr', OS: 'Windows 11 Home' },
    },
  ],

  Tablets: [
    {
      name: 'Apple iPad Air (M1)', brand: 'Apple', price: 74900, mrp: 89900,
      stock: 30, isFeatured: true, images: img('ipadairm1'),
      description: 'Powerful M1 chip in a thin, light design. 10.9-inch Liquid Retina display, USB-C, and support for Apple Pencil (2nd gen) and Magic Keyboard.',
      specs: { Chip: 'Apple M1', Display: '10.9" Liquid Retina', Storage: '64GB', Camera: '12MP Wide', Battery: 'Up to 10 hrs', Connectivity: 'Wi-Fi 6, Bluetooth 5.0', OS: 'iPadOS 17' },
    },
    {
      name: 'Samsung Galaxy Tab S9 FE', brand: 'Samsung', price: 44999, mrp: 59999,
      stock: 45, images: img('tabs9fe'),
      description: 'IP68 water resistance, 10.9-inch display, and S Pen included in the box. Exynos 1380 for smooth multitasking.',
      specs: { Processor: 'Samsung Exynos 1380', Display: '10.9" TFT LCD 90Hz', Storage: '128GB', Camera: '8MP Rear, 10MP Front', Battery: '8000mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.3', OS: 'Android 13' },
    },
    {
      name: 'Lenovo Tab P12', brand: 'Lenovo', price: 34999, mrp: 49999,
      stock: 38, images: img('lenovotab'),
      description: '12.7-inch 3K display with MediaTek Dimensity 7050, 8GB RAM, and JBL-tuned quad speakers for immersive entertainment.',
      specs: { Processor: 'Dimensity 7050', Display: '12.7" 3K IPS 120Hz', Storage: '128GB', Camera: '13MP Rear, 8MP Front', Battery: '10200mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.1', OS: 'Android 13' },
    },
    {
      name: 'Xiaomi Pad 6', brand: 'Xiaomi', price: 26999, mrp: 34999,
      stock: 60, images: img('xiaomipad6'),
      description: 'Snapdragon 870 with 144Hz display, 8840mAh battery, and stylus support. Best value Android tablet in its segment.',
      specs: { Processor: 'Snapdragon 870', Display: '11" 2.8K IPS 144Hz', Storage: '128GB', Camera: '13MP Rear, 8MP Front', Battery: '8840mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.2', OS: 'MIUI 14' },
    },
  ],

  Audio: [
    {
      name: 'Sony WH-1000XM5', brand: 'Sony', price: 24990, mrp: 34990,
      stock: 60, isFeatured: true, images: img('sonywh1000'),
      description: 'Industry-leading noise cancellation with dual V1 and QN1 processors. 30-hour battery, Auto NC Optimizer, and Speak-to-Chat technology.',
      specs: { Type: 'Over-Ear Wireless', 'Driver Size': '30mm', Battery: '30 hrs (NC on)', ANC: 'Active (Dual Chip)', Connectivity: 'Bluetooth 5.2, NFC', Charging: 'USB-C, 3hr full', Weight: '250g' },
    },
    {
      name: 'Apple AirPods Pro (2nd Gen)', brand: 'Apple', price: 24900, mrp: 27900,
      stock: 55, images: img('airpodspro2'),
      description: 'H2 chip with Adaptive Audio, Personalized Spatial Audio, and 2x better ANC. MagSafe Charging Case with Find My.',
      specs: { Type: 'In-Ear TWS', Chip: 'Apple H2', ANC: 'Adaptive Transparency', Battery: '6 hrs + 24 hrs case', Connectivity: 'Bluetooth 5.3', Water: 'IPX4', Charging: 'MagSafe / USB-C' },
    },
    {
      name: 'JBL Flip 6', brand: 'JBL', price: 9499, mrp: 14999,
      stock: 90, images: img('jblflip6'),
      description: 'Powerful stereo sound with separate tweeters and racetrack-shaped woofer. IP67 waterproof with 12-hour playtime.',
      specs: { Type: 'Portable Speaker', Output: '30W', Battery: '12 hrs', Water: 'IP67', Connectivity: 'Bluetooth 5.1', Dimensions: '178 x 68 x 68 mm', Weight: '550g' },
    },
    {
      name: 'boAt Rockerz 558 Pro', brand: 'boAt', price: 1999, mrp: 4999,
      stock: 200, images: img('boatrockz'),
      description: 'Beast-Mode sound with 40mm drivers, active noise cancellation, and 70-hour battery life. ASAP charging: 10 minutes for 5 hours playtime.',
      specs: { Type: 'Over-Ear Wireless', 'Driver Size': '40mm', Battery: '70 hrs', ANC: 'Active', Connectivity: 'Bluetooth 5.3', Charging: 'ASAP (10min = 5hrs)', Weight: '240g' },
    },
    {
      name: 'Bose QuietComfort 45', brand: 'Bose', price: 24500, mrp: 34999,
      stock: 35, images: img('boseqc45'),
      description: 'World-class noise cancellation with Quiet and Aware modes. 24-hour battery, premium audio, and all-day comfort.',
      specs: { Type: 'Over-Ear Wireless', Battery: '24 hrs', ANC: 'Active (Quiet / Aware)', Connectivity: 'Bluetooth 5.1', Charging: 'USB-C', Weight: '240g', Foldable: 'Yes' },
    },
  ],

  Cameras: [
    {
      name: 'Canon EOS R50', brand: 'Canon', price: 74995, mrp: 89995,
      stock: 20, images: img('canoneosr50'),
      description: '24.2MP APS-C mirrorless camera with DIGIC X processor, Dual Pixel CMOS AF II, and 4K video. Perfect for content creators and beginners.',
      specs: { Sensor: '24.2MP APS-C CMOS', Processor: 'DIGIC X', AF: 'Dual Pixel CMOS AF II', Video: '4K 30fps / 1080p 120fps', 'Burst Rate': '15fps', Display: '3" Vari-Angle Touch', Connectivity: 'Wi-Fi, Bluetooth' },
    },
    {
      name: 'Sony Alpha ZV-E10', brand: 'Sony', price: 54990, mrp: 79990,
      stock: 18, images: img('sonyzve10'),
      description: 'APS-C mirrorless built for vlogging. Vari-angle LCD, real-time Eye AF, and directional 3-capsule microphone for creators.',
      specs: { Sensor: '24.2MP APS-C Exmor CMOS', Video: '4K 30fps / 1080p 120fps', AF: 'Real-time Eye AF', Display: '3" Vari-Angle Flip', Connectivity: 'Wi-Fi, Bluetooth', Weight: '343g (body only)' },
    },
    {
      name: 'Nikon Z30', brand: 'Nikon', price: 64995, mrp: 79995,
      stock: 22, images: img('nikonz30'),
      description: 'Compact APS-C mirrorless designed for video creators. 20.9MP sensor, 4K UHD, and in-body stabilization. No optical viewfinder for a lighter build.',
      specs: { Sensor: '20.9MP APS-C BSI CMOS', Video: '4K 30fps / 1080p 120fps', AF: 'Phase-detect 209 points', Display: '3" Tilting Touch', 'Battery Life': '300 shots', Connectivity: 'Wi-Fi, Bluetooth', Weight: '405g' },
    },
  ],

  "Men's Clothing": [
    {
      name: "Levi's 511 Slim Fit Jeans", brand: "Levi's", price: 2499, mrp: 4499,
      stock: 150, images: img('levisjeans'),
      description: "Classic 511 slim fit in stretch denim for comfort and flexibility. Levi's signature craftsmanship for all-day wear.",
      specs: { Fit: 'Slim', Material: '98% Cotton, 2% Elastane', Rise: 'Mid-Rise', Closure: 'Zip Fly', Care: 'Machine Wash' },
    },
    {
      name: 'Allen Solly Men Formal Shirt', brand: 'Allen Solly', price: 1299, mrp: 2499,
      stock: 200, images: img('allensollyformal'),
      description: 'Premium slim-fit full-sleeve formal shirt. Cotton-blend fabric for breathability and all-day freshness.',
      specs: { Fit: 'Slim Fit', Material: '60% Cotton, 40% Polyester', Sleeve: 'Full Sleeve', Collar: 'Spread Collar', Care: 'Machine Wash' },
    },
    {
      name: 'Nike Dri-FIT Training T-Shirt', brand: 'Nike', price: 1799, mrp: 2999,
      stock: 180, images: img('niketshirt'),
      description: "Dri-FIT technology wicks sweat away to keep you dry during workouts. Lightweight fabric with a relaxed fit.",
      specs: { Fit: 'Standard Fit', Material: '100% Polyester', Technology: 'Dri-FIT', Sleeve: 'Short Sleeve', Care: 'Machine Wash' },
    },
    {
      name: 'Peter England Men Chinos', brand: 'Peter England', price: 1899, mrp: 3499,
      stock: 120, images: img('pechinos'),
      description: 'Smart-casual slim taper chinos in super-soft cotton twill. All-day comfort for work or weekend outings.',
      specs: { Fit: 'Slim Taper', Material: '97% Cotton, 3% Elastane', Rise: 'Mid-Rise', Closure: 'Zip Fly', Pockets: '4 Pockets' },
    },
    {
      name: 'Tommy Hilfiger Classic Polo', brand: 'Tommy Hilfiger', price: 2999, mrp: 5499,
      stock: 80, images: img('tommypolo'),
      description: 'Iconic polo with signature flag embroidery. Premium cotton piqué fabric for a polished, comfortable look.',
      specs: { Fit: 'Regular Fit', Material: '100% Cotton Piqué', Sleeve: 'Short Sleeve', Collar: 'Polo Collar', Care: 'Machine Wash' },
    },
  ],

  "Women's Clothing": [
    {
      name: 'Biba Printed Anarkali Kurta', brand: 'Biba', price: 1499, mrp: 2999,
      stock: 120, isFeatured: true, images: img('bibaanarkali'),
      description: 'Elegant anarkali kurta with vibrant floral print in pure cotton. Perfect for festive and casual occasions.',
      specs: { Fabric: 'Pure Cotton', Style: 'Anarkali', Print: 'Floral', Sleeves: 'Three-Quarter', Occasion: 'Festive / Casual' },
    },
    {
      name: 'W for Woman Straight Kurta', brand: 'W', price: 899, mrp: 1799,
      stock: 180, images: img('wkurta'),
      description: 'Versatile straight-cut kurta with minimalist print, V-neckline, and side slits for easy movement.',
      specs: { Fabric: 'Polyester Blend', Style: 'Straight', Sleeves: 'Half Sleeves', Neckline: 'V-Neck', Occasion: 'Casual / Office' },
    },
    {
      name: 'H&M Floral Wrap Dress', brand: 'H&M', price: 1499, mrp: 2999,
      stock: 90, images: img('hmwrapdress'),
      description: 'Flowy wrap dress with floral print and side tie. Lightweight viscose drapes beautifully for a feminine silhouette.',
      specs: { Fabric: '100% Viscose', Style: 'Wrap', Pattern: 'Floral Print', Sleeves: 'Short Puff Sleeves', Occasion: 'Casual / Brunch' },
    },
    {
      name: 'Libas Embroidered Silk Suit Set', brand: 'Libas', price: 2499, mrp: 4999,
      stock: 65, images: img('libassuitset'),
      description: 'Luxurious art-silk suit set with intricate thread embroidery and matching dupatta. Perfect for celebrations.',
      specs: { Fabric: 'Art Silk', Style: 'Straight Kurta with Dupatta', Embroidery: 'Thread Work', Sleeves: 'Full Sleeves', Occasion: 'Festive / Wedding' },
    },
    {
      name: 'Aurelia Ethnic Palazzo Set', brand: 'Aurelia', price: 1799, mrp: 3499,
      stock: 110, images: img('aureliapalazo'),
      description: 'Trendy kurta-palazzo set in ethnic print. Comfortable rayon for an effortlessly chic ethnic look.',
      specs: { Fabric: 'Rayon', Style: 'Kurta + Palazzo', Print: 'Ethnic Motif', Sleeves: 'Three-Quarter', Occasion: 'Casual / Festive' },
    },
  ],

  Footwear: [
    {
      name: 'Nike Air Max 270', brand: 'Nike', price: 9995, mrp: 12995,
      stock: 60, isFeatured: true, images: img('nikeairmax'),
      description: "Nike's tallest Air unit delivers unrivaled all-day comfort. Breathable mesh upper with the iconic Air 270 heel cushioning.",
      specs: { Type: "Men's Lifestyle", Upper: 'Engineered Mesh', Sole: 'Rubber', 'Air Unit': 'Max Air 270', Closure: 'Lace-up' },
    },
    {
      name: 'Adidas Ultraboost 22', brand: 'Adidas', price: 12999, mrp: 17999,
      stock: 45, images: img('adidasultraboost'),
      description: 'Best energy-returning running shoes with BOOST midsole and Continental rubber outsole. Primeknit+ upper for a sock-like fit.',
      specs: { Type: "Men's Running", Upper: 'Primeknit+', Midsole: 'BOOST', Outsole: 'Continental™ Rubber', Drop: '10mm', 'Arch Type': 'Neutral' },
    },
    {
      name: 'Puma Softride Essential', brand: 'Puma', price: 2999, mrp: 5999,
      stock: 110, images: img('pumasoftride'),
      description: 'Cloud-like comfort with Softride foam midsole and slip-on design. Breathable mesh upper for everyday wear.',
      specs: { Type: 'Training / Casual', Upper: 'Mesh', Midsole: 'Softride Foam', Closure: 'Slip-On', Gender: 'Unisex' },
    },
    {
      name: 'Bata Power Oxford Shoes', brand: 'Bata', price: 1799, mrp: 3499,
      stock: 140, images: img('bataoxford'),
      description: 'Classic Oxford formal shoes with leather-finish upper and shock-absorbing TPR sole. Ideal for office and formal occasions.',
      specs: { Type: 'Formal', Upper: 'Synthetic Leather', Sole: 'TPR', Closure: 'Lace-up', Occasion: 'Office / Formal', Color: 'Black' },
    },
    {
      name: 'Skechers Go Walk 6', brand: 'Skechers', price: 4499, mrp: 7499,
      stock: 80, images: img('skechersgowalk'),
      description: 'Ultra-lightweight walking shoes with Air-Cooled Goga Mat insole and 5GEN midsole. Machine-washable slip-on design.',
      specs: { Type: 'Walking', Upper: 'Machine Washable Knit', Insole: 'Air-Cooled Goga Mat', Midsole: '5GEN', Closure: 'Slip-On', Weight: '200g per shoe' },
    },
  ],

  'Kitchen Appliances': [
    {
      name: 'Prestige Iris 750W Mixer Grinder', brand: 'Prestige', price: 2999, mrp: 5499,
      stock: 110, isFeatured: true, images: img('prestigemixer'),
      description: '750W Instatex motor with 3 stainless steel jars. Heavy-duty performance for everyday grinding, blending, and chutney making.',
      specs: { Power: '750W', Jars: '3 (1.5L + 1.0L + 0.4L)', Speed: '3 Speeds + Pulse', Material: 'Stainless Steel Jars', Warranty: '2 Yrs Product, 5 Yrs Motor' },
    },
    {
      name: 'LG 28L Convection Microwave', brand: 'LG', price: 12990, mrp: 19990,
      stock: 35, images: img('lgmicrowave'),
      description: 'Convection microwave with Smart Inverter technology and 301 auto-cook menus. Charcoal Healthy Cooking for healthier meals.',
      specs: { Capacity: '28 Litres', Type: 'Convection + Grill + Solo', Power: '900W', 'Auto Cook': '301 Menus', Voltage: '230V 50Hz', Warranty: '1 Year' },
    },
    {
      name: 'Philips HD9252 Air Fryer', brand: 'Philips', price: 6995, mrp: 11995,
      stock: 70, images: img('philipsairfryer'),
      description: 'Rapid Air Technology for crispy results with up to 90% less fat. 4.1L XXL capacity with 13 preset programs and digital touchscreen.',
      specs: { Capacity: '4.1L', Power: '1400W', Technology: 'Rapid Air', Programs: '13', Temperature: '80-200°C', Timer: '60 min', Warranty: '2 Years' },
    },
    {
      name: 'Pigeon Pressure Cooker 5L', brand: 'Pigeon', price: 899, mrp: 1799,
      stock: 200, images: img('pigeonpc'),
      description: 'Aluminium pressure cooker with induction-compatible base. Triple safety valve and ergonomic handles.',
      specs: { Capacity: '5 Litres', Material: 'Aluminium', Base: 'Induction Compatible', Safety: 'Triple Valve', Warranty: '2 Years' },
    },
    {
      name: 'Instant Pot Duo 5.7L', brand: 'Instant Pot', price: 8999, mrp: 13999,
      stock: 40, images: img('instantpot'),
      description: '7-in-1 electric pressure cooker: Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Sauté Pan, Yogurt Maker, Warmer.',
      specs: { Capacity: '5.7 Litres', Functions: '7-in-1', Power: '1200W', Programs: '14', 'Safety Features': '10+', Material: 'Stainless Steel Inner Pot', Warranty: '1 Year' },
    },
  ],

  'Home Decor': [
    {
      name: 'Nilkamal Plastic Chair Set of 4', brand: 'Nilkamal', price: 2499, mrp: 3999,
      stock: 90, images: img('nilkamalchair'),
      description: 'Durable UV-stabilised plastic chairs, weather-resistant and stackable for easy storage. Holds up to 150 kg per chair.',
      specs: { Material: 'Virgin Plastic', Capacity: '150 kg each', Dimensions: '87 x 55 x 48 cm', Stackable: 'Yes', Usage: 'Indoor / Outdoor', Warranty: '1 Year' },
    },
    {
      name: 'Story@Home 250TC King Bed Sheet Set', brand: 'Story@Home', price: 699, mrp: 1499,
      stock: 250, images: img('bedsheet'),
      description: '250 TC pure cotton bed sheet with 2 pillow covers. Soft, breathable, machine washable with fade-resistant reactive print.',
      specs: { Material: '100% Cotton', 'Thread Count': '250 TC', Size: 'King (108" x 108")', Includes: '1 Bed Sheet + 2 Pillow Covers', Care: 'Machine Washable' },
    },
    {
      name: 'Solaro Silent Wall Clock', brand: 'Solaro', price: 549, mrp: 999,
      stock: 180, images: img('wallclock'),
      description: 'Modern frameless wall clock with sweep silent mechanism. Acrylic glass lens for noise-free timekeeping.',
      specs: { Diameter: '30 cm', Mechanism: 'Silent Sweep', Power: '1x AA Battery', Frame: 'Acrylic', Mounting: 'Wall Hanging', Warranty: '1 Year' },
    },
    {
      name: 'India Circus Ceramic Decorative Vase', brand: 'India Circus', price: 999, mrp: 1999,
      stock: 75, images: img('decorvase'),
      description: 'Hand-painted ceramic vase with India Circus signature motifs. Elegant table decor piece for living room or bedroom.',
      specs: { Material: 'Ceramic', Height: '25 cm', Print: 'Hand Painted', Usage: 'Decorative / Flower Vase', Care: 'Wipe Clean', Origin: 'India' },
    },
  ],

  'Exercise Equipment': [
    {
      name: 'Kore 10 KG Rubber Hex Dumbbell Pair', brand: 'Kore', price: 999, mrp: 1999,
      stock: 120, images: img('hexdumbbell'),
      description: 'Solid cast-iron core with rubber hex coating — prevents rolling and floor damage. Knurled chrome handle for secure grip.',
      specs: { Weight: '10 kg (pair)', Material: 'Cast Iron + Rubber Coating', Shape: 'Hexagonal', Handle: 'Knurled Chrome', Use: 'Strength Training' },
    },
    {
      name: 'Boldfit Pro Yoga Mat 6mm', brand: 'Boldfit', price: 599, mrp: 1299,
      stock: 200, images: img('yogamat'),
      description: 'Anti-slip TPE yoga mat with alignment lines for correct posture. Eco-friendly, moisture-resistant with carrying strap included.',
      specs: { Thickness: '6mm', Material: 'TPE (Eco-Friendly)', Dimensions: '183 x 61 cm', Surface: 'Anti-Slip', Weight: '1 kg', Includes: 'Carrying Strap' },
    },
    {
      name: 'Lifelong Fit Pro Spin Bike', brand: 'Lifelong', price: 12999, mrp: 24999,
      stock: 20, isFeatured: true, images: img('spinbike'),
      description: '8 kg flywheel indoor cycling bike with adjustable seat, handlebar, and resistance dial. LED display for time, speed, distance, and calories.',
      specs: { Flywheel: '8 kg', Resistance: 'Friction (Manual)', Display: 'LED Multi-Function', 'Max User Weight': '110 kg', Seat: 'Adjustable (V + H)', Handlebar: 'Adjustable' },
    },
    {
      name: 'Nivia Kashmir Willow Cricket Bat', brand: 'Nivia', price: 799, mrp: 1599,
      stock: 85, images: img('cricketbat'),
      description: 'Full-size Kashmir Willow cricket bat with cane handle for shock absorption. Grade 2 willow for hard ball cricket on all pitches.',
      specs: { Wood: 'Kashmir Willow', Size: 'Full Size', Handle: 'Cane Handle', Weight: '1.1-1.3 kg', Grade: 'Grade 2', Cover: 'Included' },
    },
  ],

  Fiction: [
    {
      name: 'The Alchemist', brand: 'HarperCollins', price: 299, mrp: 399,
      stock: 300, images: img('alchemist'),
      description: "Paulo Coelho's masterpiece — the magical story of Santiago, a shepherd boy who follows his dream across the desert. Translated into 80+ languages.",
      specs: { Author: 'Paulo Coelho', Publisher: 'HarperCollins', Pages: '197', Language: 'English', Format: 'Paperback', Genre: 'Literary Fiction' },
    },
    {
      name: 'Wings of Fire: An Autobiography', brand: 'Universities Press', price: 199, mrp: 299,
      stock: 400, images: img('wingsoffire'),
      description: "APJ Abdul Kalam's inspiring autobiography tracing his journey from humble beginnings in Rameswaram to becoming the Missile Man of India.",
      specs: { Author: 'A.P.J. Abdul Kalam', Publisher: 'Universities Press', Pages: '204', Language: 'English', Format: 'Paperback', Genre: 'Autobiography' },
    },
  ],

  'Non-Fiction': [
    {
      name: 'Atomic Habits', brand: 'Penguin', price: 399, mrp: 499,
      stock: 350, isFeatured: true, images: img('atomichabits'),
      description: "James Clear's #1 NYT bestseller — a proven framework for building good habits and breaking bad ones through tiny, consistent changes.",
      specs: { Author: 'James Clear', Publisher: 'Penguin Random House', Pages: '320', Language: 'English', Format: 'Paperback', Genre: 'Self-Help / Productivity' },
    },
    {
      name: 'The Psychology of Money', brand: 'Harriman House', price: 349, mrp: 499,
      stock: 280, images: img('psychmoney'),
      description: "Morgan Housel's 19 timeless lessons on wealth, greed, and happiness — doing well with money is about behaviour, not knowledge.",
      specs: { Author: 'Morgan Housel', Publisher: 'Harriman House', Pages: '256', Language: 'English', Format: 'Paperback', Genre: 'Personal Finance' },
    },
  ],

  // ── Mobiles ──────────────────────────────────────────────────────────────────

  'Mobile Phones': [
    {
      name: 'Samsung Galaxy M34 5G (Midnight Blue, 8GB+128GB)', brand: 'Samsung',
      price: 16999, mrp: 22999, stock: 120, isFeatured: true, images: img('samsung-m34'),
      description: '6000mAh battery with 25W fast charging. 6.5" FHD+ Super AMOLED 120Hz display. 50MP triple camera with OIS for sharp, stable shots every time.',
      specs: { Display: '6.5" FHD+ Super AMOLED 120Hz', Processor: 'Exynos 1280', RAM: '8GB', Storage: '128GB', Camera: '50MP + 8MP + 2MP', Battery: '6000mAh', OS: 'Android 14, One UI 6', Charging: '25W' },
    },
    {
      name: 'Redmi 12 5G (Jade Black, 4GB+128GB)', brand: 'Xiaomi',
      price: 10999, mrp: 14999, stock: 200, images: img('redmi-12-5g'),
      description: 'Snapdragon 4 Gen 2 with 5G connectivity. 6.79" HD+ 90Hz display. 50MP AI dual camera system with night mode for stunning low-light photos.',
      specs: { Display: '6.79" HD+ 90Hz IPS', Processor: 'Snapdragon 4 Gen 2', RAM: '4GB', Storage: '128GB', Camera: '50MP + 2MP', Battery: '5000mAh', OS: 'Android 13, MIUI 14', Charging: '18W' },
    },
    {
      name: 'Realme Narzo 60 Pro 5G (Cosmic Black, 8GB+256GB)', brand: 'Realme',
      price: 17999, mrp: 24999, stock: 90, isFeatured: true, images: img('realme-narzo60'),
      description: 'MediaTek Dimensity 7050 with 67W SUPERVOOC charging. 6.7" Curved AMOLED 120Hz display. 100MP AI camera with OIS for exceptional photography.',
      specs: { Display: '6.7" Curved AMOLED 120Hz', Processor: 'Dimensity 7050', RAM: '8GB', Storage: '256GB', Camera: '100MP + 2MP', Battery: '5000mAh', OS: 'Android 13, Realme UI 4.0', Charging: '67W SUPERVOOC' },
    },
    {
      name: 'OnePlus Nord CE 3 Lite 5G (Chromatic Gray, 8GB+128GB)', brand: 'OnePlus',
      price: 19999, mrp: 25999, stock: 75, images: img('oneplus-nordce3'),
      description: 'Snapdragon 695 5G with a massive 5000mAh battery and 67W SUPERVOOC charging. 6.72" LCD 120Hz display for smooth scrolling. Triple camera setup.',
      specs: { Display: '6.72" FHD+ IPS 120Hz', Processor: 'Snapdragon 695 5G', RAM: '8GB', Storage: '128GB', Camera: '108MP + 2MP + 2MP', Battery: '5000mAh', OS: 'Android 13, OxygenOS 13.1', Charging: '67W SUPERVOOC' },
    },
    {
      name: 'Poco X6 Pro 5G (Black, 12GB+256GB)', brand: 'Poco',
      price: 26999, mrp: 33999, stock: 110, isFeatured: true, images: img('poco-x6pro'),
      description: 'MediaTek Dimensity 8300 Ultra — the fastest chip in its class. 6.67" 144Hz 1.5K AMOLED display. 64MP OIS triple camera with UltraHD video.',
      specs: { Display: '6.67" 1.5K AMOLED 144Hz', Processor: 'Dimensity 8300 Ultra', RAM: '12GB', Storage: '256GB', Camera: '64MP OIS + 8MP + 2MP', Battery: '5000mAh', OS: 'Android 14, HyperOS', Charging: '67W Turbo' },
    },
    {
      name: 'iQOO Z9 5G (Brushed Green, 8GB+128GB)', brand: 'iQOO',
      price: 15999, mrp: 21999, stock: 85, images: img('iqoo-z9'),
      description: 'Dimensity 7200 with 120Hz curved AMOLED display. 6000mAh dual-cell battery with 44W FlashCharge. 50MP Sony IMX882 OIS primary camera.',
      specs: { Display: '6.67" AMOLED 120Hz', Processor: 'Dimensity 7200', RAM: '8GB', Storage: '128GB', Camera: '50MP OIS + 2MP', Battery: '6000mAh', OS: 'Android 14, Funtouch OS 14', Charging: '44W FlashCharge' },
    },
    {
      name: 'Motorola Edge 40 Neo (Black Beauty, 12GB+256GB)', brand: 'Motorola',
      price: 23999, mrp: 31999, stock: 60, images: img('moto-edge40neo'),
      description: 'Dimensity 7030 with pOLED display and TurboPower 68W charging. IP68 water resistant. 50MP OIS wide camera with Sony sensors for sharp photography.',
      specs: { Display: '6.55" pOLED 144Hz', Processor: 'Dimensity 7030', RAM: '12GB', Storage: '256GB', Camera: '50MP OIS + 13MP Ultra Wide', Battery: '5000mAh', OS: 'Android 13', Charging: '68W TurboPower', 'Water Resistance': 'IP68' },
    },
    {
      name: 'Vivo T2 Pro 5G (Dazzling Gold, 8GB+128GB)', brand: 'Vivo',
      price: 21999, mrp: 27999, stock: 70, images: img('vivo-t2pro'),
      description: 'MediaTek Dimensity 7200 with 67W FlashCharge. 6.78" curved AMOLED 120Hz E4 display. 64MP triple camera with OIS and 4K video recording capability.',
      specs: { Display: '6.78" Curved AMOLED 120Hz', Processor: 'Dimensity 7200', RAM: '8GB', Storage: '128GB', Camera: '64MP OIS + 8MP + 2MP', Battery: '4600mAh', OS: 'Android 13, Funtouch OS 13', Charging: '67W FlashCharge' },
    },
  ],

  'Mobile Accessories': [
    {
      name: 'Anker 65W USB-C GaN Fast Charger', brand: 'Anker',
      price: 1999, mrp: 3499, stock: 250, isFeatured: true, images: img('anker-gancharger'),
      description: 'Compact 65W GaN charger compatible with all USB-C devices. Charges MacBook, iPhone, Android phones simultaneously. Safety-certified with temperature control.',
      specs: { Output: '65W Max', Ports: '1x USB-C', Technology: 'GaN', Compatibility: 'Universal USB-C', Safety: 'Multi-protection', Size: 'Compact Foldable Plug', Warranty: '18 Months' },
    },
    {
      name: 'boAt Bassheads 100 Wired Earphones', brand: 'boAt',
      price: 299, mrp: 699, stock: 500, images: img('boat-bassheads100'),
      description: '10mm dynamic driver for punchy bass. In-line mic with multi-function button. Tangle-resistant cable with 3.5mm gold-plated jack.',
      specs: { Driver: '10mm Dynamic', Connector: '3.5mm Gold Plated', Cable: '1.2m Tangle-Free', Mic: 'In-line with Button', Frequency: '20Hz–20kHz', Sensitivity: '98dB' },
    },
    {
      name: 'Spigen Tough Armor iPhone 15 Case', brand: 'Spigen',
      price: 899, mrp: 1999, stock: 300, images: img('spigen-iphone15'),
      description: 'Dual-layer protection with Air Cushion Technology for military-grade drop protection. Kickstand and wireless charging compatible.',
      specs: { Compatibility: 'iPhone 15', Material: 'PC + TPU', Protection: 'Military Grade Drop', 'Wireless Charging': 'Compatible', Kickstand: 'Built-in', Weight: '60g' },
    },
  ],

  // ── Beauty ────────────────────────────────────────────────────────────────────

  Skincare: [
    {
      name: 'Minimalist 10% Niacinamide Face Serum 30ml', brand: 'Minimalist',
      price: 349, mrp: 549, stock: 300, isFeatured: true, images: img('minimalist-niacinamide'),
      description: 'High-strength 10% Niacinamide + 1% Zinc to visibly reduce pores and control sebum. Dermatologist formulated, fragrance-free, non-comedogenic.',
      specs: { 'Key Ingredient': '10% Niacinamide + 1% Zinc PCA', Volume: '30ml', 'Skin Type': 'All Skin Types', Fragrance: 'Free', pH: '5.5–6.0', Dermatologist: 'Tested', Cruelty: 'Free' },
    },
    {
      name: 'Dot & Key Vitamin C + E Super Bright Serum 20ml', brand: 'Dot & Key',
      price: 595, mrp: 895, stock: 180, isFeatured: true, images: img('dotkey-vitc'),
      description: '15% Vitamin C + Vitamin E brightening serum that fades dark spots and evens skin tone. Hyaluronic acid for deep hydration. Dermatologist tested.',
      specs: { 'Key Ingredient': '15% Vitamin C + Vitamin E', Volume: '20ml', 'Skin Type': 'All Skin Types', 'Key Benefit': 'Brightening + Anti-oxidant', Dermatologist: 'Tested', Cruelty: 'Free', Vegan: 'Yes' },
    },
    {
      name: 'Cetaphil Moisturising Cream 250g', brand: 'Cetaphil',
      price: 499, mrp: 799, stock: 400, images: img('cetaphil-cream'),
      description: 'Clinically proven to hydrate and restore dry, sensitive skin for 48 hours. Non-greasy formula absorbed instantly. Dermatologist recommended.',
      specs: { 'Product Type': 'Moisturising Cream', Volume: '250g', 'Skin Type': 'Dry / Sensitive', 'Key Ingredient': 'Glycerin + Niacinamide', SPF: 'None', Fragrance: 'Free', Paraben: 'Free' },
    },
    {
      name: 'Neutrogena Hydro Boost Water Gel 50g', brand: 'Neutrogena',
      price: 599, mrp: 999, stock: 220, images: img('neutrogena-hydroboost'),
      description: 'Non-comedogenic water-gel moisturiser with Hyaluronic Acid that provides continuous 24-hour hydration. Oil-free, lightweight formula for oily skin.',
      specs: { 'Key Ingredient': 'Hyaluronic Acid', Volume: '50g', 'Skin Type': 'Oily / Combination', Texture: 'Water Gel', Oil: 'Free', Non: 'Comedogenic', SPF: 'None' },
    },
    {
      name: 'Plum Green Tea Alcohol-Free Toner 200ml', brand: 'Plum',
      price: 275, mrp: 449, stock: 350, images: img('plum-greentea-toner'),
      description: 'Green Tea-powered alcohol-free toner that mattifies, minimises pores and balances oily skin. 100% vegan, paraben-free with skin-loving antioxidants.',
      specs: { 'Key Ingredient': 'Green Tea Extract + Glycerin', Volume: '200ml', 'Skin Type': 'Oily / Acne-Prone', Alcohol: 'Free', Vegan: '100%', Paraben: 'Free', pH: '5.0–6.0' },
    },
    {
      name: 'WOW Skin Science Vitamin C Face Wash 100ml', brand: 'WOW',
      price: 249, mrp: 399, stock: 450, images: img('wow-vitc-facewash'),
      description: 'Brightening face wash with 15% Vitamin C and Mulberry Extract. Gently cleanses, brightens complexion and reduces dark spots. Sulphate-free formula.',
      specs: { 'Key Ingredient': '15% Vitamin C + Mulberry', Volume: '100ml', 'Skin Type': 'All Types', 'Sulfate': 'Free', 'Paraben': 'Free', 'Usage': 'Daily Twice', Cruelty: 'Free' },
    },
    {
      name: 'La Shield Sunscreen SPF 50+ PA+++ 60g', brand: 'La Shield',
      price: 349, mrp: 599, stock: 280, images: img('lashield-sunscreen'),
      description: 'Dermatologist-recommended broad-spectrum sunscreen SPF 50+. Lightweight, non-sticky formula with no white cast. Water resistant for 80 minutes.',
      specs: { SPF: '50+ PA+++', Volume: '60g', Coverage: 'Broad Spectrum', Water: 'Resistant 80 min', Texture: 'Gel-Cream', White: 'Cast Free', Dermatologist: 'Recommended' },
    },
  ],

  Makeup: [
    {
      name: 'Maybelline Fit Me Matte + Poreless Foundation (N30)', brand: 'Maybelline',
      price: 399, mrp: 649, stock: 300, isFeatured: true, images: img('maybelline-fitme'),
      description: 'Blurs pores for a naturally matte, smooth finish. Oil-control formula with micro-powders. 40 inclusive shades. Dermatologist tested, non-comedogenic.',
      specs: { Coverage: 'Medium to Full', Finish: 'Matte', Skin: 'Oily / Combination', SPF: 'None', Volume: '30ml', Dermatologist: 'Tested', Shades: '40+' },
    },
    {
      name: "L'Oreal Paris Matte Addiction Lipstick (Scarlet Silhouette)", brand: "L'Oreal Paris",
      price: 449, mrp: 749, stock: 350, isFeatured: true, images: img('loreal-matte-lip'),
      description: 'Ultra-matte longwear lipstick with 70% hydration. Delivers intense color with a velvety matte finish that lasts up to 8 hours.',
      specs: { Finish: 'Ultra-Matte', 'Wear Time': 'Up to 8 Hours', Hydration: '70% Moisture', Formula: 'Weightless', Fragrance: 'Subtle', Cruelty: 'Free' },
    },
    {
      name: 'SUGAR Cosmetics Matte Attack Transferproof Lipstick (07)', brand: 'SUGAR',
      price: 349, mrp: 599, stock: 280, images: img('sugar-matte-lip'),
      description: 'Ultra-pigmented, transfer-proof matte lipstick that glides on like butter. Lasts up to 12 hours without touch-up. 20 stunning Indian-curated shades.',
      specs: { Finish: 'Matte', 'Wear Time': 'Up to 12 Hours', 'Transfer Proof': 'Yes', 'Shades': '20+', Formula: 'Creamy Glide', Cruelty: 'Free', Vegan: 'Yes' },
    },
    {
      name: 'Lakme Eyeconic Kajal Twin Pack', brand: 'Lakme',
      price: 249, mrp: 349, stock: 500, images: img('lakme-kajal'),
      description: "India's most loved kajal — long-lasting, intense black kohl that glides smoothly. Smudge-resistant formula with micro-precision tip for perfect definition.",
      specs: { Type: 'Kohl / Kajal', Finish: 'Intense Black', 'Wear Time': 'Up to 16 Hours', Smudge: 'Resistant', 'Tip': 'Micro-Precision', Quantity: '2 Units' },
    },
    {
      name: 'NYX Professional Makeup Butter Gloss (Éclair)', brand: 'NYX',
      price: 399, mrp: 699, stock: 200, images: img('nyx-buttergloss'),
      description: 'Creamy, cushiony lip gloss with a non-sticky, high-shine finish. Infused with shea butter, vanilla and cherry extracts for moisturised, plump-looking lips.',
      specs: { Finish: 'High-Shine Gloss', Formula: 'Non-Sticky', 'Key Ingredient': 'Shea Butter', Scent: 'Vanilla + Cherry', Volume: '8ml', Vegan: 'Yes', Cruelty: 'Free' },
    },
    {
      name: 'Faces Canada Ultime Pro Eyeshadow Palette (Nude)', brand: 'Faces Canada',
      price: 699, mrp: 1199, stock: 150, images: img('facescanada-palette'),
      description: '12 richly pigmented eyeshadow shades ranging from matte to shimmer. Blendable, buildable, and long-wearing formula for all-day eye looks.',
      specs: { Shades: '12', Finish: 'Matte + Shimmer', 'Coverage': 'Buildable', 'Wear': 'Long-lasting', 'Cruelty': 'Free', 'Vegan': 'Yes', Quantity: '12g total' },
    },
  ],

  'Hair Care': [
    {
      name: "L'Oreal Paris Fall Resist 3X Shampoo 340ml", brand: "L'Oreal Paris",
      price: 329, mrp: 549, stock: 400, isFeatured: true, images: img('loreal-shampoo'),
      description: '3X anti-hair fall action: strengthens hair roots, nourishes hair fibre, and protects against breakage. Dermatologist recommended formula.',
      specs: { 'Hair Type': 'Hair Fall Prone', Volume: '340ml', 'Key Ingredient': 'Arginine + Salicylic Acid', 'Sulfate': 'Free', Usage: 'Daily Use', Dermatologist: 'Recommended' },
    },
    {
      name: 'TRESemmé Keratin Smooth Shampoo + Conditioner 580ml', brand: 'TRESemmé',
      price: 499, mrp: 799, stock: 300, images: img('tresemme-keratin'),
      description: 'Salon-inspired keratin shampoo and conditioner that smoothens and tames frizzy hair for up to 72 hours. Infused with marula oil for shine.',
      specs: { 'Hair Type': 'Frizzy / Dry', Volume: '580ml (combo)', 'Key Ingredient': 'Keratin + Marula Oil', 'Frizz Control': '72 Hours', 'Includes': 'Shampoo + Conditioner' },
    },
    {
      name: 'Mamaearth Onion Hair Oil 250ml', brand: 'Mamaearth',
      price: 349, mrp: 549, stock: 350, images: img('mamaearth-onionoil'),
      description: 'Enriched with Onion Oil and Redensyl to reduce hair fall and promote regrowth. 100% toxin-free with no mineral oil, sulfates, or parabens.',
      specs: { 'Key Ingredient': 'Onion Oil + Redensyl', Volume: '250ml', 'Hair Type': 'All Types', 'Toxin': 'Free', 'Mineral Oil': 'Free', 'Sulfate': 'Free', Cruelty: 'Free' },
    },
    {
      name: 'Dove Intense Repair Conditioner 180ml', brand: 'Dove',
      price: 199, mrp: 299, stock: 450, images: img('dove-conditioner'),
      description: 'Keratin Actives formula penetrates deep to repair damage from within. 100x softer, stronger hair in 1 wash. Works on all hair types.',
      specs: { 'Hair Type': 'Damaged / Dry', Volume: '180ml', 'Key Ingredient': 'Keratin Actives + Fibercure', Usage: 'Post Shampoo', 'Silicone': 'Free', 'Dermatologist': 'Tested' },
    },
  ],

  // ── Toys ──────────────────────────────────────────────────────────────────────

  'Educational Toys': [
    {
      name: 'LEGO Classic Large Creative Brick Box (790 Pieces)', brand: 'LEGO',
      price: 3499, mrp: 5999, stock: 80, isFeatured: true, images: img('lego-classic'),
      description: '790 LEGO bricks in 33 colours with inspiration booklet. Build cars, trains, houses, animals and more. Develops creativity and motor skills for ages 4+.',
      specs: { Pieces: '790', 'Age Group': '4+ Years', Colors: '33 Classic Colors', Includes: 'Inspiration Booklet', Material: 'ABS Plastic', 'Safety': 'CE Certified', Brand: 'LEGO' },
    },
    {
      name: 'Fisher-Price Laugh & Learn Smart Learning Home', brand: 'Fisher-Price',
      price: 2799, mrp: 4499, stock: 60, images: img('fisherprice-learninghome'),
      description: 'Interactive learning toy with 10+ activities teaching letters, numbers, shapes, and music. Grows with your child from 6 months to 3 years.',
      specs: { 'Age Group': '6 Months - 3 Years', Activities: '10+', 'Learning Areas': 'Letters + Numbers + Shapes + Music', 'Batteries': '3 AA (included)', Material: 'BPA-Free Plastic', Safety: 'EN71 Certified' },
    },
    {
      name: "Rubik's Cube 3x3 Original (Speed Cube)", brand: "Rubik's",
      price: 449, mrp: 799, stock: 300, isFeatured: true, images: img('rubiks-cube'),
      description: "The world's best-selling puzzle toy. Original 3x3 Rubik's Cube with 43 quintillion possible combinations. Develops spatial reasoning and problem-solving.",
      specs: { Dimension: '5.7 x 5.7 x 5.7 cm', 'Age Group': '8+ Years', Material: 'ABS Plastic', 'Solving Time': 'Average 3–5 min for beginners', Safety: 'Non-Toxic', Weight: '110g' },
    },
    {
      name: 'Funskool Monopoly (Indian Version)', brand: 'Funskool',
      price: 699, mrp: 1099, stock: 120, images: img('funskool-monopoly'),
      description: 'Classic Monopoly board game with Indian cities and properties. Develops financial literacy, strategy, and negotiation skills. For 2–6 players, ages 8+.',
      specs: { Players: '2–6', 'Age Group': '8+ Years', Duration: '60–180 mins', Language: 'English', Components: 'Board, Cards, Tokens, Dice, Houses, Hotels', 'Skill': 'Strategy + Negotiation' },
    },
    {
      name: 'Meccano Evolution 25 Metal Building Set', brand: 'Meccano',
      price: 1799, mrp: 2999, stock: 70, images: img('meccano-set'),
      description: '25 real metal parts with screws, nuts, and tools for 5 different vehicle builds. Develops STEM skills and fine motor coordination for ages 8+.',
      specs: { Pieces: '25+', 'Age Group': '8+ Years', Material: 'Real Metal', Builds: '5 Vehicle Models', Includes: 'Wrench + Screwdriver', 'Skill Development': 'STEM + Motor Skills' },
    },
    {
      name: 'Skillmatics Card Game: Guess in 10 Animal Kingdom', brand: 'Skillmatics',
      price: 399, mrp: 649, stock: 200, images: img('skillmatics-guessin10'),
      description: 'Award-winning card game for 2–6 players. Ask smart questions and guess the animal in 10 clues or fewer. Builds critical thinking for ages 6-99.',
      specs: { Players: '2–6', 'Age Group': '6+ Years', Cards: '60 Animal Cards', Duration: '20–30 mins', 'Award': 'National Parenting Product Award', Skill: 'Critical Thinking' },
    },
  ],

  'Action Figures': [
    {
      name: 'Hot Wheels 20 Car Gift Pack', brand: 'Hot Wheels',
      price: 999, mrp: 1599, stock: 200, isFeatured: true, images: img('hotwheels-20pack'),
      description: '20 die-cast Hot Wheels cars in 1:64 scale — assorted styles and colors. Collectible mini cars for kids and adult collectors. Ages 3+.',
      specs: { Pieces: '20 Cars', Scale: '1:64', Material: 'Die-Cast Metal', 'Age Group': '3+ Years', Length: '~7cm each', Collectible: 'Yes', 'Safety': 'EN71 Certified' },
    },
    {
      name: 'Marvel Avengers Iron Man 6" Action Figure', brand: 'Hasbro',
      price: 799, mrp: 1299, stock: 150, images: img('marvel-ironman'),
      description: 'Highly detailed Iron Man action figure with 4 points of articulation. Collector-quality paint and sculpt inspired by Marvel movies. For ages 4+.',
      specs: { Height: '6 inches (15cm)', Character: 'Iron Man', 'Points of Articulation': '4', Material: 'ABS Plastic', 'Age Group': '4+ Years', Licence: 'Official Marvel', Collector: 'Grade' },
    },
    {
      name: 'Chhota Bheem Dholakpur Heroes Combo Pack', brand: 'Funskool',
      price: 599, mrp: 999, stock: 120, images: img('chhota-bheem-set'),
      description: 'Official Chhota Bheem figurines — Bheem, Chutki, Raju, and Kalia. Highly detailed, durable plastic figures inspired by the hit Indian cartoon. Ages 3+.',
      specs: { Characters: '4 (Bheem + Chutki + Raju + Kalia)', Height: '~8cm each', Material: 'Non-Toxic ABS', 'Age Group': '3+ Years', Licence: 'Official Green Gold', 'Safety': 'IS 9873 Certified' },
    },
    {
      name: 'Barbie Fashionistas Doll — Curvy, Black Hair', brand: 'Barbie',
      price: 699, mrp: 1099, stock: 180, images: img('barbie-fashionista'),
      description: 'Curvy Barbie doll with black hair and trendy outfit. Includes doll, fashion outfit, shoes, and accessories. Celebrates diversity in fashion. Ages 3+.',
      specs: { Height: '11.5 inches (29cm)', Body: 'Curvy', Includes: 'Doll + Outfit + Shoes', Material: 'Soft Vinyl + ABS', 'Age Group': '3+ Years', 'Articulation': '10 Points' },
    },
    {
      name: 'Minecraft Creeper Action Figure 7" Foam', brand: 'Minecraft',
      price: 499, mrp: 899, stock: 140, images: img('minecraft-creeper'),
      description: 'Officially licensed 7" foam Creeper figure from Minecraft. Soft, safe material ideal for young fans. Screen-accurate design with detailed pixelated texture.',
      specs: { Height: '7 inches (18cm)', Material: 'EVA Foam (Soft)', Character: 'Creeper', Game: 'Minecraft', 'Age Group': '4+ Years', Licence: 'Official Mojang', Weight: '180g' },
    },
  ],

  // ── Two Wheelers ──────────────────────────────────────────────────────────────

  Bikes: [
    {
      name: 'Hero Splendor Plus IBS BS6 (Black Viper Red)', brand: 'Hero',
      price: 74900, mrp: 79900, stock: 15, isFeatured: true, images: img('hero-splendor'),
      description: "India's best-selling motorcycle with i3S technology for fuel efficiency. Integrated Braking System, Side Stand Indicator, and USB charging port. 80+ kmpl.",
      specs: { Engine: '97.2cc Single-Cylinder Air-Cooled', Power: '7.91 bhp @ 8000rpm', Torque: '8.05 Nm @ 6000rpm', 'Fuel Efficiency': '80+ kmpl', Brakes: 'IBS (Drum)', Fuel: 'Petrol', Gears: '4-Speed' },
    },
    {
      name: 'Bajaj Pulsar NS200 BS6 (Pewter Grey)', brand: 'Bajaj',
      price: 148500, mrp: 158500, stock: 8, isFeatured: true, images: img('bajaj-pulsarns200'),
      description: 'Triple spark plug DTS-i technology 200cc engine for maximum combustion efficiency. Perimeter frame, adjustable monoshock, and petal disc brakes front and rear.',
      specs: { Engine: '199.5cc DOHC Liquid-Cooled', Power: '24.5 bhp @ 9750rpm', Torque: '18.74 Nm @ 8000rpm', 'Fuel Efficiency': '35–40 kmpl', Brakes: 'Dual Disc', Fuel: 'Petrol', Gears: '6-Speed' },
    },
    {
      name: 'Royal Enfield Meteor 350 Fireball (Red)', brand: 'Royal Enfield',
      price: 210000, mrp: 225000, stock: 6, isFeatured: true, images: img('re-meteor350'),
      description: "India's best-selling cruiser motorcycle. Modern 349cc J-series engine with Tripper Navigation, Roto Grip Switches, and class-leading comfort for long rides.",
      specs: { Engine: '349cc J-series Air-Cooled', Power: '20.2 bhp @ 6100rpm', Torque: '27 Nm @ 4000rpm', 'Fuel Efficiency': '36.2 kmpl', Brakes: 'Dual Disc + ABS', Fuel: 'Petrol', 'Navigation': 'Tripper Pod' },
    },
    {
      name: 'Honda CB Shine SP Drum CBS BS6 (Black)', brand: 'Honda',
      price: 82000, mrp: 87000, stock: 12, images: img('honda-cbshine'),
      description: 'Enhanced Superior Performance with HET (Honda Eco Technology) for excellent fuel efficiency. CBS (Combined Braking System) for safer deceleration.',
      specs: { Engine: '124cc Single-Cylinder Air-Cooled', Power: '10.16 bhp @ 7500rpm', Torque: '10.9 Nm @ 5500rpm', 'Fuel Efficiency': '60+ kmpl', Brakes: 'Drum + CBS', Fuel: 'Petrol', Gears: '5-Speed' },
    },
    {
      name: 'TVS Apache RTR 160 4V (Racing Edition Blue)', brand: 'TVS',
      price: 118000, mrp: 128000, stock: 10, images: img('tvs-apache160'),
      description: 'Race DNA in an everyday package. Oil-cooled 4-valve engine with SmartXonnect Bluetooth, Race Tuned Fuel Injection, and Glide Through Technology.',
      specs: { Engine: '159.7cc Oil-Cooled 4-Valve', Power: '17.55 bhp @ 9250rpm', Torque: '14.73 Nm @ 7250rpm', 'Fuel Efficiency': '45.7 kmpl', Brakes: 'Dual Disc + ABS', Connectivity: 'SmartXonnect Bluetooth', Gears: '5-Speed' },
    },
    {
      name: 'Yamaha FZ-S FI V3.0 Matte (Matte Black)', brand: 'Yamaha',
      price: 125000, mrp: 133000, stock: 9, images: img('yamaha-fzs'),
      description: 'Y-Connect app connectivity, LED headlamp, and Bluetooth enabled instrument cluster. Fuel-injected 149cc engine with Assist and Slipper Clutch for sporty riding.',
      specs: { Engine: '149cc Blue Core Air-Cooled', Power: '12.4 bhp @ 7250rpm', Torque: '13.3 Nm @ 5500rpm', 'Fuel Efficiency': '51.2 kmpl', Brakes: 'Disc + SBC', Connectivity: 'Y-Connect Bluetooth', Clutch: 'Assist & Slipper' },
    },
  ],

  Scooters: [
    {
      name: 'Honda Activa 125 H-Smart OBD2 (Rebel Red Metallic)', brand: 'Honda',
      price: 98000, mrp: 103000, stock: 20, isFeatured: true, images: img('honda-activa125'),
      description: "Segment-first Smartphone Voice Control and Alexa Connectivity. 125cc fuel-injected engine for 60+ kmpl efficiency. OBD2 compliant with LED indicators.",
      specs: { Engine: '124cc Single-Cylinder eSP+', Power: '8.29 bhp @ 6500rpm', Torque: '10.9 Nm @ 5000rpm', 'Fuel Efficiency': '60+ kmpl', Brakes: 'Drum + CBS', Connectivity: 'Alexa + Voice Control', Storage: '26 Litres' },
    },
    {
      name: 'TVS Jupiter Classic Edition (Matte Cyan Blue)', brand: 'TVS',
      price: 88000, mrp: 93000, stock: 16, images: img('tvs-jupiter'),
      description: 'Largest under-seat storage in segment at 22 litres. ETFi engine with Econometer for fuel tracking. Mobile charging socket, external fuel fill, and ride modes.',
      specs: { Engine: '109.7cc Single-Cylinder', Power: '7.7 bhp @ 7500rpm', Torque: '8.8 Nm @ 5500rpm', 'Fuel Efficiency': '51 kmpl', Brakes: 'Drum + CBS', 'Under-Seat Storage': '22 Litres', Charging: 'USB Port' },
    },
    {
      name: 'Suzuki Access 125 Special Edition (Sunset Glow Red)', brand: 'Suzuki',
      price: 92000, mrp: 98000, stock: 14, images: img('suzuki-access125'),
      description: 'Smooth 125cc fuel-injected engine with Superior Idling System. Large 21.5L underseat storage, digital instrument cluster, and external fuel lid with key shutter.',
      specs: { Engine: '124cc SOHC Fuel-Injected', Power: '8.7 bhp @ 6750rpm', Torque: '10 Nm @ 5500rpm', 'Fuel Efficiency': '58.5 kmpl', Brakes: 'Drum + CBS', 'Under-Seat Storage': '21.5 Litres', Instrument: 'Full Digital' },
    },
    {
      name: 'Yamaha Fascino 125 Fi Hybrid (Cyan)', brand: 'Yamaha',
      price: 95000, mrp: 101000, stock: 12, images: img('yamaha-fascino'),
      description: "India's first 125cc hybrid scooter with Smart Motor Generator for quick restarts. Y-Connect Bluetooth app with call + SMS alerts. 3.4Ah smart battery.",
      specs: { Engine: '125cc Blue Core + SMG Hybrid', Power: '8.2 bhp @ 6500rpm', Torque: '10.3 Nm @ 5000rpm', 'Fuel Efficiency': '66.4 kmpl', Brakes: 'Drum + UBS', Connectivity: 'Y-Connect Bluetooth', Technology: 'Hybrid SMG' },
    },
  ],
};

// ─── Review comment pool ──────────────────────────────────────────────────────
const COMMENTS = [
  'Absolutely love this product! Exceeded my expectations in every way.',
  'Great value for money. Build quality is solid and performance is excellent.',
  'Delivery was super fast and packaging was very secure. Product is exactly as described.',
  'Been using this for a month now and it works perfectly. Highly recommended!',
  'Good product overall. Setup was easy and it works as advertised.',
  'The quality is impressive for the price. Will definitely buy again.',
  'Very happy with this purchase. Customer service was also helpful.',
  'Performs exactly as described. No complaints whatsoever.',
  'Slightly took time to arrive but the product quality made the wait worth it.',
  'Excellent! My family loves it. Already recommended to 3 friends.',
  'Durable and well-made. Exactly what I was looking for at this price range.',
  'Works like a charm. Interface is intuitive and easy to use.',
];

// ─── Indian addresses ─────────────────────────────────────────────────────────
const ADDRESSES = [
  { street: '42 MG Road, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
  { street: '15 Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  { street: '7 Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700016' },
  { street: '88 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
  { street: '23 FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
  { street: '5 CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009' },
  { street: '11 Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  { street: '34 Sector 17', city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
];

const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'delivered'];
const PAYMENT_METHODS = ['cod', 'online', 'online', 'online', 'cod']; // matches Order schema enum

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Cleared existing collections');

    // ── Users ──
    const hashedAdmin = await bcrypt.hash('Admin@1234', SALT);
    const hashedUser  = await bcrypt.hash('User@1234',  SALT);

    const customerNames = [
      'Priya Sharma', 'Rahul Verma', 'Ananya Singh', 'Arjun Mehta',
      'Sneha Patel', 'Karthik Nair', 'Divya Reddy', 'Rohit Gupta',
    ];

    const userDocs = await User.insertMany([
      {
        name: 'Admin User', email: 'admin@flipkart.com',
        password: hashedAdmin, role: 'admin',
        addresses: [ADDRESSES[0]],
      },
      ...customerNames.map((name, i) => ({
        name, email: `user${i + 1}@flipkart.com`,
        password: hashedUser, role: 'user',
        addresses: [ADDRESSES[i % ADDRESSES.length]],
        phone: `98${String(1000000000 + i * 111111111).slice(0, 8)}`,
      })),
    ]);

    const [adminUser, ...customers] = userDocs;
    console.log(`Created ${userDocs.length} users`);

    // ── Categories ──
    const parentDocs = await Category.insertMany(
      PARENTS.map((p) => ({ name: p.name, slug: slug(p.name), image: p.image, parent: null }))
    );
    const parentMap = Object.fromEntries(parentDocs.map((d) => [d.name, d]));

    const subRows = [];
    for (const [parentName, subNames] of Object.entries(SUBS)) {
      for (const subName of subNames) {
        subRows.push({
          name: subName,
          slug: slug(subName),
          image: SUB_IMAGES[subName] || '',
          parent: parentMap[parentName]._id,
        });
      }
    }
    const subDocs = await Category.insertMany(subRows);
    const subMap = Object.fromEntries(subDocs.map((d) => [d.name, d]));
    console.log(`Created ${parentDocs.length + subDocs.length} categories`);

    // ── Products ──
    const allProductRows = [];
    for (const [catName, prods] of Object.entries(PRODUCTS)) {
      const catId = subMap[catName]._id;
      for (const p of prods) {
        allProductRows.push({
          name: p.name, description: p.description,
          price: p.price, mrp: p.mrp,
          images: p.images, category: catId,
          brand: p.brand, stock: p.stock,
          specs: p.specs || {},
          isFeatured: p.isFeatured || false,
          ratings: 0, numReviews: 0,
        });
      }
    }
    const productDocs = await Product.insertMany(allProductRows);
    console.log(`Created ${productDocs.length} products`);

    // ── Reviews ──
    const reviewRows = [];
    const seen = new Set(); // track "productId-userId" to respect unique index

    for (let pi = 0; pi < productDocs.length; pi++) {
      const product = productDocs[pi];
      const reviewCount = ri(3, 5);
      const reviewers = pick(customers, reviewCount);

      for (const customer of reviewers) {
        const key = `${product._id}-${customer._id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        reviewRows.push({
          product: product._id,
          user: customer._id,
          rating: ri(3, 5),
          comment: COMMENTS[(pi + reviewRows.length) % COMMENTS.length],
        });
      }
    }
    const reviewDocs = await Review.insertMany(reviewRows);
    console.log(`Created ${reviewDocs.length} reviews`);

    // Update product ratings and numReviews
    const ratingMap = {};
    for (const r of reviewDocs) {
      const id = r.product.toString();
      if (!ratingMap[id]) ratingMap[id] = { sum: 0, count: 0 };
      ratingMap[id].sum   += r.rating;
      ratingMap[id].count += 1;
    }
    await Promise.all(
      Object.entries(ratingMap).map(([id, { sum, count }]) =>
        Product.findByIdAndUpdate(id, {
          ratings: parseFloat((sum / count).toFixed(1)),
          numReviews: count,
        })
      )
    );
    console.log('Updated product ratings');

    // ── Orders ──
    const orderRows = [];
    for (let i = 0; i < customers.length; i++) {
      const customer   = customers[i];
      const orderCount = ri(1, 2);
      const addr       = ADDRESSES[i % ADDRESSES.length];

      for (let o = 0; o < orderCount; o++) {
        const itemCount = ri(1, 3);
        const items = pick(productDocs, itemCount).map((p) => ({
          product:   p._id,
          productId: p._id.toString(),
          name:      p.name,
          price:     p.price,
          mrp:       p.mrp,
          image:     p.images?.[0] ?? '',
          quantity:  ri(1, 2),
        }));
        const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

        orderRows.push({
          user:   customer._id,
          items,
          shippingAddress: {
            fullName: customer.name,
            phone:    customer.phone ?? `98${String(i).padStart(9, '0')}`,
            street:   addr.street,
            city:     addr.city,
            state:    addr.state,
            pincode:  addr.pincode,
          },
          paymentMethod: PAYMENT_METHODS[ri(0, PAYMENT_METHODS.length - 1)],
          paymentStatus: 'paid',
          status: ORDER_STATUSES[ri(0, ORDER_STATUSES.length - 1)],
          total,
        });
      }
    }
    await Order.insertMany(orderRows);
    console.log(`Created ${orderRows.length} orders`);

    // ── Wishlists ──
    for (let i = 0; i < customers.length; i++) {
      const wishlistItems = pick(productDocs, ri(2, 5)).map((p) => p._id);
      await User.findByIdAndUpdate(customers[i]._id, { wishlist: wishlistItems });
    }
    console.log('Updated customer wishlists');

    // ── Carts (a few active carts) ──
    const cartCustomers = pick(customers, 4);
    await Promise.all(
      cartCustomers.map((customer) =>
        Cart.create({
          user: customer._id,
          items: pick(productDocs, ri(1, 3)).map((p) => ({ product: p._id, quantity: ri(1, 2) })),
        })
      )
    );
    console.log('Created sample carts');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin : admin@flipkart.com  / Admin@1234');
    customerNames.forEach((name, i) =>
      console.log(`User ${i + 1}: user${i + 1}@flipkart.com / User@1234  (${name})`)
    );
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
