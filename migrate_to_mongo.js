const dns = require('dns');
// Force use of Google DNS to bypass local SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Models
const User = require('./models/User');
const Category = require('./models/Category');
const Item = require('./models/Item');
const Post = require('./models/Post');
const Shortcut = require('./models/Shortcut');

const DB_PATH = path.join(__dirname, 'database.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mymoney';

async function migrate() {
    try {
        console.log('--- Database Migration Started ---');
        
        if (!fs.existsSync(DB_PATH)) {
            console.error('Error: database.json not found!');
            return;
        }

        let rawData = fs.readFileSync(DB_PATH, 'utf8');
        // Handle UTF-8 BOM if present
        if (rawData.charCodeAt(0) === 0xFEFF) {
            rawData = rawData.slice(1);
        }
        const data = JSON.parse(rawData);

        console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected Successfully.');

        // Clear existing data (Optional: Remove if you want to append)
        console.log('Cleaning up existing collections...');
        await Promise.all([
            User.deleteMany({}),
            Category.deleteMany({}),
            Item.deleteMany({}),
            Post.deleteMany({}),
            Shortcut.deleteMany({})
        ]);

        // 1. Migrate Users
        if (data.usersDB) {
            console.log(`Migrating ${data.usersDB.length} users...`);
            await User.insertMany(data.usersDB);
        }

        // 2. Migrate Categories
        if (data.categories) {
            console.log(`Migrating ${data.categories.length} categories...`);
            await Category.insertMany(data.categories);
        }

        // 3. Migrate Items
        if (data.items) {
            console.log(`Migrating ${data.items.length} items...`);
            await Item.insertMany(data.items);
        }

        // 4. Migrate News & Board (Unified as Posts)
        let totalPosts = 0;
        if (data.newsData) {
            const news = data.newsData.map(p => ({ ...p, postType: 'news' }));
            await Post.insertMany(news);
            totalPosts += news.length;
        }
        if (data.boardData) {
            const board = data.boardData.map(p => ({ ...p, postType: 'board' }));
            await Post.insertMany(board);
            totalPosts += board.length;
        }
        console.log(`Migrating ${totalPosts} posts (news + board)...`);

        // 5. Migrate Shortcuts
        if (data.shortcuts) {
            console.log(`Migrating ${data.shortcuts.length} shortcuts...`);
            await Shortcut.insertMany(data.shortcuts);
        }

        console.log('--- Migration Completed Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
