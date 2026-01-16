import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationData } from "@/lib/types";

interface LocationConfirmationProps {
  locationData: LocationData;
  onConfirm: () => void;
  onChangeLocation: () => void;
  isLoading: boolean;
}

export default function LocationConfirmation({
  locationData,
  onConfirm,
  onChangeLocation,
  isLoading,
}: LocationConfirmationProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <MapPin className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <CardTitle className="text-2xl">Is this correct?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {locationData.city}
            {locationData.state && `, ${locationData.state}`}
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {locationData.country}
          </p>
          <p className="text-sm text-muted-foreground">
            {locationData.formattedAddress}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onConfirm}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              `Join ${locationData.city} City Chat`
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onChangeLocation}
            className="w-full"
            disabled={isLoading}
          >
            No, change location
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Join the city chat to connect with other trekkers in {locationData.city}
        </p>
      </CardContent>
    </Card>
  );
}