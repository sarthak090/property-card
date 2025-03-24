import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

// Add TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[];
    hj: Function;
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

// Lazy load components
const SearchBar = lazy(() => import("@/components/SearchBar").then(module => ({ default: module.SearchBar })));
const PropertyCard = lazy(() => import("@/components/PropertyCard").then(module => ({ default: module.PropertyCard })));

// Lazy load icons
const Icons = {
  BadgePoundSterling: lazy(() => import("lucide-react").then(module => ({ default: module.BadgePoundSterling }))),
  User: lazy(() => import("lucide-react").then(module => ({ default: module.User }))),
  PlusCircle: lazy(() => import("lucide-react").then(module => ({ default: module.PlusCircle }))),
  Clock: lazy(() => import("lucide-react").then(module => ({ default: module.Clock }))),
  BarChart3: lazy(() => import("lucide-react").then(module => ({ default: module.BarChart3 }))),
  FileText: lazy(() => import("lucide-react").then(module => ({ default: module.FileText }))),
  ArrowRight: lazy(() => import("lucide-react").then(module => ({ default: module.ArrowRight }))),
  RefreshCcw: lazy(() => import("lucide-react").then(module => ({ default: module.RefreshCcw }))),
  Heart: lazy(() => import("lucide-react").then(module => ({ default: module.Heart }))),
  Bell: lazy(() => import("lucide-react").then(module => ({ default: module.Bell }))),
  UserCircle: lazy(() => import("lucide-react").then(module => ({ default: module.UserCircle }))),
  LogOut: lazy(() => import("lucide-react").then(module => ({ default: module.LogOut })))
};

