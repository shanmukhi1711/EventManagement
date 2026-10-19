import { Link } from "react-router-dom";
import { Calendar, Users, Trophy, ArrowRight, Clock, MapPin, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import EventCard from "@/components/EventCard";
import { events } from "@/data/events";
import heroCampus from "@/assets/hero-campus.jpg";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const trendingEvents = events.slice(0, 3);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchUserEvents();
      } else {
        setRegisteredEvents([]);
        setUpcomingEvents([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const [profileRes, eventsRes] = await Promise.all([
        fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setRegisteredEvents(profileData.registeredEvents || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const upcoming = eventsData.events.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate > new Date() && event.isRegistered;
        }).slice(0, 3);
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Failed to fetch user events:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (eventId: string, eventTitle: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to download certificates",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/users/certificate/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to download certificate",
          variant: "destructive",
        });
        return;
      }

      // Generate and download certificate
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 800;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#f8fafc");
      gradient.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Title
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF COMPLETION", canvas.width / 2, 150);

      // College name
      ctx.font = "24px Arial";
      ctx.fillStyle = "#64748b";
      ctx.fillText("VNR VJIET - Campus Events", canvas.width / 2, 200);

      // Participant name
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 36px Arial";
      ctx.fillText(data.certificate.participantName, canvas.width / 2, 350);

      // Event details
      ctx.font = "28px Arial";
      ctx.fillStyle = "#475569";
      ctx.fillText(`Successfully completed: ${data.certificate.eventTitle}`, canvas.width / 2, 450);
      ctx.fillText(`Date: ${new Date(data.certificate.eventDate).toLocaleDateString()}`, canvas.width / 2, 500);
      ctx.fillText(`Organized by: ${data.certificate.club}`, canvas.width / 2, 550);

      // Certificate ID
      ctx.font = "16px Arial";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`Certificate ID: ${data.certificate.certificateId}`, canvas.width / 2, 650);

      // Download
      const link = document.createElement("a");
      link.download = `${eventTitle.replace(/\s+/g, "_")}_Certificate.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Success!",
        description: "Certificate downloaded successfully",
      });

      // Refresh events to update download status
      fetchUserEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate certificate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroCampus})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover Amazing
            <br />
            <span className="text-orange-400">Campus Events</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join exciting events, connect with fellow students, and make unforgettable memories on campus
          </p>
          <Link to="/events">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              View Events
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-10 w-10 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600 font-medium">Amazing Events</div>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">25+</div>
              <div className="text-gray-600 font-medium">Student Clubs</div>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4 group-hover:bg-orange-200 transition-colors">
                <Trophy className="h-10 w-10 text-orange-600" />
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">3000+</div>
              <div className="text-gray-600 font-medium">Happy Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section - Only show if logged in */}
      {user && (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Welcome back, <span className="text-blue-600">{user.displayName || user.email?.split('@')[0]}</span>!
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Here's your event dashboard with registrations and certificates
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Upcoming Events */}
                <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800">CodeSprint 2025</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Dec 15, 2025
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              C Block - Room 317
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Registered</Badge>
                      </div>
                      
                      <Link to="/events">
                        <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                          Browse All Events
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Completed Events & Certificates */}
                <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Completed Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {registeredEvents.filter(event => event.registration_status === 'attended').map((event) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>{event.club}</span>
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Completed
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadCertificate(event.event_id, event.title)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Certificate
                          </Button>
                        </div>
                      ))}
                      
                      <Link to="/profile?tab=events">
                        <Button variant="outline" className="w-full border-green-300 text-green-600 hover:bg-green-50">
                          View All Registrations
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trending Events Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Trending <span className="text-blue-600">Events</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't miss out on these popular events happening soon
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {trendingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/events">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;