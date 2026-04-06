const fs = require('fs');
const jsonPath = 'c:/Users/USER/Documents/금융즐겨찾기/database.json';

const initialShortcuts = [
    { id: 1775108856001, title: 'Naver', url: 'https://www.naver.com' },
    { id: 1775108856002, title: 'Google', url: 'https://www.google.com' },
    { id: 1775108856003, title: 'YouTube', url: 'https://www.youtube.com' },
    { id: 1775108856004, title: 'TradingView', url: 'https://www.tradingview.com' },
    { id: 1775108856005, title: 'Investing.com', url: 'https://www.investing.com' },
    { id: 1775108856006, title: 'CoinMarketCap', url: 'https://coinmarketcap.com' },
    { id: 1775108856007, title: 'Upbit', url: 'https://upbit.com' },
    { id: 1775108856008, title: 'Binance', url: 'https://www.binance.com' },
    { id: 1775108856009, title: 'Bithumb', url: 'https://www.bithumb.com' },
    { id: 1775108856010, title: 'Yahoo Finance', url: 'https://finance.yahoo.com' },
    { id: 1775108856011, title: 'MK News', url: 'https://www.mk.co.kr' },
    { id: 1775108856012, title: 'Hankyung', url: 'https://www.hankyung.com' },
    { id: 1775108856013, title: 'DART', url: 'https://dart.fss.or.kr' },
    { id: 1775108856014, title: 'KRX', url: 'http://www.krx.co.kr' },
    { id: 1775108856015, title: 'FedWatch', url: 'https://www.cmegroup.com/trading/interest-rates/countdown-to-fomc.html' },
    { id: 1775108856016, title: 'CNN Fear & Greed', url: 'https://edition.cnn.com/markets/fear-and-greed' },
    { id: 1775108856017, title: 'Finviz', url: 'https://finviz.com' },
    { id: 1775108856018, title: 'Whale Alert', url: 'https://whale-alert.io' },
    { id: 1775108856019, title: 'Glassnode', url: 'https://glassnode.com' },
    { id: 1775108856020, title: 'DefiLlama', url: 'https://defillama.com' }
];

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    data.shortcuts = initialShortcuts;
    fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf8');
    console.log('Successfully added shortcuts to database.json');
} catch (err) {
    console.error('Error modifying database.json:', err);
    process.exit(1);
}
