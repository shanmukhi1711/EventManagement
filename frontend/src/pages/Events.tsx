import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Events = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);

  const categories = ["All", "Tech", "Cultural", "Sports"];

  useEffect(() => {
    fetchEvents();
    const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
    return () => unsub();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/events', {
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch events');
      }

      setEvents(data.events || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const now = new Date();
  const parseDate = (d: string) => new Date(d);
  const ongoing = filteredEvents.filter((e) => {
    const dt = parseDate(e.date);
    return isFinite(dt.getTime()) ? dt >= now : true;
  }).slice(0, 10);
  const past = filteredEvents.filter((e) => {
    const dt = parseDate(e.date);
    return isFinite(dt.getTime()) ? dt < now : false;
  }).slice(0, 10);

  const registerFor = async (eventId: string) => {
    if (!uid) {
      toast({ title: "Login required", description: "Please login to register", variant: "destructive" });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Login required", description: "Please login to register", variant: "destructive" });
        return;
      }
      const resp = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      toast({ title: "Successfully Registered!" });
      // Refresh events to reflect isRegistered flag
      await fetchEvents();
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message || 'Try again later', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Events at{" "}
            <span className="text-secondary border-b-4 border-secondary">
              VNR VJIET
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover amazing opportunities to learn, compete, and celebrate
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 animate-fade-in-up">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="transition-all duration-300"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length ? (
          <>
            {/* Ongoing Events */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Ongoing Events</h2>
              {ongoing.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {ongoing.map((event, index) => (
                    <div
                      key={event.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <EventCard 
                        {...event} 
                        isRegistered={event.isRegistered}
                        registrationStatus={event.registrationStatus}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No ongoing events found</p>
              )}
            </div>

            {/* Past Events */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Past Events</h2>
              {past.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {past.map((event, index) => (
                    <div
                      key={event.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <EventCard 
                        {...event} 
                        isRegistered={event.isRegistered}
                        registrationStatus={event.registrationStatus}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past events found</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              No events found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
