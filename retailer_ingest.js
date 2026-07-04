/**
 * ScratchSmart SWFL - Geospatial Ingestion Engine v2.0
 * Fixed Overpass API Body Formatting
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OVERPASS_QUERY = `
  [out:json][timeout:30];
  (
    node["shop"="supermarket"](26.50,-82.50,27.20,-81.70);
    node["shop"="convenience"](26.50,-82.50,27.20,-81.70);
    node["amenity"="fuel"](26.50,-82.50,27.20,-81.70);
  );
  out body;
`;

async function ingestRetailers() {
    console.log("Initiating Geospatial Satellite Sweep (Overpass API)...");
    
    try {
        // THE FIX: Properly formatting the payload with 'data=' and encoding the query
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: "data=" + encodeURIComponent(OVERPASS_QUERY)
        });

        if (!response.ok) {
            throw new Error(`Overpass API rejected connection: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const nodes = data.elements || [];
        
        console.log(`Radar sweep complete. Found ${nodes.length} potential retail locations in SWFL Grid.`);

        let parsedStores = [];

        nodes.forEach(node => {
            const name = node.tags?.name || node.tags?.brand;
            if (!name) return; 

            let storeType = 'Independent';
            const nameUpper = name.toUpperCase();
            if (nameUpper.includes('PUBLIX')) storeType = 'Supermarket';
            if (nameUpper.includes('CIRCLE K') || nameUpper.includes('WAWA') || nameUpper.includes('7-ELEVEN')) storeType = 'Chain Convenience';
            if (node.tags?.amenity === 'fuel') storeType = 'Gas Station';

            let city = 'SWFL Grid';
            if (node.lat > 27.05) city = 'Venice';
            else if (node.lat > 27.00) city = 'North Port';
            else if (node.lat > 26.90) city = 'Port Charlotte';
            else if (node.lat > 26.85) city = 'Punta Gorda';
            else city = 'Fort Myers / Cape Coral';

            parsedStores.push({
                name: name,
                store_type: storeType,
                city: city,
                latitude: node.lat,
                longitude: node.lon
            });
        });

        console.log(`Filtered to ${parsedStores.length} named retail hubs. Pushing to Cloud Brain...`);

        await supabase.from('swfl_retailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        let successCount = 0;
        for (let i = 0; i < parsedStores.length; i += 500) {
            const batch = parsedStores.slice(i, i + 500);
            const { error } = await supabase.from('swfl_retailers').insert(batch);
            if (error) {
                console.error(`Batch Error:`, error.message);
            } else {
                successCount += batch.length;
            }
        }
        
        console.log(`Successfully mapped ${successCount} retail locations. Geospatial Grid is active.`);

    } catch (error) {
        console.error("Geospatial Ingestion Failed:", error.message);
        process.exit(1);
    }
}

ingestRetailers();

3. Save/commit that change.
4. Go back to **Actions** and hit **Run workflow** on the "1-Time Geospatial Map Ingestion" one more time.

Please hold me accountable. Let me know exactly what the logs say after you run this.
