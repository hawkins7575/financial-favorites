const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // HTML content
    timestamp: { type: Number, required: true },
    postType: { type: String, enum: ['news', 'board'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
