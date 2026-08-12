import Product  from '../models/Product.js';
import Category from '../models/Category.js'; // must be imported so Mongoose registers the schema before populate() runs

const SORT_MAP = {
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
  rating:     { ratings: -1 },
  newest:     { createdAt: -1 },
  relevance:  { isFeatured: -1, ratings: -1 },
};

function buildQuery(q, minPrice, maxPrice) {
  const query   = { isListed: true }; // never show de-listed products to users
  const trimmed = (q || '').trim();

  if (trimmed) {
    query.$or = [
      { name:        { $regex: trimmed, $options: 'i' } },
      { brand:       { $regex: trimmed, $options: 'i' } },
      { description: { $regex: trimmed, $options: 'i' } },
    ];
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  return query;
}

// GET /api/products/search?q=&page=1&limit=20&sort=relevance&minPrice=&maxPrice=
export async function searchProducts(req, res) {
  try {
    const { q = '', page = 1, limit = 20, sort = 'relevance', minPrice, maxPrice } = req.query;
    const query   = buildQuery(q, minPrice, maxPrice);
    const sortObj = SORT_MAP[sort] || SORT_MAP.relevance;
    const skip    = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .select('name price mrp images brand ratings numReviews stock isFeatured')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/products/category/:slug?page=&limit=&sort=&brand=&minPrice=&maxPrice=&rating=&discount=
export async function getProductsByCategory(req, res) {
  try {
    const { slug } = req.params;
    const {
      page = 1, limit = 20, sort = 'relevance',
      brand, minPrice, maxPrice, rating, discount,
    } = req.query;

    // 1. Find category by exact slug or partial name match
    const keyword = slug.replace(/-/g, ' ');
    const category = await Category.findOne({
      $or: [
        { slug },
        { name: { $regex: new RegExp(keyword, 'i') } },
      ],
    }).lean();

    // 2. Build base filter
    const filter = { isListed: { $ne: false } };

    if (category) {
      const subs = await Category.find({ parent: category._id }).lean();
      filter.category = { $in: [category._id, ...subs.map(s => s._id)] };
    } else {
      // Fallback: treat slug as a keyword across name/brand/description
      filter.$or = [
        { name:        { $regex: keyword, $options: 'i' } },
        { brand:       { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 3. Apply user filters
    if (brand) {
      const list = brand.split(',').map(b => b.trim()).filter(Boolean);
      filter.brand = { $in: list.map(b => new RegExp(`^${b}$`, 'i')) };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (rating) filter.ratings = { $gte: Number(rating) };
    if (discount) {
      const pct = Number(discount);
      const andClause = {
        $expr: {
          $gte: [
            { $multiply: [{ $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] }, 100] },
            pct,
          ],
        },
      };
      filter.$and = [...(filter.$and || []), andClause];
    }

    const sortObj = SORT_MAP[sort] || SORT_MAP.relevance;
    const skip    = (Number(page) - 1) * Number(limit);

    const brandFilter = { ...filter };
    delete brandFilter.brand; // get ALL brands in category regardless of selected brand

    const [products, total, brands] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .select('name price mrp images brand ratings numReviews stock isFeatured')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
      Product.distinct('brand', brandFilter),
    ]);

    res.json({
      products,
      total,
      page:     Number(page),
      pages:    Math.ceil(total / Number(limit)),
      brands:   brands.filter(Boolean).sort(),
      category: category || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/products/:id
export async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/products/:id/similar  (same category, different product)
export async function getSimilarProducts(req, res) {
  try {
    const product = await Product.findById(req.params.id).select('category brand').lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const similar = await Product.find({
      _id:      { $ne: product._id },
      category: product.category,
      isListed: { $ne: false },
    })
      .select('name price mrp images brand ratings numReviews stock isFeatured')
      .sort({ isFeatured: -1, ratings: -1 })
      .limit(10)
      .lean();

    res.json({ products: similar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/products/suggestions?q=   (top 5 lightweight hits for live dropdown)
export async function getSuggestions(req, res) {
  try {
    const trimmed = (req.query.q || '').trim();
    if (!trimmed) return res.json({ suggestions: [] });

    const products = await Product.find({
      isListed: true,   // exclude de-listed from live suggestions
      $or: [
        { name:  { $regex: trimmed, $options: 'i' } },
        { brand: { $regex: trimmed, $options: 'i' } },
      ],
    })
      .select('name brand price images ratings')
      .limit(5)
      .lean();

    res.json({ suggestions: products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
