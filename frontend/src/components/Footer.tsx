import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">VNR VJIET Events</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Your gateway to campus events, activities, and opportunities at VNR
              Vignana Jyothi Institute of Engineering and Technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/events" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/login" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  VNR VJIET, Bachupally, Hyderabad
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <a href="mailto:events@vnrvjiet.ac.in" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  events@vnrvjiet.ac.in
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-primary-foreground/80">+91 40 1234 5678</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; 2025 VNR VJIET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
