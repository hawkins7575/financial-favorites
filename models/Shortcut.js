const mongoose = require('mongoose');

const shortcutSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shortcut', shortcutSchema);
