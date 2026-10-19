import { Calendar, Users, Award, Building2, MapPin, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 pt-20 pb-12">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 animate-fade-in bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            About VNR VJIET Event Management System
          </h1>
          
          <p className="text-xl text-center text-muted-foreground mb-16 animate-fade-in max-w-3xl mx-auto">
            Empowering students to discover, engage, and excel through seamless event management and innovation
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="hover-lift hover-glow border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-tech mb-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-primary">Real-time Updates</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stay informed about upcoming events with instant notifications and live updates from all campus activities
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift hover-glow border-accent/20 bg-gradient-to-br from-card to-accent/5">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-tech mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-accent">Easy Registration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Register for events with just a few clicks and manage all your participations in one place
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift hover-glow border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-tech mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-secondary">Achievements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Download certificates, track your participation history, and build your campus portfolio
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="gradient-card border-primary/20 shadow-2xl mb-12 hover-glow">
            <CardContent className="p-10">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                The VNR VJIET Event Management System is designed to bridge the gap between 
                students and the vibrant campus life. We aim to create a centralized platform 
                where students can explore diverse opportunities, from technical workshops and 
                hackathons to cultural celebrations, sports competitions, and guest lectures.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                Our platform connects students with 50+ active clubs and organizations, hosting 
                over 100+ events annually across multiple categories. Whether you're passionate 
                about technology, arts, sports, or entrepreneurship, we ensure you never miss 
                out on opportunities that align with your interests.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                With features like smart event filtering, instant registration, digital certificates, 
                and comprehensive event details, we're transforming how students engage with campus 
                life. Join our community of 5000+ active participants and make the most of your 
                college experience!
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/20 hover-lift hover-glow">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-7 w-7 text-primary" />
                  <h3 className="text-2xl font-bold text-primary">Campus Venues</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Events are hosted across our state-of-the-art campus facilities:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span><strong>Academic Blocks:</strong> A, B, C, D, E (5 floors, 20 rooms per floor)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span><strong>Auditoriums:</strong> APJ Audi, KS Audi for large gatherings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span><strong>PG Block:</strong> Research and innovation center</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span><strong>Sports Complex:</strong> Indoor and outdoor facilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover-lift hover-glow">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-7 w-7 text-accent" />
                  <h3 className="text-2xl font-bold text-accent">Event Categories</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Diverse opportunities across multiple domains:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3 p-2 rounded bg-primary/5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span><strong>Tech Events:</strong> Hackathons, workshops, coding competitions</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded bg-accent/5">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    <span><strong>Cultural Events:</strong> Music, dance, drama, and arts</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded bg-secondary/5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span><strong>Sports:</strong> Inter-college competitions and tournaments</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded bg-primary/5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span><strong>Workshops:</strong> Skill development and career guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
