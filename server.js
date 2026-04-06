require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Models
const User = require('./models/User');
const Category = require('./models/Category');
const Item = require('./models/Item');
const Post = require('./models/Post');
const Shortcut = require('./models/Shortcut');

const app = express();
const PORT = process.env.PORT || 8086;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection Cache (for Vercel/Serverless optimization)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        if (!MONGODB_URI) {
            console.warn('MONGODB_URI is not defined. Using local fallback if possible.');
            // On Vercel, this should be an error, but for local dev we might have a default
            if (process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is missing');
        }

        const db = await mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/mymoney', {
            // Options for robustness
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        isConnected = db.connections[0].readyState;
        console.log('Connected to MongoDB Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Do not throw here to allow the server to start, 
        // but APIs will fail gracefully with 500
    }
};

// Middleware to ensure DB connection for API routes
app.use('/api', async (req, res, next) => {
    await connectDB();
    next();
});

// API: Get All Data (Full State)
app.get('/api/data', async (req, res) => {
    try {
        const [usersDB, categories, items, posts, shortcuts] = await Promise.all([
            User.find({}),
            Category.find({}),
            Item.find({}),
            Post.find({}),
            Shortcut.find({})
        ]);

        const fullData = {
            usersDB,
            categories,
            items,
            newsData: posts.filter(p => p.postType === 'news'),
            boardData: posts.filter(p => p.postType === 'board'),
            shortcuts
        };

        res.json(fullData);
    } catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// API: Save All Data (Sync)
app.post('/api/data', async (req, res) => {
    try {
        const { usersDB, categories, items, newsData, boardData, shortcuts } = req.body;

        if (usersDB) { await User.deleteMany({}); await User.insertMany(usersDB); }
        if (categories) { await Category.deleteMany({}); await Category.insertMany(categories); }
        if (items) { await Item.deleteMany({}); await Item.insertMany(items); }
        
        await Post.deleteMany({});
        if (newsData) await Post.insertMany(newsData.map(p => ({ ...p, postType: 'news' })));
        if (boardData) await Post.insertMany(boardData.map(p => ({ ...p, postType: 'board' })));
        
        if (shortcuts) { await Shortcut.deleteMany({}); await Shortcut.insertMany(shortcuts); }

        console.log('Database synced successfully to MongoDB');
        res.json({ success: true });
    } catch (err) {
        console.error('Error syncing to MongoDB:', err);
        res.status(500).json({ error: 'Failed to sync database' });
    }
});

// API: Fetch Metadata (URL info)
app.get('/api/fetch-meta', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(targetUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
            },
            maxRedirects: 3
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('title').text().trim() || 
                      $('meta[property="og:title"]').attr('content') || '';
        
        const description = $('meta[name="description"]').attr('content') || 
                            $('meta[property="og:description"]').attr('content') || '';

        res.json({ title, description });
    } catch (err) {
        console.warn(`Metadata fetch failed for ${targetUrl}:`, err.message);
        res.json({ title: '', description: '' });
    }
});

// SPA Fallback
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start server locally (Vercel uses the exported app)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    });
}

module.exports = app;

