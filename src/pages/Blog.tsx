import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Tags, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from 'react-helmet-async';

// Generate blog schema for structured data
const blogSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "RHFS Blog",
  "description": "Expert insights and guides on buying repossessed properties in the UK",
  "publisher": {
    "@type": "Organization",
    "name": "RHFS - Repossessed Houses For Sale",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.repossessedhousesforsale.co.uk/logo.png"
    }
  }
};

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <Helmet>
        <title>Expert Insights on Repossessed Houses | RHFS Blog</title>
        <meta name="description" content="Discover comprehensive guides, market analysis, and expert advice on buying repossessed properties in the UK. Stay informed with our latest property insights." />
        <meta property="og:title" content="Expert Insights on Repossessed Houses | RHFS Blog" />
        <meta property="og:description" content="Discover comprehensive guides, market analysis, and expert advice on buying repossessed properties in the UK" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.repossessedhousesforsale.co.uk/blog" />
        <meta property="og:site_name" content="RHFS - Repossessed Houses For Sale" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Expert Insights on Repossessed Houses | RHFS Blog" />
        <meta name="twitter:description" content="Discover comprehensive guides, market analysis, and expert advice on buying repossessed properties in the UK" />
        <link rel="canonical" href="https://www.repossessedhousesforsale.co.uk/blog" />
        <script type="application/ld+json">
          {JSON.stringify(blogSchema)}
        </script>
      </Helmet>

      {/* Header */}
      <div className="bg-[#151923] py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <Link to="/">
            <Button 
              variant="ghost" 
              className="mb-6 md:mb-8 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              Expert Insights on Repossessed Houses
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4 md:px-0">
              Discover comprehensive guides, market analysis, and expert advice on buying repossessed properties in the UK
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts List */}
      <div className="container mx-auto py-8 md:py-16 px-4 md:px-8">
        {isLoading ? (
          <div className="space-y-6 md:space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#151923] rounded-lg p-4 md:p-8">
                <Skeleton className="h-8 w-3/4 mb-4 bg-gray-700" />
                <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                <Skeleton className="h-4 w-2/3 bg-gray-700" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8">
            {posts?.map((post) => (
              <article 
                key={post.id} 
                className="bg-[#151923] rounded-lg p-4 md:p-8 transition-transform hover:scale-[1.02]"
                itemScope 
                itemType="https://schema.org/BlogPosting"
              >
                <meta itemProp="datePublished" content={post.published_at} />
                <meta itemProp="author" content="RHFS" />
                <Link to={`/blog/${post.slug}`}>
                  <h2 
                    className="text-xl md:text-2xl font-bold mb-3 md:mb-4 hover:text-[#9b87f5] transition-colors"
                    itemProp="headline"
                  >
                    {post.title}
                  </h2>
                </Link>
                <p 
                  className="text-sm md:text-base text-gray-300 mb-4"
                  itemProp="description"
                >
                  {post.meta_description}
                </p>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <time itemProp="datePublished" dateTime={post.published_at}>
                      {format(new Date(post.published_at), 'MMM d, yyyy')}
                    </time>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tags className="w-4 h-4" />
                    {post.tags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="bg-[#9b87f5]/20 text-[#9b87f5] px-2 py-1 rounded text-xs"
                        itemProp="keywords"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 md:mt-6">
                  <Link to={`/blog/${post.slug}`}>
                    <Button className="w-full md:w-auto bg-[#9b87f5] hover:bg-[#9b87f5]/90">
                      Read More
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
