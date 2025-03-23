import { useEffect } from 'react';
import { generateSitemap } from '@/utils/generateSitemap';

const Sitemap = () => {
  useEffect(() => {
    const serveSitemap = async () => {
      try {
        const sitemap = await generateSitemap();
        const blob = new Blob([sitemap], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        window.location.href = url;
      } catch (error) {
        console.error('Error generating sitemap:', error);
      }
    };

    serveSitemap();
  }, []);

  return null;
};

export default Sitemap; 