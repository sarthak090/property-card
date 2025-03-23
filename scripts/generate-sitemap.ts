import { generateSitemap } from '../src/utils/generateSitemap';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const sitemap = await generateSitemap();
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    fs.writeFileSync(sitemapPath, sitemap);
    console.log('Sitemap generated successfully at:', sitemapPath);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

main(); 