import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TestProfile = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSampleNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login first",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/users/notifications/create-sample', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sample notifications created successfully!"
        });
      } else {
        throw new Error(data.message || 'Failed to create notifications');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Please login first",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/users/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Unread Count",
          description: `You have ${data.count} unread notifications`
        });
      } else {
        throw new Error(data.message || 'Failed to get count');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-primary/30 shadow-xl">
          <CardHeader>
            <CardTitle>Profile & Notifications Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Use these buttons to test the new profile and notification features:
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={createSampleNotifications}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Sample Notifications"}
              </Button>
              
              <Button 
                onClick={testNotificationCount}
                variant="outline"
                className="w-full"
              >
                Check Unread Count
              </Button>
            </div>

            <div className="mt-8 space-y-2">
              <h3 className="font-semibold">Features to Test:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Enhanced profile page with tabs (Overview, Events, Notifications, Achievements)</li>
                <li>Notification dropdown in navigation bar</li>
                <li>Real-time notification count updates</li>
                <li>Mark notifications as read/unread</li>
                <li>Delete notifications</li>
                <li>Profile image upload</li>
                <li>User statistics and progress tracking</li>
                <li>Achievement system</li>
                <li>Responsive design for mobile devices</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Navigation Instructions:</h4>
              <p className="text-sm text-muted-foreground">
                1. Go to <a href="/profile" className="text-primary hover:underline">/profile</a> to see the enhanced profile page<br/>
                2. Try different tabs: Overview, Events, Notifications, Achievements<br/>
                3. Check the notification bell icon in the navigation bar<br/>
                4. Test URL navigation like <a href="/profile?tab=notifications" className="text-primary hover:underline">/profile?tab=notifications</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestProfile;