export interface Event {
  id: number;
  title: string;
  category: "Tech" | "Cultural" | "Sports";
  date: string;
  venue: string;
  image: string;
  description: string;
  organizer: string;
  club: string;
  rules: string[];
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export const events: Event[] = [
  {
    id: 1,
    title: "CodeSprint 2025",
    category: "Tech",
    date: "March 15, 2025",
    venue: "C Block - Room 317",
    image: "/event-tech.jpg",
    description: "A 24-hour hackathon where innovation meets code. Build solutions for real-world problems.",
    organizer: "CSE Department",
    club: "ACM Student Chapter",
    rules: [
      "Teams of 2-4 members",
      "Bring your own laptop",
      "Original code only",
      "Judging based on innovation, implementation, and presentation",
    ],
    contact: {
      name: "Rajesh Kumar",
      email: "rajesh@vnrvjiet.ac.in",
      phone: "+91 98765 43210",
    },
  },
  {
    id: 2,
    title: "Cultural Fest 2025",
    category: "Cultural",
    date: "March 20, 2025",
    venue: "APJ Audi",
    image: "/event-cultural.jpg",
    description: "Celebrate diversity through music, dance, and art. Showcase your talent!",
    organizer: "Cultural Committee",
    club: "Livewire (Dance Club)",
    rules: [
      "Open to all students",
      "Register your performance in advance",
      "Time limit: 10 minutes per performance",
      "Props and costumes allowed",
    ],
    contact: {
      name: "Priya Sharma",
      email: "priya@vnrvjiet.ac.in",
      phone: "+91 98765 43211",
    },
  },
  {
    id: 3,
    title: "Inter-College Sports Meet",
    category: "Sports",
    date: "March 25, 2025",
    venue: "Sports Complex",
    image: "/event-sports.jpg",
    description: "Compete in athletics, cricket, basketball, and more. Show your sporting spirit!",
    organizer: "Sports Committee",
    club: "Sports & Athletics Club",
    rules: [
      "Valid college ID required",
      "Sportswear mandatory",
      "Medical certificate needed for participation",
      "Follow fair play guidelines",
    ],
    contact: {
      name: "Arun Reddy",
      email: "arun@vnrvjiet.ac.in",
      phone: "+91 98765 43212",
    },
  },
  {
    id: 4,
    title: "AI & ML Workshop",
    category: "Tech",
    date: "April 2, 2025",
    venue: "PG Block - Room 215",
    image: "/event-tech.jpg",
    description: "Learn the fundamentals of AI and Machine Learning from industry experts.",
    organizer: "CSE Department",
    club: "IEEE Student Chapter",
    rules: [
      "Basic programming knowledge required",
      "Limited seats - register early",
      "Laptops mandatory",
      "Certificate of participation provided",
    ],
    contact: {
      name: "Dr. Sandeep Mehta",
      email: "sandeep@vnrvjiet.ac.in",
      phone: "+91 98765 43213",
    },
  },
  {
    id: 5,
    title: "Battle of Bands",
    category: "Cultural",
    date: "April 10, 2025",
    venue: "KS Audi",
    image: "/event-cultural.jpg",
    description: "Rock the stage with your band! Original compositions encouraged.",
    organizer: "Music Club",
    club: "Crescendo (Music Club)",
    rules: [
      "Bands of 3-6 members",
      "20 minutes performance time",
      "Original or cover songs allowed",
      "Sound equipment provided",
    ],
    contact: {
      name: "Vikram Singh",
      email: "vikram@vnrvjiet.ac.in",
      phone: "+91 98765 43214",
    },
  },
  {
    id: 6,
    title: "Marathon for a Cause",
    category: "Sports",
    date: "April 15, 2025",
    venue: "Campus & Surroundings",
    image: "/event-sports.jpg",
    description: "Run for charity! All proceeds go to local NGOs supporting education.",
    organizer: "NSS Unit",
    club: "NSS & Social Welfare",
    rules: [
      "Registration fee: ₹200",
      "Age limit: 16+",
      "Medical checkup recommended",
      "T-shirt and certificate for all participants",
    ],
    contact: {
      name: "Anita Rao",
      email: "anita@vnrvjiet.ac.in",
      phone: "+91 98765 43215",
    },
  },
];
