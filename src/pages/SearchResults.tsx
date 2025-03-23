import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function fetchProperties(searchQuery = '') {
  console.log('Fetching properties with search query:', searchQuery);
  try {
    let query = supabase
      .from('propertieslist')
      .select('*');
    
    if (searchQuery && searchQuery.trim()) {
      const sanitizedQuery = searchQuery.trim().toLowerCase();
      query = query.or(
        `Town.ilike.%${sanitizedQuery}%,` +
        `Address.ilike.%${sanitizedQuery}%,` +
        `Postcode.ilike.%${sanitizedQuery}%`
      );
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error fetching properties:', error);
      throw error;
    }
    
    console.log('Fetched properties:', data);
    return data || [];
  } catch (error) {
    console.error('Error in fetchProperties:', error);
    throw error;
  }
}

async function checkSubscriptionStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription:', error);
      return null;
    }

    console.log('Subscription status:', data);
    return data;
  } catch (error) {
    console.error('Error in checkSubscriptionStatus:', error);
    return null;
  }
}

export default function SearchResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const [propertyType, setPropertyType] = useState<string>('all');
  const [minYield, setMinYield] = useState<number>(0);
  const [minBMV, setMinBMV] = useState<number>(0);
  const [bedrooms, setBedrooms] = useState<string>('any');
  const [sortBy, setSortBy] = useState<string>('default');
  const [filtersEnabled, setFiltersEnabled] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const { data: properties, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['properties', searchQuery],
    queryFn: () => fetchProperties(searchQuery),
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session:', session?.user ? 'Logged in' : 'Not logged in');
      setUser(session?.user ?? null);
      if (session?.user) {
        const subData = await checkSubscriptionStatus(session.user.id);
        setSubscription(subData);
        setFiltersEnabled(subData?.status === 'active' || subData?.status === 'trialing');
      }
    };

    initializeAuth();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', session?.user ? 'Logged in' : 'Not logged in');
      setUser(session?.user ?? null);
      if (session?.user) {
        const subData = await checkSubscriptionStatus(session.user.id);
        setSubscription(subData);
        setFiltersEnabled(subData?.status === 'active' || subData?.status === 'trialing');
      } else {
        setSubscription(null);
        setFiltersEnabled(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const handleStartFreeTrial = async () => {
    if (!user) {
      navigate("/auth?signup=true");
      setShowSubscriptionModal(false);
      return;
    }

    setIsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { userId: user.id },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error(data?.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Free trial error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to start free trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowSubscriptionModal(false);
    }
  };

  const handleViewProperty = (propertyUrl: string, actualUrl: string | null) => {
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      window.open(actualUrl || propertyUrl, '_blank');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleFilterChange = (type: string, value: any) => {
    if (!filtersEnabled) {
      setShowSubscriptionModal(true);
      return;
    }

    switch (type) {
      case 'propertyType':
        setPropertyType(value);
        break;
      case 'bedrooms':
        setBedrooms(value);
        break;
      case 'minYield':
        setMinYield(value);
        break;
      case 'minBMV':
        setMinBMV(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      default:
        break;
    }
  };

  const sortProperties = (properties: any[]) => {
    if (!properties) return [];
    
    switch (sortBy) {
      case 'price-asc':
        return [...properties].sort((a, b) => (a["Guide price"] || 0) - (b["Guide price"] || 0));
      case 'price-desc':
        return [...properties].sort((a, b) => (b["Guide price"] || 0) - (a["Guide price"] || 0));
      case 'yield-desc':
        return [...properties].sort((a, b) => (b["Est yield"] || 0) - (a["Est yield"] || 0));
      case 'bmv-desc':
        return [...properties].sort((a, b) => {
          const bmvA = a["Avg price"] && a["Guide price"] 
            ? ((a["Avg price"] - a["Guide price"]) / a["Avg price"] * 100)
            : 0;
          const bmvB = b["Avg price"] && b["Guide price"]
            ? ((b["Avg price"] - b["Guide price"]) / b["Avg price"] * 100)
            : 0;
          return bmvB - bmvA;
        });
      default:
        return properties;
    }
  };

  const filteredProperties = filtersEnabled 
    ? properties?.filter(property => {
        const matchesType = propertyType === 'all' || property.Type === propertyType;
        const matchesYield = !minYield || (property["Est yield"] && property["Est yield"] >= minYield);
        const matchesBedrooms = bedrooms === 'any' || property.Bedrooms === parseInt(bedrooms);
        
        const bmvPercentage = property["Avg price"] && property["Guide price"] 
          ? ((property["Avg price"] - property["Guide price"]) / property["Avg price"] * 100)
          : 0;
        const matchesBMV = !minBMV || bmvPercentage >= minBMV;

        return matchesType && matchesYield && matchesBedrooms && matchesBMV;
      })
    : properties;

  const sortedAndFilteredProperties = sortProperties(filteredProperties || []);

  const renderProperties = () => {
    if (!sortedAndFilteredProperties) return null;
    
    const hasActiveSubscription = subscription?.status === 'active' || 
                                subscription?.status === 'trialing';
    
    const visibleProperties = hasActiveSubscription 
      ? sortedAndFilteredProperties 
      : sortedAndFilteredProperties.slice(0, 3);
    
    return (
      <>
        {visibleProperties.map((property, index) => (
          <div key={`${property.Address}-${index}`} className="col-span-1">
            <PropertyCard
              id={property.Address}
              title={property.Address}
              price={property["Guide price"] || 0}
              location={property.Town || "Location not specified"}
              bedrooms={property.Bedrooms || undefined}
              imageUrl={property.imageurl || ""}
              avgPrice={property["Avg price"] || undefined}
              offerReceived={property["Offer rec'd"] || undefined}
              estYield={property["Est yield"] || undefined}
              propertyType={property.Type || undefined}
              onViewProperty={() => handleViewProperty(property.URL, property.actualurl)}
              isSubscribed={hasActiveSubscription}
              onStartFreeTrial={handleStartFreeTrial}
            />
          </div>
        ))}
        {!hasActiveSubscription && sortedAndFilteredProperties.length > 3 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-[#9b87f5]" />
              <h3 className="text-xl font-semibold mb-2">
                Unlock All Properties
              </h3>
              <p className="text-gray-400 mb-6">
                Start your 2-day free trial to view all properties and get access to premium features.
              </p>
              <Button 
                onClick={handleStartFreeTrial}
                className="bg-[#9b87f5] hover:bg-[#9b87f5]/90"
                disabled={isLoading}
              >
                {isLoading ? "Starting trial..." : "Start Free Trial"}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <Toaster />
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Search Results</h1>
        </div>
        <div className="mb-8">
          <SearchBar 
            defaultValue={searchQuery}
            onSearch={(query) => {
              navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
            }} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 bg-white/5 p-6 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="property-type">Property Type</Label>
            <Select 
              value={propertyType} 
              onValueChange={(value) => handleFilterChange('propertyType', value)}
              disabled={!filtersEnabled}
            >
              <SelectTrigger className={`w-full ${!filtersEnabled ? 'bg-white/5 opacity-70' : 'bg-white/10'}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(new Set(properties?.map(p => p.Type).filter(Boolean) || [])).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Select 
              value={bedrooms} 
              onValueChange={(value) => handleFilterChange('bedrooms', value)}
              disabled={!filtersEnabled}
            >
              <SelectTrigger className={`w-full ${!filtersEnabled ? 'bg-white/5 opacity-70' : 'bg-white/10'}`}>
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="any">Any</SelectItem>
                  {Array.from(new Set(properties?.map(p => p.Bedrooms).filter(Boolean) || [])).sort((a, b) => a - b).map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num} beds</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum Yield: {minYield}%</Label>
            <Slider
              value={[minYield]}
              onValueChange={(value) => handleFilterChange('minYield', value[0])}
              max={20}
              step={0.5}
              className={`py-4 ${!filtersEnabled ? 'opacity-50' : ''}`}
              disabled={!filtersEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Minimum BMV: {minBMV}%</Label>
            <Slider
              value={[minBMV]}
              onValueChange={(value) => handleFilterChange('minBMV', value[0])}
              max={50}
              step={1}
              className={`py-4 ${!filtersEnabled ? 'opacity-50' : ''}`}
              disabled={!filtersEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-by">Sort By</Label>
            <Select 
              value={sortBy} 
              onValueChange={(value) => handleFilterChange('sortBy', value)}
              disabled={!filtersEnabled}
            >
              <SelectTrigger className={`w-full ${!filtersEnabled ? 'bg-white/5 opacity-70' : 'bg-white/10'}`}>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="yield-desc">Highest Yield</SelectItem>
                  <SelectItem value="bmv-desc">Best BMV</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!filtersEnabled && (
          <div className="mb-8 p-4 bg-[#9b87f5]/10 border border-[#9b87f5]/30 rounded-lg text-center">
            <p className="text-white mb-2">
              <Lock className="h-4 w-4 inline-block mr-1 align-text-bottom" />
              Premium filters are only available for subscribers
            </p>
            <Button 
              variant="outline" 
              className="text-[#9b87f5] border-[#9b87f5] hover:bg-[#9b87f5]/10"
              onClick={() => setShowSubscriptionModal(true)}
              size="sm"
            >
              Start Free Trial to Unlock
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {queryLoading ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">Loading properties...</div>
          ) : queryError ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-red-500">
              Error loading properties: {(queryError as Error).message}
            </div>
          ) : sortedAndFilteredProperties && sortedAndFilteredProperties.length > 0 ? (
            renderProperties()
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-400">
              No properties found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="bg-[#1A1F2C] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Unlock Premium Filters</DialogTitle>
            <DialogDescription className="text-gray-400">
              Start your 2-day free trial to access premium filters and see all properties.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 my-4">
            <div className="flex items-start gap-2">
              <Filter className="h-5 w-5 text-[#9b87f5] mt-0.5" />
              <div>
                <p className="font-medium">Advanced Filtering</p>
                <p className="text-sm text-gray-400">Filter by property type, bedrooms, yield, and BMV</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-5 w-5 text-[#9b87f5] mt-0.5" />
              <div>
                <p className="font-medium">View All Properties</p>
                <p className="text-sm text-gray-400">Access our full database of repossessed properties</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSubscriptionModal(false)}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={handleStartFreeTrial}
              className="bg-[#9b87f5] hover:bg-[#9b87f5]/90"
              disabled={isLoading}
            >
              {isLoading ? "Starting trial..." : "Start Free Trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
