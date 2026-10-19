import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Calendar, Download, Bell, Award, TrendingUp, Trophy, Clock, Settings, Edit3, Camera, Trash2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TestCertificate from "@/components/TestCertificate";
import { auth, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  profile_image?: string;
  created_at: string;
}

interface RegisteredEvent {
  id: number;
  title: string;
  date: string;
  club: string;
  venue: string;
  registration_status: string;
  certificate_downloaded: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface UserStats {
  total_registered: number;
  total_attended: number;
  certificates_downloaded: number;
}

interface UpcomingEvent {
  title: string;
  date: string;
  venue: string;
}

interface ProfileData {
  user: UserProfile;
  registeredEvents: RegisteredEvent[];
  notifications: Notification[];
  stats?: UserStats;
  upcomingEvents?: UpcomingEvent[];
}

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle tab from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'events', 'notifications', 'achievements'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log('Auth state changed:', u ? u.email : 'No user');
      
      if (!u) {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No Firebase user and no token, redirecting to login');
          navigate('/login');
          return;
        }
        console.log('No Firebase user but token exists, fetching profile');
      } else {
        // User is logged in with Firebase, ensure backend token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Firebase user exists but no backend token, syncing...');
          try {
            const response = await fetch('/auth/firebase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: u.email,
                name: u.displayName,
                googleId: u.uid
              })
            });
            const data = await response.json();
            if (data.success) {
              localStorage.setItem('token', data.token);
              console.log('Backend token synced successfully');
            } else {
              console.error('Failed to sync backend token:', data.message);
            }
          } catch (error) {
            console.error('Failed to sync with backend:', error);
          }
        }
      }
      fetchProfile();
    });
    return () => unsub();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('Fetching profile with token');
      
      // Fetch profile data
      const [profileResp, statsResp] = await Promise.all([
        fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const profileData = await profileResp.json();
      
      if (!profileResp.ok) {
        console.error('Profile fetch failed:', profileData);
        if (profileResp.status === 401 || profileResp.status === 403) {
          // Token is invalid, clear it and redirect to login
          localStorage.removeItem('token');
          toast({
            title: "Session Expired",
            description: "Please log in again",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        throw new Error(profileData.message || 'Failed to load profile');
      }
      
      const statsData = statsResp.ok ? await statsResp.json() : { stats: null, upcomingEvents: [] };
      
      console.log('Profile data loaded successfully');
      
      // Default completed event for demo
      const defaultCompletedEvent = {
        id: 999,
        title: "Tech Innovation Summit 2024",
        date: "2024-11-15",
        club: "IEEE Student Chapter",
        venue: "Main Auditorium",
        registration_status: "attended",
        certificate_downloaded: false,
      };
      
      const existingEvents = (profileData.registeredEvents || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        club: e.club,
        venue: e.venue,
        registration_status: e.registration_status,
        certificate_downloaded: !!e.certificate_downloaded,
      }));
      
      setProfileData({
        user: profileData.user,
        registeredEvents: [defaultCompletedEvent, ...existingEvents],
        notifications: profileData.notifications || [],
        stats: statsData.stats || { total_registered: 1, total_attended: 1, certificates_downloaded: 0 },
        upcomingEvents: statsData.upcomingEvents || []
      });
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      
      // For demo purposes, show default data even on error (except auth errors)
      if (error.message?.includes('Login required') || error.message?.includes('Session Expired')) {
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      // Show default demo data
      const defaultCompletedEvent = {
        id: 999,
        title: "Tech Innovation Summit 2024",
        date: "2024-11-15",
        club: "IEEE Student Chapter",
        venue: "Main Auditorium",
        registration_status: "attended",
        certificate_downloaded: false,
      };
      
      setProfileData({
        user: {
          id: 1,
          email: "demo@vnrvjiet.ac.in",
          name: "Demo User",
          role: "student",
          created_at: new Date().toISOString()
        },
        registeredEvents: [defaultCompletedEvent],
        notifications: [],
        stats: { total_registered: 1, total_attended: 1, certificates_downloaded: 0 },
        upcomingEvents: []
      });
      
      toast({
        title: "Demo Mode",
        description: "Showing demo data - backend connection failed",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (eventId: number, eventTitle: string) => {
    try {
      // Handle demo certificate
      if (eventId === 999) {
        toast({
          title: "Certificate Downloaded",
          description: `Certificate for "${eventTitle}" downloaded successfully`,
        });
        
        // Update the certificate_downloaded status for demo event
        if (profileData) {
          const updatedEvents = profileData.registeredEvents.map(event => 
            event.id === 999 ? { ...event, certificate_downloaded: true } : event
          );
          setProfileData({ ...profileData, registeredEvents: updatedEvents });
        }
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/certificate/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to download certificate');
      }

      toast({
        title: "Certificate Downloaded",
        description: `Certificate for "${eventTitle}" retrieved successfully`,
      });

      // Refresh profile to update certificate_downloaded status
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Login required');
      const resp = await fetch(`/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({} as any));
        throw new Error(d.message || 'Failed to mark as read');
      }
      toast({ title: "Updated", description: "Notification marked as read" });
      fetchProfile();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' });
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const user = auth.currentUser;
    if (!user) return;
    
    setUploading(true);
    try {
      const r = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: user.displayName || undefined, profile_image: url })
        });
      }
      await fetchProfile();
      toast({ title: "Profile updated", description: "Photo uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || 'Failed to upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Login required');
      const resp = await fetch(`/api/users/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({} as any));
        throw new Error(d.message || 'Failed to delete');
      }
      toast({ title: "Deleted", description: "Notification removed" });
      fetchProfile();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Failed to load profile data</p>
          <Button onClick={() => {
            setLoading(true);
            fetchProfile();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { user, registeredEvents, notifications, stats, upcomingEvents } = profileData;
  const unreadCount = notifications.filter(n => !n.read).length;
  const attendanceRate = stats ? Math.round((stats.total_attended / Math.max(stats.total_registered, 1)) * 100) : 0;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced User Profile Header */}
          <Card className="border-primary/30 shadow-xl gradient-card">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={user.profile_image} alt={user.name} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                  </div>
                  <p className="text-muted-foreground text-lg">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                
                {stats && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">{stats.total_registered}</div>
                      <div className="text-xs text-muted-foreground">Events Registered</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-accent">{stats.total_attended}</div>
                      <div className="text-xs text-muted-foreground">Events Attended</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-500">{attendanceRate}%</div>
                      <div className="text-xs text-muted-foreground">Attendance Rate</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs Layout */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-fit">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="certificates" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certificates
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                {stats && (
                  <Card className="border-primary/30 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Attendance Rate</span>
                          <span className="font-medium">{attendanceRate}%</span>
                        </div>
                        <Progress value={attendanceRate} className="h-2" />
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">{stats.certificates_downloaded}</div>
                          <div className="text-xs text-muted-foreground">Certificates</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">{unreadCount}</div>
                          <div className="text-xs text-muted-foreground">Unread</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Events */}
                <Card className="border-primary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents && upcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingEvents.slice(0, 3).map((event, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()} • {event.venue}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No upcoming events</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-primary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Test Certificate */}
                <TestCertificate />
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <Card className="border-primary/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    My Events
                  </CardTitle>
                  <CardDescription>
                    All events you've registered for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registeredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No registered events yet</p>
                      <Button className="mt-4" onClick={() => navigate('/events')}>Browse Events</Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {registeredEvents.map((event) => (
                        <Card key={event.id} className="border-muted hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <p className="text-muted-foreground">{event.club} • {event.venue}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                              <Badge variant={event.registration_status === 'attended' ? 'default' : 'secondary'}>
                                {event.registration_status}
                              </Badge>
                            </div>
                            {event.registration_status === 'attended' && (
                              <Button
                                size="sm"
                                onClick={() => downloadCertificate(event.id, event.title)}
                                className="w-full"
                                disabled={event.certificate_downloaded}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {event.certificate_downloaded ? 'Certificate Downloaded' : 'Download Certificate'}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-primary/30 shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge className="ml-2">{unreadCount} unread</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Stay updated with your events and activities</CardDescription>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          notifications.filter(n => !n.read).forEach(n => markNotificationAsRead(n.id));
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark All Read
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`transition-all hover:shadow-md ${
                            !notification.read 
                              ? 'bg-primary/5 border-primary/50 shadow-sm' 
                              : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                  <h4 className="font-semibold">{notification.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      notification.type === 'success' ? 'border-green-500 text-green-500' :
                                      notification.type === 'warning' ? 'border-yellow-500 text-yellow-500' :
                                      notification.type === 'error' ? 'border-red-500 text-red-500' :
                                      'border-blue-500 text-blue-500'
                                    }`}
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!notification.read && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markNotificationAsRead(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <div className="grid gap-6 md:grid-cols-2">
                <TestCertificate />
                <Card className="border-primary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Your Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {registeredEvents.filter(e => e.registration_status === 'attended').length === 0 ? (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No certificates available yet</p>
                        <p className="text-sm text-muted-foreground">Attend events to earn certificates</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {registeredEvents.filter(e => e.registration_status === 'attended').map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.club}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => downloadCertificate(event.id, event.title)}
                              disabled={event.certificate_downloaded}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {event.certificate_downloaded ? 'Downloaded' : 'Download'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <Card className="border-primary/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Your milestones and accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Achievement Cards */}
                    <Card className={`border-2 ${stats && stats.total_registered >= 1 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                      <CardContent className="p-4 text-center">
                        <Award className={`h-8 w-8 mx-auto mb-2 ${stats && stats.total_registered >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold">First Registration</h3>
                        <p className="text-sm text-muted-foreground">Register for your first event</p>
                        {stats && stats.total_registered >= 1 && (
                          <Badge className="mt-2">Unlocked!</Badge>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`border-2 ${stats && stats.total_attended >= 1 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                      <CardContent className="p-4 text-center">
                        <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${stats && stats.total_attended >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold">Event Attendee</h3>
                        <p className="text-sm text-muted-foreground">Attend your first event</p>
                        {stats && stats.total_attended >= 1 && (
                          <Badge className="mt-2">Unlocked!</Badge>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`border-2 ${stats && stats.total_attended >= 5 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                      <CardContent className="p-4 text-center">
                        <Trophy className={`h-8 w-8 mx-auto mb-2 ${stats && stats.total_attended >= 5 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold">Active Participant</h3>
                        <p className="text-sm text-muted-foreground">Attend 5 events</p>
                        {stats && stats.total_attended >= 5 ? (
                          <Badge className="mt-2">Unlocked!</Badge>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            {stats ? `${stats.total_attended}/5` : '0/5'}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`border-2 ${attendanceRate >= 80 ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${attendanceRate >= 80 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold">Reliable Attendee</h3>
                        <p className="text-sm text-muted-foreground">80%+ attendance rate</p>
                        {attendanceRate >= 80 ? (
                          <Badge className="mt-2">Unlocked!</Badge>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            {attendanceRate}%/80%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
