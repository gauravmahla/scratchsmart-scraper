/**
 * ScratchSmart SWFL - Geospatial Ingestion Engine
 * Queries OpenStreetMap (Overpass API) for SWFL lottery retailers
 * Inserts Coordinates and Store Types into Supabase Cloud Brain
 */
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SWFL Bounding Box (Approx: South 26.50, West -82.50, North 27.20, East -81.70)
// Captures: Port Charlotte, Punta Gorda, North Port, Venice, Cape Coral, Fort Myers
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
        // Fetch raw mapping data natively (Node 18+ supports fetch)
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: OVERPASS_QUERY
        });

        if (!response.ok) throw new Error(`Overpass API rejected connection: ${response.status}`);
        
        const data = await response.json();
        const nodes = data.elements || [];
        
        console.log(`Radar sweep complete. Found ${nodes.length} potential retail locations in SWFL Grid.`);

        let parsedStores = [];

        // Map OSM data to our Supabase Schema
        nodes.forEach(node => {
            const name = node.tags?.name || node.tags?.brand;
            if (!name) return; // Skip unnamed gas stations/bodegas

            let storeType = 'Independent';
            const nameUpper = name.toUpperCase();
            if (nameUpper.includes('PUBLIX')) storeType = 'Supermarket';
            if (nameUpper.includes('CIRCLE K') || nameUpper.includes('WAWA') || nameUpper.includes('7-ELEVEN')) storeType = 'Chain Convenience';
            if (node.tags?.amenity === 'fuel') storeType = 'Gas Station';

            // Determine rough city based on latitude boundaries
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

        // Wipe existing data to prevent duplicates if run twice
        await supabase.from('swfl_retailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Push in batches of 500
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
