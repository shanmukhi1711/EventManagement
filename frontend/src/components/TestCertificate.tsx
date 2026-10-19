import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CertificateGenerator from "./CertificateGenerator";

const TestCertificate = () => {
  const [showGenerator, setShowGenerator] = useState(false);
  const { toast } = useToast();

  const sampleEvent = {
    id: "sample-event-123",
    title: "Sample Tech Workshop 2025",
    date: "2025-01-15",
    club: "Computer Science Club",
    venue: "Innovation Lab"
  };

  const handleTestCertificate = () => {
    toast({
      title: "Test Certificate",
      description: "This is a sample certificate for testing purposes",
    });
    setShowGenerator(true);
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certificate Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Test the certificate generation functionality with sample data.
        </p>
        
        <div className="space-y-2">
          <p><strong>Event:</strong> {sampleEvent.title}</p>
          <p><strong>Date:</strong> {new Date(sampleEvent.date).toLocaleDateString()}</p>
          <p><strong>Club:</strong> {sampleEvent.club}</p>
        </div>

        {!showGenerator ? (
          <Button onClick={handleTestCertificate} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Test Certificate Download
          </Button>
        ) : (
          <CertificateGenerator
            eventTitle={sampleEvent.title}
            eventDate={sampleEvent.date}
            club={sampleEvent.club}
            eventId={sampleEvent.id}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TestCertificate;