async function fetchLatestProperties() {
  console.log('Initiating property fetch...');
  
  try {
    const { data: allProperties, error } = await supabase
      .from('propertieslist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    // Calculate BMV percentage and filter for properties with BMV between 15-30% AND yield above 7%
    const filteredProperties = allProperties?.filter(property => {
      if (!property["Guide price"] || !property["Avg price"] || property["Guide price"] <= 0 || property["Avg price"] <= 0) {
        return false;
      }
      
      const bmvPercentage = ((property["Avg price"] - property["Guide price"]) / property["Avg price"]) * 100;
      const hasGoodYield = property["Est yield"] !== null && property["Est yield"] > 7;
      
      return bmvPercentage >= 15 && bmvPercentage <= 30 && hasGoodYield;
    }).slice(0, 4);

    console.log('Properties fetch successful, filtered count:', filteredProperties?.length);
    if (filteredProperties?.length > 0) {
      console.log('First filtered property:', filteredProperties[0]);
      console.log('BMV percentage of first property:', 
        ((filteredProperties[0]["Avg price"] - filteredProperties[0]["Guide price"]) / filteredProperties[0]["Avg price"]) * 100);
      console.log('Yield of first property:', filteredProperties[0]["Est yield"]);
    }
    
    return filteredProperties || [];
    
  } catch (error: any) {
    console.error('Failed to fetch properties:', error);
    throw error;
  }
}

async function fetchLocations() {
  try {
    const { data, error } = await supabase
      .from('propertieslist')
      .select('Town')
      .not('Town', 'is', null);
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    const uniqueTowns = Array.from(new Set(data.map(item => item.Town))).sort();
    return uniqueTowns;
  } catch (error: any) {
    console.error('Failed to fetch locations:', error);
    return []; // Return empty array instead of throwing to prevent UI breaking
  }
}

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Load third-party scripts
  useEffect(() => {
    // Load Google Tag Manager
    const loadGTM = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GTM-5WCMDDR5';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', 'GTM-5WCMDDR5');
    };

    // Load Hotjar
    const loadHotjar = () => {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.innerHTML = `
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:3812345,hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;r.defer=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `;
      document.head.appendChild(script);
    };

    // Load scripts after a delay to prioritize core content
    const timer = setTimeout(() => {
      loadGTM();
      loadHotjar();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name ||
                          session.user.user_metadata?.display_name;
        setUserDisplayName(displayName || session.user.email?.split('@')[0] || 'there');
        setUserEmail(session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const displayName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name ||
                          session.user.user_metadata?.display_name;
        setUserDisplayName(displayName || session.user.email?.split('@')[0] || 'there');
        setUserEmail(session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
  };

  const { data: properties, isLoading, error, refetch } = useQuery({
    queryKey: ['latest-properties'],
    queryFn: fetchLatestProperties,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
    meta: {
      errorMessage: 'Failed to load properties'
    }
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Database Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to the database. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleViewProperty = (propertyUrl: string, actualUrl: string | null) => {
    window.open(actualUrl || propertyUrl, '_blank');
  };

  const handleStartFreeTrial = async () => {
    if (!user) {
      navigate("/auth?signup=true");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] flex flex-col items-center justify-center p-4">
        <div className="text-white text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">
            {error instanceof Error ? error.message : 'Unable to connect to the database. Please check your internet connection.'}
          </p>
          <Button 
            onClick={() => refetch()}
            className="bg-[#9b87f5] hover:bg-[#9b87f5]/90 inline-flex items-center gap-2"
          >
            <Suspense fallback={<div className="w-4 h-4" />}>
              <Icons.RefreshCcw className="w-4 h-4" />
            </Suspense>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <Helmet>
        <title>RHFS - Find Repossessed Houses For Sale | Up to 30% Below Market Value</title>
        <meta name="description" content="Discover thousands of repossessed properties across the UK at 10-30% below market value. Access BMV properties, real-time alerts, and comprehensive property data." />
        <link rel="canonical" href="https://www.repossessedhousesforsale.co.uk" />
      </Helmet>

      <header className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/dd51hlrev/image/upload/fl_preserve_transparency/v1742820806/terrace-houses-picture-id523917343_eshjdz.jpg?_s=public-apps"
            alt="Traditional UK Terraced Houses"
            className="w-full h-full object-cover opacity-60"
            
            decoding="async"
            fetchPriority="high"
            width={612}
            height={408}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1F2C]/90 via-[#1A1F2C]/70 to-[#1A1F2C]" />
        </div>
        
        <nav className="relative container mx-auto py-4 px-4 md:py-6 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 md:justify-between">
            <div className="text-2xl font-bold">RHFS</div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/search" className="text-sm hover:text-[#9b87f5] transition-colors">Properties</a>
              <a href="/blog" className="text-sm hover:text-[#9b87f5] transition-colors">Blog</a>
              {user ? (
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 hover:text-[#9b87f5] transition-colors">
                        <span className="text-sm text-gray-300">Hello, {userDisplayName}</span>
                        <Suspense fallback={<div className="w-5 h-5" />}>
                          <Icons.UserCircle className="h-5 w-5" />
                        </Suspense>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-[#1A1F2C] border border-gray-700 text-white">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-medium">Profile</h3>
                          <div className="text-sm text-gray-300">{userEmail}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => navigate("/profile")}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs justify-start"
                          >
                            <Suspense fallback={<div className="w-4 h-4 mr-2" />}>
                              <Icons.UserCircle className="w-4 h-4 mr-2" />
                            </Suspense>
                            More Details
                          </Button>
                          
                          <Button 
                            onClick={handleLogout}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs justify-start"
                          >
                            <Suspense fallback={<div className="w-4 h-4 mr-2" />}>
                              <Icons.LogOut className="w-4 h-4 mr-2" />
                            </Suspense>
                            Log Out
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => navigate("/auth")}
                    className="text-sm bg-[#9b87f5] hover:bg-[#9b87f5]/90"
                  >
                    Log In
                  </Button>
                  <Button 
                    onClick={() => navigate("/auth?signup=true")}
                    className="text-sm bg-[#9b87f5] hover:bg-[#9b87f5]/90 md:hidden"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="relative container mx-auto px-4 md:px-6 pt-4 md:pt-20">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 animate-fade-in leading-tight">
              Repossessed Houses For Sale
            </h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 text-gray-300 animate-fade-in leading-relaxed px-2">
              Access thousands of repossessed and below market value (BMV) properties from across the UK
            </p>
            
            {!user && (
              <Button 
                onClick={handleStartFreeTrial}
                className="w-full md:w-auto mb-6 bg-[#D6384E] hover:bg-[#D6384E]/90 text-white font-semibold py-3 px-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up"
              >
                Try Free For 48 Hours
              </Button>
            )}

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg animate-fade-up">
              <SearchBar 
                onSearch={handleSearch}
                className="max-w-lg mx-auto"
              />
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-gray-400">
                <span>Popular searches:</span>
                {["Liverpool", "London", "Birmingham"].map((location) => (
                  <Button
                    key={location}
                    variant="ghost"
                    className="text-[#9b87f5] hover:text-[#9b87f5]/90 p-1 h-auto"
                    onClick={() => handleSearch(location)}
                  >
                    {location}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20 bg-[#1A1F2C]">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12 text-center">Latest Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {isLoading ? (
              <div className="col-span-1 md:col-span-4 text-center py-8 md:py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-48 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="mt-4 text-gray-400">Loading properties...</p>
              </div>
            ) : properties && properties.length > 0 ? (
              <Suspense fallback={<div>Loading...</div>}>
                {properties.map((property, index) => (
                  <PropertyCard
                    key={`${property.Type}-${index}`}
                    id={property.Type}
                    title={`${property.Type} - ${property.Bedrooms} Bedroom${property.Bedrooms > 1 ? 's' : ''}`}
                    price={property["Guide price"] || 0}
                    location={property.Town || "Location not specified"}
                    bedrooms={property.Bedrooms || undefined}
                    imageUrl={property.imageurl || ""}
                    isBlurred={!property.imageurl}
                    avgPrice={property["Avg price"] || undefined}
                    offerReceived={property["Offer rec'd"] || undefined}
                    estYield={property["Est yield"] || undefined}
                    propertyType={property.Type || undefined}
                    isSubscribed={false}
                    onViewProperty={() => handleViewProperty(property.URL, property.actualurl)}
                    onStartFreeTrial={handleStartFreeTrial}
                  />
                ))}
              </Suspense>
            ) : (
              <div className="col-span-1 md:col-span-4 text-center py-8 md:py-12">
                <p className="text-gray-400 mb-4">No properties found</p>
                <Button 
                  onClick={() => refetch()}
                  className="bg-[#9b87f5] hover:bg-[#9b87f5]/90 inline-flex items-center gap-2"
                >
                  <Suspense fallback={<div className="w-4 h-4" />}>
                    <Icons.RefreshCcw className="w-4 h-4" />
                  </Suspense>
                  Retry Loading Properties
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-[#151923]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Access Thousands of repossessed properties up to 30% BELOW MARKET VALUE</h2>
          <div className="max-w-md mx-auto bg-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-white/10 shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="text-[#9b87f5] font-medium mb-2">48-hour Free Trial, then</div>
                <div className="flex items-baseline">
                  <span className="text-4xl md:text-5xl font-bold">£8.80</span>
                  <span className="text-gray-400 ml-2">per month</span>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-xl font-semibold mb-4">Premium Plan</h3>
                <ul className="space-y-4 text-left">
                  <li className="flex items-center">
                    <div className="w-8 h-8 bg-[#9b87f5]/20 rounded-full flex items-center justify-center mr-3">
                      <Suspense fallback={<div className="w-4 h-4" />}>
                        <Icons.BadgePoundSterling className="w-4 h-4 text-[#9b87f5]" />
                      </Suspense>
                    </div>
                    <span>Access to all BMV properties</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-8 h-8 bg-[#9b87f5]/20 rounded-full flex items-center justify-center mr-3">
                      <Suspense fallback={<div className="w-4 h-4" />}>
                        <Icons.Clock className="w-4 h-4 text-[#9b87f5]" />
                      </Suspense>
                    </div>
                    <span>Monthly rolling - no long-term commitment</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-8 h-8 bg-[#9b87f5]/20 rounded-full flex items-center justify-center mr-3">
                      <Suspense fallback={<div className="w-4 h-4" />}>
                        <Icons.Heart className="w-4 h-4 text-[#9b87f5]" />
                      </Suspense>
                    </div>
                    <span>Flexibility to cancel anytime</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-8 h-8 bg-[#9b87f5]/20 rounded-full flex items-center justify-center mr-3">
                      <Suspense fallback={<div className="w-4 h-4" />}>
                        <Icons.Bell className="w-4 h-4 text-[#9b87f5]" />
                      </Suspense>
                    </div>
                    <span>Real-time property alerts</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleStartFreeTrial}
                className="w-full bg-[#9b87f5] hover:bg-[#9b87f5]/90 text-base md:text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {user ? "Start Free Trial" : "Create Account"}
                <Suspense fallback={<div className="w-5 h-5 ml-2" />}>
                  <Icons.ArrowRight className="w-5 h-5 ml-2" />
                </Suspense>
              </Button>

              <p className="text-sm text-gray-400">
                Cancel anytime • No credit card required for trial
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-[#1A1F2C]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 md:mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.BadgePoundSterling className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">10-30% Below Market Value</h3>
              <p className="text-gray-400">Repossessions offer some of the best discounts on the market</p>
            </div>
            
            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.User className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">User Friendly</h3>
              <p className="text-gray-400">Considerable time, cost and stress savings</p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.PlusCircle className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">New Properties Everyday</h3>
              <p className="text-gray-400">New repossessed properties added everyday</p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.Clock className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Realtime Search</h3>
              <p className="text-gray-400">Our platform is updated every day to give you the latest market and property data</p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.BarChart3 className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Investment Opportunity</h3>
              <p className="text-gray-400">Other exclusive investment opportunities from our valued partners</p>
            </div>

            <div className="p-6 rounded-lg">
              <div className="w-12 h-12 bg-[#9b87f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Suspense fallback={<div className="w-6 h-6" />}>
                  <Icons.FileText className="w-6 h-6 text-white" />
                </Suspense>
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Property Valuation Guide</h3>
              <p className="text-gray-400">Helping you to keep you one step ahead in a competitive market</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-[#1A1F2C]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Start Your Free Trial Today</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8">
            Discover over 2000+ properties already available on our platform
          </p>
          <Button 
            onClick={handleStartFreeTrial}
            className="bg-[#D6384E] hover:bg-[#D6384E]/90 text-white text-base md:text-lg px-6 md:px-8 py-4 md:py-6"
          >
            Get Started
          </Button>
        </div>
      </section>

      <footer className="bg-[#151923] py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div>
            <h3 className="font-bold mb-4">Coverage</h3>
            <p className="text-gray-400">
              Our service covers the entire United Kingdom, providing access to repossessed properties nationwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
