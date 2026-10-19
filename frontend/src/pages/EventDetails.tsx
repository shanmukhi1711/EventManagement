import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, User, Mail, Phone, ArrowLeft, CheckCircle, Award, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import CertificateGenerator from "@/components/CertificateGenerator";
import { FeedbackForm } from "@/components/FeedbackForm";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [isPastEvent, setIsPastEvent] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    branch: '',
    year: '',
    additionalInfo: ''
  });
  const navigate = useNavigate();

  const getFallbackImage = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c === "tech") return "/event-tech.svg";
    if (c === "cultural") return "/event-cultural.svg";
    if (c === "sports") return "/event-sports.svg";
    return "/event-default.svg";
  };

  const [imgSrc, setImgSrc] = useState<string>(getFallbackImage(''));

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (event) {
      setImgSrc(event.image || getFallbackImage(event.category || ''));
    }
  }, [event]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          id: u.uid,
          email: u.email,
          name: u.displayName || u.email?.split('@')[0] || 'User'
        });
        setRegistrationData(prev => ({
          ...prev,
          name: u.displayName || u.email?.split('@')[0] || '',
          email: u.email || ''
        }));
      } else {
        setUser(null);
        setIsRegistered(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/events/${id}`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to fetch event details');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch event details');
      }

      setEvent(data.event);
      setIsRegistered(data.event.isRegistered || false);
      setHasFeedback(data.event.hasFeedback || false);
      
      // Check if event is in the past
      const eventDate = new Date(data.event.date);
      const currentDate = new Date();
      setIsPastEvent(eventDate < currentDate);
    } catch (error: any) {
      console.error('Fetch event error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to register for events",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    setShowRegistrationForm(true);
  };

  const submitRegistration = async () => {
    if (!registrationData.name || !registrationData.email || !registrationData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to register for events",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setIsRegistered(true);
      setShowRegistrationForm(false);
      toast({ 
        title: "Success!", 
        description: "Successfully registered for the event!" 
      });
      
      // Refresh event details to update registration status
      fetchEventDetails();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || 'Failed to register. Please try again.',
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Link to="/events">
            <Button variant="secondary">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "tech":
        return "text-accent";
      case "cultural":
        return "text-secondary";
      case "sports":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Link to="/events">
          <Button variant="ghost" className="mb-6 group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </Button>
        </Link>

        {/* Hero Image */}
        <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8 animate-fade-in">
          <img
            src={imgSrc}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImgSrc(getFallbackImage(event.category))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
        </div>

        {/* Event Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className={`text-sm font-semibold ${getCategoryColor(event.category)} mb-2`}>
            {event.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span className="text-sm">Organized by {event.organizer}</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-accent" />
              <span className="text-sm font-semibold text-accent">{event.club}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-semibold">{event.date}</div>
              </div>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Venue</div>
                <div className="font-semibold">{event.venue}</div>
              </div>
            </div>
          </div>

          {isRegistered ? (
            <Button
              variant="default"
              size="lg"
              className="w-full md:w-auto"
              disabled
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Registered
            </Button>
          ) : isPastEvent ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full md:w-auto"
              disabled
            >
              Event Ended
            </Button>
          ) : (
            <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={handleRegister}
                >
                  Register Now
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Register for {event?.title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name *</Label>
                    <Input
                      id="name"
                      value={registrationData.name}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                      className="col-span-3"
                      placeholder="your.email@vnrvjiet.in"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone *</Label>
                    <Input
                      id="phone"
                      value={registrationData.phone}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                      className="col-span-3"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rollNumber" className="text-right">Roll No.</Label>
                    <Input
                      id="rollNumber"
                      value={registrationData.rollNumber}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, rollNumber: e.target.value }))}
                      className="col-span-3"
                      placeholder="Your roll number"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="branch" className="text-right">Branch</Label>
                    <Input
                      id="branch"
                      value={registrationData.branch}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, branch: e.target.value }))}
                      className="col-span-3"
                      placeholder="CSE, ECE, etc."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="year" className="text-right">Year</Label>
                    <Input
                      id="year"
                      value={registrationData.year}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, year: e.target.value }))}
                      className="col-span-3"
                      placeholder="1st, 2nd, 3rd, 4th"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="additionalInfo" className="text-right">Notes</Label>
                    <Textarea
                      id="additionalInfo"
                      value={registrationData.additionalInfo}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                      className="col-span-3"
                      placeholder="Any additional information..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitRegistration}
                    disabled={registering}
                  >
                    {registering ? "Registering..." : "Register"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <Card className="animate-fade-in-up">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">About Event</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Rules & Guidelines</h2>
                <ul className="space-y-3">
                  {Array.isArray(event.rules) ? event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{rule}</span>
                    </li>
                  )) : event.rules.split('\n').map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="animate-fade-in-up sticky top-24" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Coordinator
                    </div>
                    <div className="font-semibold">{event.organizer}</div>
                  </div>
                  <div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      <a
                        href={`mailto:${event.contact_email}`}
                        className="text-primary hover:underline"
                      >
                        {event.contact_email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      <a
                        href={`tel:${event.contact_phone}`}
                        className="text-primary hover:underline"
                      >
                        {event.contact_phone}
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Download - Only for registered users */}
            {isRegistered && (
              <Card className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Get Certificate</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download your certificate of participation for this event.
                  </p>
                  <CertificateGenerator
                    eventTitle={event.title}
                    eventDate={event.date}
                    club={event.club}
                    eventId={event.id}
                  />
                </CardContent>
              </Card>
            )}

            {/* Feedback Form - Only for registered users */}
            {isRegistered && (
              <Card className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Event Feedback
                  </h2>
                  {hasFeedback ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">Thank you for your feedback!</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share your experience and help us improve future events.
                      </p>
                      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Give Feedback
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <FeedbackForm
                            eventId={event.id}
                            eventTitle={event.title}
                            onSubmit={() => {
                              setShowFeedbackForm(false);
                              setHasFeedback(true);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
