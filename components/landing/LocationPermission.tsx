import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationPermissionProps {
  isLoading: boolean;
  onManualEntry: () => void;
}

export default function LocationPermission({ isLoading, onManualEntry }: LocationPermissionProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <MapPin className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4 animate-pulse" />
        <CardTitle className="text-2xl">
          {isLoading ? "Finding your location..." : "Enable Location Access"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-left space-y-3">
          <p className="font-medium">We need your location to:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Connect you with trekkers in your city</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Show relevant outdoor activities nearby</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>Help you find local hiking groups</span>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground pt-2">
            Your location is only used to identify your city and is never stored or shared.
          </p>
        </div>
        
        {!isLoading && (
          <Button
            variant="link"
            onClick={onManualEntry}
            className="w-full"
          >
            Enter location manually instead
          </Button>
        )}
      </CardContent>
    </Card>
  );
}