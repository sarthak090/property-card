import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Browser-like headers to avoid being blocked
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
}

let isShuttingDown = false;
let processedCount = 0;
const batchSize = 10;

async function processBatch(supabaseClient: any, properties: any[], startIndex: number) {
  const batch = properties.slice(startIndex, startIndex + batchSize);
  const results = {
    updated: [] as any[],
    errors: [] as any[],
  };

  console.log(`[${new Date().toISOString()}] Starting batch processing from index ${startIndex}, batch size: ${batch.length}`);

  for (const property of batch) {
    if (isShuttingDown) {
      console.log('Shutdown signal received, stopping batch processing');
      break;
    }

    try {
      const listingUrl = getFormattedPropertyUrl(property.URL);
      
      if (!listingUrl) {
        console.log(`[${new Date().toISOString()}] Skipping property ${property.Address} - No valid listing URL provided`);
        continue;
      }

      console.log(`[${new Date().toISOString()}] Processing property: ${property.Address}`);
      console.log(`[${new Date().toISOString()}] Fetching URL: ${listingUrl}`);
      
      const response = await fetch(listingUrl, {
        headers: browserHeaders
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`[${new Date().toISOString()}] Fetched HTML content length: ${html.length}`);

      let images: string[] = [];

      // Extract images based on the source
      if (listingUrl.toLowerCase().includes('zoopla')) {
        // Try multiple patterns for Zoopla
        const patterns = [
          /content="(https:\/\/lid\.zoocdn\.com\/[^"]+)"/g,
          /<img[^>]*src="(https:\/\/lid\.zoocdn\.com\/[^"]+)"[^>]*>/g,
          /"image":\s*"(https:\/\/lid\.zoocdn\.com\/[^"]+)"/g
        ];
        
        for (const pattern of patterns) {
          const matches = Array.from(html.matchAll(pattern));
          matches.forEach(match => {
            const url = match[1];
            if (url && url.startsWith('http')) {
              images.push(url);
            }
          });
        }
        
      } else if (listingUrl.toLowerCase().includes('rightmove')) {
        // Try multiple patterns for Rightmove
        const patterns = [
          /https:\/\/media\.rightmove\.co\.uk\/[^\s'"]*\.(?:jpg|jpeg|png|webp)[^\s'""]*/g,
          /<img[^>]*src="(https:\/\/media\.rightmove\.co\.uk\/[^"]+)"[^>]*>/g,
          /"image":\s*"(https:\/\/media\.rightmove\.co\.uk\/[^"]+)"/g
        ];
        
        for (const pattern of patterns) {
          const matches = Array.from(html.matchAll(pattern));
          matches.forEach(match => {
            const url = match[1] || match[0];
            if (url && url.startsWith('http')) {
              images.push(url);
            }
          });
        }
        
      } else if (listingUrl.toLowerCase().includes('onthemarket') || listingUrl.toLowerCase().includes('otm')) {
        // Try multiple patterns for OnTheMarket
        const patterns = [
          /data-gallery-image="([^"]+)"/g,
          /<img[^>]*src="(https:\/\/[^"]*\.(?:jpg|jpeg|png|webp))"[^>]*>/g,
          /"image":\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/g
        ];
        
        for (const pattern of patterns) {
          const matches = Array.from(html.matchAll(pattern));
          matches.forEach(match => {
            const url = match[1];
            if (url && url.startsWith('http') && (url.includes('onthemarket') || url.includes('otm.co.uk'))) {
              images.push(url);
            }
          });
        }
      }

      // Remove duplicates and invalid URLs
      images = [...new Set(images)].filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

      console.log(`[${new Date().toISOString()}] Found ${images.length} images for property ${property.Address}:`, images);

      if (images.length === 0) {
        console.log(`[${new Date().toISOString()}] No images found for property: ${property.Address}`);
        results.errors.push({ address: property.Address, error: 'No images found in HTML content' });
        continue;
      }

      // Get the main image (first one) or fallback to existing
      const mainImage = images[0] || property.image_url || null;

      // Update the property
      const { data, error: updateError } = await supabaseClient
        .from('propertiesadd')
        .update({
          listing_images: images,
          listing_main_image: mainImage,
        })
        .eq('Address', property.Address)
        .select();

      if (updateError) {
        console.error(`[${new Date().toISOString()}] Database update error:`, updateError);
        throw updateError;
      }

      console.log(`[${new Date().toISOString()}] Database update response:`, JSON.stringify(data));

      results.updated.push({
        address: property.Address,
        imagesCount: images.length,
        mainImage: mainImage
      });
      
      processedCount++;

      // Add a delay between property processing to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing property ${property.Address}:`, error);
      results.errors.push({ address: property.Address, error: error.message });
    }
  }

  return results;
}

// Function to format property URLs correctly
function getFormattedPropertyUrl(url: string) {
  if (!url) return null;
  
  // Extract the ID from the end of the URL
  const id = url.split('/').pop() || '';
  
  if (url.toLowerCase().includes('zoopla')) {
    return `https://www.zoopla.co.uk/for-sale/details/${id}/`;
  } else if (url.toLowerCase().includes('rightmove')) {
    return `https://www.rightmove.co.uk/properties/${id}`;
  } else if (url.toLowerCase().includes('otm') || url.toLowerCase().includes('onthemarket')) {
    return `https://www.onthemarket.com/details/${id}/`;
  }
  
  return url;
}

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS request`);
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`[${new Date().toISOString()}] Invalid method: ${req.method}`);
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log(`[${new Date().toISOString()}] Checking environment variables`);
    if (!Deno.env.get('SUPABASE_URL') || !Deno.env.get('SUPABASE_ANON_KEY')) {
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get all properties
    console.log(`[${new Date().toISOString()}] Fetching properties from database`);
    const { data: properties, error: fetchError } = await supabaseClient
      .from('propertiesadd')
      .select('*');

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] Error fetching properties:`, fetchError);
      throw fetchError;
    }

    const totalProperties = properties?.length || 0;
    console.log(`[${new Date().toISOString()}] Found ${totalProperties} properties to process`);

    const allResults = {
      totalProperties,
      processedCount: 0,
      updated: [] as any[],
      errors: [] as any[],
    };

    // Process properties in batches
    for (let i = 0; i < totalProperties; i += batchSize) {
      if (isShuttingDown) {
        console.log(`[${new Date().toISOString()}] Shutdown signal received, stopping further processing`);
        break;
      }

      console.log(`[${new Date().toISOString()}] Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalProperties / batchSize)}`);
      const batchResults = await processBatch(supabaseClient, properties || [], i);
      
      allResults.updated.push(...batchResults.updated);
      allResults.errors.push(...batchResults.errors);
      allResults.processedCount = processedCount;

      console.log(`[${new Date().toISOString()}] Batch ${Math.floor(i / batchSize) + 1} completed. Progress: ${processedCount}/${totalProperties}`);
    }

    console.log(`[${new Date().toISOString()}] Image extraction process completed successfully`);
    
    return new Response(
      JSON.stringify({
        message: 'Image extraction completed',
        ...allResults
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process property images'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
});
