const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true }
}, { _id: false });

const categorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subCategories: [subCategorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
