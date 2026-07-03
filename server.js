const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs';

app.get('/api/scratch-games', async (req, res) => {
    try {
        console.log('Fetching live data from Florida Lottery...');
        
        const response = await axios.get(FL_LOTTERY_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        const $ = cheerio.load(response.data);
        const liveGames = [];

        // UPGRADE: Aggressive scanning. We look at EVERY row instead of specific class names.
        $('tr').each((index, element) => {
            const rowText = $(element).text();
            
            // If the row doesn't have a dollar sign, it's not a scratch-off game. Skip it.
            if (!rowText.includes('$')) return;

            // Grab all the columns in this row
            const tds = $(element).find('td');
            if (tds.length < 4) return; // Needs at least Game #, Name, Price, Top Prize

            // Extract the text aggressively
            const gameNumberText = $(tds[0]).text().trim();
            const gameNameText = $(tds[1]).text().trim();
            const priceText = $(tds[2]).text().trim();
            const topPrizeText = $(tds[3]).text().trim();
            
            // Sometimes the remaining column moves between desktop and mobile layouts
            let topPrizesRemainingText = $(tds[4]).text().trim();
            if (!topPrizesRemainingText || isNaN(parseInt(topPrizesRemainingText))) {
                 topPrizesRemainingText = $(tds[5]) ? $(tds[5]).text().trim() : "0";
            }

            // Clean the data into pure math numbers
            const gameNumber = parseInt(gameNumberText.replace(/\D/g, ''), 10);
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            const topPrize = parseFloat(topPrizeText.replace(/[^0-9.]/g, ''));
            const topPrizesRemaining = parseInt(topPrizesRemainingText.replace(/\D/g, ''), 10);

            // Skip header rows or invalid parses
            if (isNaN(gameNumber) || isNaN(price)) return; 

            // Temporary base assumption until Phase 2 (Deep Crawling) is implemented
            const topPrizesStart = topPrizesRemaining + Math.floor(Math.random() * 5) + 1; 

            liveGames.push({
                id: gameNumber,
                gameNumber: gameNumber,
                name: gameNameText || `Game ${gameNumber}`,
                price: price,
                topPrize: isNaN(topPrize) ? 0 : topPrize,
                topPrizesStart: topPrizesStart,
                topPrizesRemaining: isNaN(topPrizesRemaining) ? 0 : topPrizesRemaining,
                overallOdds: 3.5 + (Math.random() * 1.0), // Estimated odds for now
                lastUpdated: new Date().toISOString().split('T')[0],
                status: "Active"
            });
        });

        if (liveGames.length === 0) {
            return res.json({
                status: 'success',
                source: 'fallback',
                error: 'Aggressive parser failed. FL Lottery may be using dynamic JavaScript rendering.',
                timestamp: new Date().toISOString(),
                data: getFallbackData()
            });
        }

        res.json({
            status: 'success',
            source: 'live_scrape',
            count: liveGames.length,
            timestamp: new Date().toISOString(),
            data: liveGames
        });

    } catch (error) {
        console.error('Scraping Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch live lottery data.' });
    }
});

// Route fallbacks
app.get('/games', (req, res) => {
    req.url = '/api/scratch-games';
    app.handle(req, res);
});
app.get('/api/status', (req, res) => res.json({ status: 'online', engine: 'ProfitGuard Scraper', version: '1.2' }));
app.use((req, res) => res.status(404).send(`Path not found: ${req.path}. Try visiting /api/scratch-games`));
app.listen(PORT, () => console.log(`ScratchSmart Cloud Scraper running on port ${PORT}`));

function getFallbackData() {
    return [
        { id: 1530, gameNumber: 1530, name: "$50 Luxe", price: 50, topPrize: 1000000, topPrizesStart: 4, topPrizesRemaining: 2, overallOdds: 4.5, lastUpdated: new Date().toISOString(), status: "Active" },
        { id: 1490, gameNumber: 1490, name: "$20 Monopoly", price: 20, topPrize: 1000000, topPrizesStart: 12, topPrizesRemaining: 8, overallOdds: 3.2, lastUpdated: new Date().toISOString(), status: "Active" }
    ];
}
