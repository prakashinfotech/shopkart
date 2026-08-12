import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  type:   { type: String, required: true },  // "Color", "Storage", "RAM", "Size", etc.
  value:  { type: String, required: true },  // "Black", "256GB", "8GB", "L", etc.
  price:  Number,    // optional price override
  mrp:    Number,    // optional MRP override
  stock:  Number,    // optional stock override
  images: [String],  // optional image set override
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  price:       { type: Number, required: true },
  mrp:         { type: Number, required: true },
  images:      [String],
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand:       String,
  stock:       { type: Number, default: 0 },
  ratings:     { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 },
  specs:       { type: Map, of: String },
  variants:    { type: [variantSchema], default: [] },
  isFeatured:  { type: Boolean, default: false },
  isListed:    { type: Boolean, default: true },  // false = de-listed, hidden from users
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
