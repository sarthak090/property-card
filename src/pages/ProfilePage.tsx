
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Mail, Calendar, Package, BadgePoundSterling, XOctagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Define a custom interface that extends Database types with the missing property
interface SubscriptionUpdate {
  cancel_at_period_end: boolean;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isSubscriptionCancelDialogOpen, setIsSubscriptionCancelDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      const displayName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name ||
                        session.user.user_metadata?.display_name;
      setUserDisplayName(displayName || session.user.email?.split('@')[0] || 'there');
      setUserEmail(session.user.email || '');
      
      try {
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching subscription:', error);
          throw error;
        }
        
        setSubscription(subscriptionData || null);
        console.log("Subscription data:", subscriptionData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription details. Please try again.",
          variant: "destructive",
        });
      }
      
      setLoading(false);
    };
    
    fetchUserAndSubscription();
  }, [navigate, toast]);

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      
      setIsSubscriptionCancelDialogOpen(false);
      
      if (!user || !user.id) {
        throw new Error("User not found");
      }
      
      console.log("Cancelling subscription for user:", user.id);
      
      try {
        const { data, error } = await supabase.functions.invoke('cancel-subscription', {
          body: { userId: user.id }
        });
        
        if (error) {
          console.error('Error calling cancel-subscription function:', error);
          throw new Error(`Failed to contact the server. Please try again.`);
        }
        
        console.log("Subscription cancellation response:", data);
        
        if (data && data.columnMissing) {
          toast({
            title: "Database Update Required",
            description: "The subscription cancellation feature requires a database update. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        if (!data || !data.success) {
          throw new Error(data?.message || "Failed to cancel subscription");
        }
      } catch (invokeError) {
        console.error('Error invoking function:', invokeError);
        
        // Create a properly typed update object with the missing property
        const updateData: SubscriptionUpdate = { cancel_at_period_end: true };
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(updateData as unknown as Record<string, unknown>)
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error with fallback update:', updateError);
          throw new Error("Failed to cancel subscription after multiple attempts");
        }
      }
      
      const { data: updatedSubscription, error: refreshError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (refreshError) {
        console.error('Error refreshing subscription data:', refreshError);
      } else {
        console.log("Updated subscription data:", updatedSubscription);
        setSubscription(updatedSubscription || null);
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled. You'll still have access until the end of your current billing period.",
      });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel your subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const canCancelSubscription = subscription && 
    (subscription.status === 'active' || subscription.status === 'trialing') && 
    !subscription.cancel_at_period_end;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          className="text-white mb-8"
          onClick={() => navigate("/")}
        >
          &larr; Back to Home
        </Button>
        
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="bg-[#9b87f5]/20 w-24 h-24 rounded-full flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-[#9b87f5]" />
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">{userDisplayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mt-2">
                <Mail className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#151923] border border-white/10 text-white shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#9b87f5]" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Member Since</p>
                  <p>{formatDate(user?.created_at || new Date().toISOString())}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Last Login</p>
                  <p>{formatDate(user?.last_sign_in_at)}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#151923] border border-white/10 text-white shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#9b87f5]" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="capitalize">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          subscription.cancel_at_period_end ? 'bg-yellow-500' :
                          subscription.status === 'active' || subscription.status === 'trialing' ? 'bg-green-500' : 
                          subscription.status === 'canceled' ? 'bg-red-500' : 'bg-red-500'
                        }`}></span>
                        {subscription.cancel_at_period_end && subscription.status === 'trialing' 
                          ? 'Trial (Canceling)' 
                          : subscription.cancel_at_period_end && subscription.status === 'active'
                          ? 'Active (Canceling)'
                          : subscription.status === 'trialing' 
                          ? 'Trial' 
                          : subscription.status}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Current Period Ends</p>
                      <p>{formatDate(subscription.current_period_end)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Plan</p>
                      <p className="flex items-center gap-2">
                        <BadgePoundSterling className="w-4 h-4 text-[#9b87f5]" />
                        Premium Plan (£8.80/month)
                      </p>
                    </div>
                    {subscription.cancel_at_period_end && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm">
                        Your subscription is set to cancel at the end of the {subscription.status === 'trialing' ? 'trial' : 'current billing'} period.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-4">No active subscription</p>
                    <Button 
                      onClick={() => navigate("/")}
                      className="bg-[#9b87f5] hover:bg-[#9b87f5]/90"
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
              {canCancelSubscription && (
                <CardFooter className="pt-2">
                  <Dialog open={isSubscriptionCancelDialogOpen} onOpenChange={setIsSubscriptionCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="text-sm text-red-500 hover:text-red-600 hover:underline flex items-center">
                        <XOctagon className="w-3 h-3 mr-1" />
                        Cancel Subscription
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1A1F2C] text-white border border-gray-700">
                      <DialogHeader>
                        <DialogTitle>Cancel Your Subscription?</DialogTitle>
                        <DialogDescription className="text-gray-300">
                          Hundreds of properties are added weekly. Are you sure you want to cancel your subscription?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex flex-col space-y-4 items-stretch mt-6">
                        <Button 
                          variant="outline"
                          size="lg"
                          className="bg-white text-black hover:bg-gray-100 border-2 border-gray-200 py-6 text-base font-bold"
                          onClick={() => setIsSubscriptionCancelDialogOpen(false)}
                        >
                          No, Keep My Subscription
                        </Button>
                        <button 
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                          className="text-sm text-red-500 hover:text-red-600 hover:underline self-center flex items-center"
                        >
                          {cancelLoading ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Processing...
                            </>
                          ) : (
                            "Yes, Cancel Subscription"
                          )}
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <Card className="bg-[#151923] border border-white/10 text-white shadow-xl">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Coming soon: Email preferences, notification settings, and more.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-xs text-gray-500">
                If you need assistance with your account, please contact our support team at support@repossessedhouses.co.uk
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
