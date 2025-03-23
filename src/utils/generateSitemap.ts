import { supabase } from "@/integrations/supabase/client";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function generateSitemap(): Promise<string> {
  const baseUrl = 'https://www.repossessedhousesforsale.co.uk';
  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/search`,
      changefreq: 'hourly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/blog`,
      changefreq: 'weekly',
      priority: 0.8
    }
  ];

  // Add dynamic property pages
  try {
    const { data: properties } = await supabase
      .from('propertieslist')
      .select('Town, created_at')
      .not('Town', 'is', null);

    if (properties) {
      const propertyUrls = properties.map(property => ({
        loc: `${baseUrl}/search?location=${encodeURIComponent(property.Town)}`,
        lastmod: property.created_at,
        changefreq: 'daily' as const,
        priority: 0.7
      }));
      urls.push(...propertyUrls);
    }
  } catch (error) {
    console.error('Error fetching properties for sitemap:', error);
  }

  // Add blog posts
  try {
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .order('published_at', { ascending: false });

    if (blogPosts) {
      const blogUrls = blogPosts.map(post => ({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.published_at,
        changefreq: 'monthly' as const,
        priority: 0.7
      }));
      urls.push(...blogUrls);
    }
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')}
</urlset>`;

  return sitemap;
} 