/**
 * ScratchSmart SWFL - Omni-Parser Wiretap v6.0
 * * Instructions:
 * 1. Ensure your GitHub Action has these repository secrets: SUPABASE_URL, SUPABASE_ANON_KEY.
 * 2. Copy/Paste this into your existing scraper.js file.
 * 3. The script will navigate, wait for full load, rip raw text, parse via Regex, and push to Supabase.
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_URL = 'https://floridalottery.com/games/scratch-offs/top-remaining-prizes';

async function runScraper() {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('Navigating to Lottery Portal...');
        await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: 60000 });

        // Extract using raw text pattern matching
        const extractedGames = await page.evaluate(() => {
            const games = [];
            // Target every table row and process as a raw string
            const rows = Array.from(document.querySelectorAll('tr'));

            rows.forEach(row => {
                const text = row.innerText.replace(/\s+/g, ' ').trim();
                
                // Match ID (e.g., #5048) and Name
                const idMatch = text.match(/#(\d+)/);
                if (!idMatch) return; 

                const gameNumber = parseInt(idMatch[1], 10);
                const name = text.split(/\(#\d+\)/)[0].trim();
                
                // Extract currency values
                const dollars = text.match(/\$[0-9,.]+/g) || [];
                const topPrize = dollars.length > 0 ? parseFloat(dollars[0].replace(/[^0-9.]/g, '')) : 0;
                const price = dollars.length > 1 ? parseFloat(dollars[dollars.length - 1].replace(/[^0-9.]/g, '')) : 0;
                
                // Extract "X of Y" remaining prizes
                const remMatch = text.match(/(\d+)\s+of\s+(\d+)/i);
                const remaining = remMatch ? parseInt(remMatch[1], 10) : 0;
                const totalStart = remMatch ? parseInt(remMatch[2], 10) : remaining + 3;

                if (gameNumber && topPrize > 0) {
                    games.push({
                        id: gameNumber,
                        name: name,
                        price: price,
                        topPrize: topPrize,
                        topPrizesRemaining: remaining,
                        topPrizesStart: totalStart,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            return games;
        });

        console.log(`Successfully parsed ${extractedGames.length} games.`);
        
        // Push payload
        const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: extractedGames }]);
        
        if (error) throw error;
        console.log('Sync complete.');

    } catch (e) {
        console.error('Execution Failed:', e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

runScraper();

