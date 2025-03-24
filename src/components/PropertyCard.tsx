import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Bed, Bath, Square, ArrowRight, Percent, Check, LineChart, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: string;
  imageUrl: string;
  isBlurred?: boolean;
  onViewProperty: () => void;
  avgPrice?: number;
  offerReceived?: number;
  estYield?: number;
  propertyType?: string;
  isSubscribed?: boolean;
  onStartFreeTrial: () => void;
}

export function PropertyCard({
  title,
  price,
  location,
  bedrooms,
  bathrooms,
  size,
  imageUrl,
  onViewProperty,
  avgPrice,
  offerReceived,
  estYield,
  propertyType,
  isSubscribed = false,
  onStartFreeTrial,
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const bmvPercentage = avgPrice ? ((avgPrice - price) / avgPrice * 100).toFixed(1) : null;

  const handleClick = () => {
    if (isSubscribed) {
      onViewProperty();
    } else {
      setShowSubscriptionModal(true);
    }
  };

  return (
    <>
      <Card
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <CardHeader className="p-0">
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={imageUrl}
              alt={`${title} - Property in ${location}`}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
              width={800}
              height={450}
              srcSet={`${imageUrl} 400w,
                      ${imageUrl} 800w,
                      ${imageUrl} 1200w`}
              sizes="(max-width: 768px) 100vw,
                     (max-width: 1200px) 50vw,
                     33vw"
            />
            {bmvPercentage && (
              <Badge
                className="absolute top-4 left-4 bg-premium/90 text-white"
                variant="secondary"
              >
                {bmvPercentage}% BMV
              </Badge>
            )}
            {propertyType && (
              <Badge
                className="absolute top-4 right-4 bg-black/70 text-white"
                variant="secondary"
              >
                {propertyType}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{location}</span>
          </div>
          <h3 className="text-lg md:text-xl font-semibold mb-2 line-clamp-2 min-h-[3.5rem]">{title}</h3>
          <p className="text-xl md:text-2xl font-bold text-premium mb-4">
            £{price.toLocaleString()}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {offerReceived && (
              <div className="flex items-center gap-1 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="truncate">Offer: £{offerReceived.toLocaleString()}</span>
              </div>
            )}
            {estYield && (
              <div className="flex items-center gap-1 text-sm">
                <LineChart className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Yield: {estYield}%</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 flex-shrink-0" />
                <span>{bedrooms} beds</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 flex-shrink-0" />
                <span>{bathrooms} baths</span>
              </div>
            )}
            {size && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 flex-shrink-0" />
                <span>{size}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 md:p-6 pt-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            View Property
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>

      {/* Subscription Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="bg-[#1A1F2C] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">View Full Property Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Start your 2-day free trial to view property details and access all features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 my-4">
            <div className="flex items-start gap-2">
              <Home className="h-5 w-5 text-[#9b87f5] mt-0.5" />
              <div>
                <p className="font-medium">Property Details</p>
                <p className="text-sm text-gray-400">Access full information about this property</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-5 w-5 text-[#9b87f5] mt-0.5" />
              <div>
                <p className="font-medium">Premium Features</p>
                <p className="text-sm text-gray-400">Unlock all properties and advanced filtering</p>
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
              onClick={() => {
                setShowSubscriptionModal(false);
                onStartFreeTrial();
              }}
              className="bg-[#9b87f5] hover:bg-[#9b87f5]/90"
            >
              Start Free Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
