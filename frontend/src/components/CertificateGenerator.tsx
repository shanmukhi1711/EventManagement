import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CertificateProps {
  eventTitle: string;
  eventDate: string;
  club: string;
  participantName?: string;
  eventId?: string;
}

const CertificateGenerator = ({ eventTitle, eventDate, club, participantName = "Participant", eventId }: CertificateProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const generateCertificate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please login to download certificates",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);
    try {
      // Check if user is registered for the event
      const response = await fetch(`/api/events/${eventId}/registration-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.isRegistered) {
        toast({
          title: "Not Registered",
          description: "You must be registered for this event to download a certificate",
          variant: "destructive",
        });
        return;
      }

      // Get user info for certificate
      const userResponse = await fetch('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 1200;
      canvas.height = 800;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(0.3, "#1e293b");
      gradient.addColorStop(0.7, "#334155");
      gradient.addColorStop(1, "#475569");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle pattern overlay
      ctx.fillStyle = "rgba(59, 130, 246, 0.05)";
      for (let i = 0; i < canvas.width; i += 50) {
        for (let j = 0; j < canvas.height; j += 50) {
          ctx.fillRect(i, j, 25, 25);
        }
      }

      // Border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Inner border
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);

      // Title with shadow effect
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF PARTICIPATION", canvas.width / 2, 150);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // College name
      ctx.font = "28px Arial, sans-serif";
      ctx.fillStyle = "#60a5fa";
      ctx.fillText("CAMPUS EVENTS - VNR VJIET", canvas.width / 2, 210);

      // Decorative line
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 240);
      ctx.lineTo(900, 240);
      ctx.stroke();

      // This certifies text
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "28px Poppins, sans-serif";
      ctx.fillText("This certificate is proudly presented to", canvas.width / 2, 320);

      // Participant name with glow effect
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.fillText(userData.user.name || participantName, canvas.width / 2, 400);
      ctx.shadowBlur = 0;

      // Underline for name with gradient
      const nameWidth = ctx.measureText(userData.user.name || participantName).width;
      const nameGradient = ctx.createLinearGradient((canvas.width - nameWidth) / 2, 415, (canvas.width + nameWidth) / 2, 415);
      nameGradient.addColorStop(0, "#3b82f6");
      nameGradient.addColorStop(0.5, "#f97316");
      nameGradient.addColorStop(1, "#3b82f6");
      ctx.strokeStyle = nameGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo((canvas.width - nameWidth) / 2, 415);
      ctx.lineTo((canvas.width + nameWidth) / 2, 415);
      ctx.stroke();

      // For participating text
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "26px Poppins, sans-serif";
      ctx.fillText("for participating in", canvas.width / 2, 470);

      // Event title with glow
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.fillText(eventTitle, canvas.width / 2, 530);
      ctx.shadowBlur = 0;

      // Event details
      ctx.fillStyle = "#d1d5db";
      ctx.font = "22px Arial, sans-serif";
      ctx.fillText(`Organized by ${club}`, canvas.width / 2, 580);
      ctx.fillText(`Date: ${new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, canvas.width / 2, 620);
      
      // Add certificate ID
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText(`Certificate ID: CERT-${eventId}-${Date.now().toString().slice(-6)}`, canvas.width / 2, 660);

      // Signature lines
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, 720);
      ctx.lineTo(400, 720);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(800, 720);
      ctx.lineTo(1000, 720);
      ctx.stroke();

      ctx.fillStyle = "#9ca3af";
      ctx.font = "18px Poppins, sans-serif";
      ctx.fillText("Coordinator", 300, 750);
      ctx.fillText("Director", 900, 750);

      // Download the certificate
      const link = document.createElement("a");
      link.download = `${eventTitle.replace(/\s+/g, "_")}_Certificate.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Success!",
        description: "Certificate downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate certificate",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <Button
        onClick={generateCertificate}
        className="w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
        size="lg"
      >
        <Download className="mr-2 h-5 w-5" />
        Download Certificate
      </Button>
    </>
  );
};

export default CertificateGenerator;
