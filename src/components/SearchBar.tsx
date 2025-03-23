
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
  defaultValue?: string;
}

export function SearchBar({ onSearch, className, defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full animate-fade-up ${className || ''}`}
    >
      <div className="relative flex">
        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2">
          <MapPin className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by address, city or postcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 md:pl-12 pr-24 md:pr-32 py-4 md:py-6 bg-white/10 border-white/20 text-sm md:text-base text-white placeholder:text-gray-400 focus-visible:ring-[#9b87f5]"
        />
        <Button 
          type="submit" 
          className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-[#D6384E] hover:bg-[#D6384E]/90 text-sm md:text-base py-1.5 md:py-2"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
}
