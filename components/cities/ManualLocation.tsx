import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ManualLocationProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onUseCurrentLocation: () => void;
  isLoading: boolean;
  error?: string;
}

export default function ManualLocation({
  value,
  onChange,
  onSubmit,
  onUseCurrentLocation,
  isLoading,
  error,
}: ManualLocationProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Where are you located?</CardTitle>
        <CardDescription>
          Enter your city to connect with local trekkers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          placeholder="e.g., San Francisco, Boulder, Seattle..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onSubmit();
            }
          }}
          className="w-full"
        />
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding location...
            </>
          ) : (
            "Continue"
          )}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onUseCurrentLocation}
          className="w-full"
          disabled={isLoading}
        >
          ← Use my current location instead
        </Button>
      </CardContent>
    </Card>
  );
}