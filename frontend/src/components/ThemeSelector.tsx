import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";

const themes = [
  { name: "Dark", value: "dark", color: "bg-slate-900" },
  { name: "Light", value: "light", color: "bg-white border" },
  { name: "Cyberpunk", value: "cyberpunk", color: "bg-gradient-to-r from-purple-600 to-pink-600" },
  { name: "Ocean", value: "ocean", color: "bg-gradient-to-r from-blue-600 to-cyan-600" },
  { name: "Forest", value: "forest", color: "bg-gradient-to-r from-green-600 to-emerald-600" },
  { name: "Sunset", value: "sunset", color: "bg-gradient-to-r from-orange-600 to-red-600" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value as any)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${t.color}`} />
              <span>{t.name}</span>
            </div>
            {theme === t.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}