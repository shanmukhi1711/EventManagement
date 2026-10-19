import { Calendar, MapPin, Tag, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { useState } from "react";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    category: string;
    date: string;
    venue: string;
    image: string;
    description: string;
  };
  isRegistered?: boolean;
  registrationStatus?: string;
}

const EventCard = ({ event, isRegistered, registrationStatus }: EventCardProps) => {
  const { id, title, category, date, venue, image, description } = event;
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "tech":
        return "bg-accent text-accent-foreground";
      case "cultural":
        return "bg-secondary text-secondary-foreground";
      case "sports":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFallbackImage = (cat: string) => {
    const c = cat.toLowerCase();
    if (c === "tech") return "/event-tech.svg";
    if (c === "cultural") return "/event-cultural.svg";
    if (c === "sports") return "/event-sports.svg";
    return "/event-default.svg";
  };

  const [imgSrc, setImgSrc] = useState<string>(image || getFallbackImage(category));

  return (
    <Card className="group overflow-hidden card-hover shadow-custom-sm hover:shadow-custom-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <div className="relative overflow-hidden h-48">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgSrc(getFallbackImage(category))}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 flex gap-2">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold glass-effect ${getCategoryColor(
              category
            )} backdrop-blur-md`}
          >
            <Tag className="h-3 w-3" />
            {category}
          </span>
          {isRegistered && (
            <Badge className="bg-green-500/90 hover:bg-green-600 text-white glass-effect animate-pulse-glow">
              <CheckCircle className="h-3 w-3 mr-1" />
              Registered
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white text-sm font-medium glass-effect px-2 py-1 rounded">
            Click to explore
          </div>
        </div>
      </div>
      <CardContent className="p-6 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-gradient transition-all duration-300">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <div className="p-1 rounded-full bg-primary/10 mr-3">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            {date}
          </div>
          <div className="flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <div className="p-1 rounded-full bg-primary/10 mr-3">
              <MapPin className="h-3 w-3 text-primary" />
            </div>
            {venue}
          </div>
        </div>
        <Link to={`/events/${id}`}>
          <Button 
            variant={isRegistered ? "default" : "secondary"} 
            className={`w-full transition-all duration-300 ${
              isRegistered 
                ? 'bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary shadow-lg hover:shadow-primary/25' 
                : 'hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {isRegistered ? 'View Details' : 'Know More'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default EventCard;
