
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";

declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params?: {
        send_to?: string;
        transaction_id?: string;
        value?: number;
        currency?: string;
        [key: string]: any;
      }
    ) => void;
  }
}

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?redirectTo=/thank-you");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Google Conversion Tracking
    if (window.gtag) {
      // Fire the conversion event
      window.gtag('event', 'conversion', {
        'send_to': 'AW-10995658381/VMumCLqAvKQaEI3dkfso',
        'value': 8.8,
        'currency': 'GBP'
      });
      
      console.log('Google conversion tracking fired');
    } else {
      console.warn('Google Tag Manager not found on page');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1F2C] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-[#151923] rounded-lg shadow-lg text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Thank You for Subscribing!
        </h1>
        <p className="text-gray-300 mb-8">
          Your subscription has been successfully activated. You now have full access to all our premium features.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white transition-colors"
        >
          Continue to Homepage
        </Button>
      </div>
    </div>
  );
}
