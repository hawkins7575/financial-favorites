const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping original timestamp-based IDs for compatibility
    title: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: mongoose.Schema.Types.Mixed }, // Can be string or array
    description: { type: String, default: '' },
    type: { type: String, enum: ['website', 'youtube', 'site'], default: 'website' },
    userId: { type: String, default: 'admin' },
    isPremium: { type: Boolean, default: false },
    icon: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
