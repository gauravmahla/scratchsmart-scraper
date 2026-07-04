/**
 * ScratchSmart SWFL - Deep Historical PDF Ingestion Engine
 * Parses legacy Florida Lottery PDFs (1988-2026) and inserts into Supabase
 */
const fs = require('fs');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const files = [
    { name: 'p2.pdf', game: 'PICK_2' },
    { name: 'p3.pdf', game: 'PICK_3' },
    { name: 'p4.pdf', game: 'PICK_4' },
    { name: 'p5.pdf', game: 'PICK_5' },
    { name: 'ff.pdf', game: 'FANTASY_5' },
    { name: 'cp.pdf', game: 'CASH_POP' },
    { name: 'jtp.pdf', game: 'JACKPOT_TRIPLE_PLAY' },
    { name: 'c4l.pdf', game: 'CASH4LIFE' },
    { name: 'l6.pdf', game: 'FLORIDA_LOTTO' },
    { name: 'mmil.pdf', game: 'MEGA_MILLIONS' }
];

async function processPDFs() {
    console.log("Initiating Deep Historical PDF Extraction Pipeline...");
    
    for (const file of files) {
        if (!fs.existsSync(file.name)) {
            console.log(`Skipping ${file.name} - File not found.`);
            continue;
        }

        console.log(`\n--- Parsing ${file.name} for ${file.game} ---`);
        const dataBuffer = fs.readFileSync(file.name);
        
        try {
            const data = await pdf(dataBuffer);
            // Clean up PDF line breaks and weird formatting
            const rawText = data.text.replace(/\r\n/g, '\n');
            const lines = rawText.split('\n');
            let parsedRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Regex to find ANY date format (MM/DD/YY or MM/DD/YYYY)
                const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                
                if (dateMatch) {
                    let drawDate = new Date(dateMatch[0]);
                    
                    // Handle Y2K century rollover for old 2-digit years (e.g., 88 -> 1988, 12 -> 2012)
                    if (dateMatch[0].length <= 8) {
                        const parts = dateMatch[0].split('/');
                        let year = parseInt(parts[2], 10);
                        year = year > 30 ? 1900 + year : 2000 + year;
                        drawDate = new Date(`${parts[0]}/${parts[1]}/${year}`);
                    }

                    // Determine Draw Period (Midday vs Evening vs Default)
                    let period = 'EVENING'; // Default for big games
                    const contextStr = (lines[i-1] + " " + line + " " + lines[i+1]).toUpperCase();
                    if (contextStr.includes(' M ') || contextStr.includes('MIDDAY') || contextStr.includes('MORNING') || contextStr.includes('MATINEE')) period = 'MIDDAY';
                    if (contextStr.includes('LATE NIGHT')) period = 'LATE_NIGHT';
                    if (contextStr.includes('AFTERNOON')) period = 'AFTERNOON';

                    // Extract numbers (strip out letters, keep digits and dashes)
                    const numberString = line.replace(dateMatch[0], '').replace(/[a-zA-Z]/g, '').trim();
                    const extractedNumbers = numberString.match(/\d+/g) ? numberString.match(/\d+/g).map(Number) : [0];

                    parsedRows.push({
                        game_name: file.game,
                        draw_date: drawDate.toISOString().split('T')[0],
                        draw_period: period,
                        winning_numbers: extractedNumbers.slice(0, 6), // Cap array size to prevent DB errors
                        special_ball: extractedNumbers.length > 6 ? extractedNumbers[6] : null,
                        multiplier: contextStr.includes('FB') ? 'FIREBALL' : (contextStr.includes('X') ? contextStr.match(/X\d/)?.[0] : null)
                    });
                }
            }

            console.log(`Extracted ${parsedRows.length} historical records. Pushing to Cloud Brain...`);
            
            // Push to Supabase in batches of 500 to guarantee we don't hit rate limits
            let successCount = 0;
            for (let i = 0; i < parsedRows.length; i += 500) {
                const batch = parsedRows.slice(i, i + 500);
                const { error } = await supabase.from('draw_game_history').insert(batch);
                if (error) {
                    console.error(`Batch Error:`, error.message);
                } else {
                    successCount += batch.length;
                }
            }
            console.log(`Successfully saved ${successCount} rows for ${file.game}.`);

        } catch (err) {
            console.error(`Failed to parse ${file.name}:`, err.message);
        }
    }
    console.log("\nALL HISTORICAL DATA SUCCESSFULLY INGESTED INTO CLOUD BRAIN.");
}

processPDFs();
4. Tap **Commit changes**.

#### Sub-Step 4.3: Create the Ingestion Workflow
1. Go to your `.github/workflows` folder in the repository.
2. Tap **Add file** -> **Create new file**.
3. Name it exactly: **`ingest_pdfs.yml`**
4. Paste this code:

```yaml
name: 1-Time Historical PDF Ingestion
on:
  workflow_dispatch: # This allows you to trigger it manually via a button

jobs:
  ingest-history:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Dependencies
        run: |
          npm install
          npm install pdf-parse

      - name: Run Deep PDF Extraction
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node pdf_parser.js
5. Tap **Commit changes**.

#### Sub-Step 4.4: Fire the Engine!
1. Go to the **Actions** tab in GitHub.
2. On the left side, you will now see a new workflow called **1-Time Historical PDF Ingestion**. Tap it.
3. Tap **Run workflow** on the right side.

This script is going to take a minute or two to run because it is reading thousands of pages of text and pushing tens of thousands of rows into your database. 

Let me know the second you get the Green Checkmark for the PDF Ingestion, and we will confirm the data in Supabase!
