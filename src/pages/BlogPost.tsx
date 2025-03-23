import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async';

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] text-white py-8 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <Skeleton className="h-8 md:h-12 w-3/4 mb-6 md:mb-8 bg-gray-700" />
          <Skeleton className="h-4 md:h-6 w-1/4 mb-8 md:mb-12 bg-gray-700" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-4 w-3/4 bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] text-white py-8 md:py-16">
        <div className="container mx-auto text-center px-4 md:px-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/blog">
            <Button className="bg-[#9b87f5] hover:bg-[#9b87f5]/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract first paragraph for meta description
  const firstParagraph = post.content.split('\n\n')[0].replace(/[#*`]/g, '').slice(0, 160);
  
  // Format date for schema
  const publishDate = new Date(post.published_at).toISOString();

  // Prepare schema markup
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": firstParagraph,
    "author": {
      "@type": "Organization",
      "name": "RHFS"
    },
    "publisher": {
      "@type": "Organization",
      "name": "RHFS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.repossessedhousesforsale.co.uk/logo.png"
      }
    },
    "datePublished": publishDate,
    "dateModified": publishDate,
    "keywords": post.tags.join(", "),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.repossessedhousesforsale.co.uk/blog/${post.slug}`
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${post.title} | RHFS Blog`}</title>
        <meta name="description" content={firstParagraph} />
        <meta name="author" content="RHFS" />
        <meta name="keywords" content={post.tags.join(", ")} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={firstParagraph} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.repossessedhousesforsale.co.uk/blog/${post.slug}`} />
        <meta property="article:published_time" content={publishDate} />
        <meta property="article:tag" content={post.tags.join(", ")} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={firstParagraph} />
        
        {/* Schema.org markup */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>

        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.repossessedhousesforsale.co.uk/blog/${post.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-[#1A1F2C] text-white">
        <main>
          <article className="container mx-auto py-8 md:py-16 px-4 md:px-8" itemScope itemType="https://schema.org/BlogPosting">
            <nav aria-label="Blog navigation" className="mb-6 md:mb-8">
              <Link to="/blog">
                <Button 
                  variant="ghost" 
                  className="text-gray-400 hover:text-white"
                  aria-label="Back to blog posts"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
            </nav>

            <header className="mb-8 md:mb-12">
              <h1 
                className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6"
                itemProp="headline"
              >
                {post.title}
              </h1>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-sm text-gray-400">
                <time 
                  dateTime={publishDate}
                  itemProp="datePublished"
                  className="flex items-center gap-1"
                >
                  <CalendarDays className="w-4 h-4" />
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </time>
                <div className="flex flex-wrap items-center gap-2">
                  <Tags className="w-4 h-4" />
                  {post.tags.map((tag) => (
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
            </header>

            <div 
              className="prose prose-invert prose-sm md:prose-base max-w-none"
              itemProp="articleBody"
            >
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>
        </main>
      </div>
    </>
  );
};

export default BlogPost;
