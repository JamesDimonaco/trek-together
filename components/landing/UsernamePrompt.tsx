import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LocationData, SessionData } from "@/lib/types";

interface UsernamePromptProps {
  locationData: LocationData;
  session: SessionData | null;
  username: string;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  onStayAnonymous: () => void;
  isLoading: boolean;
  error?: string;
  suggestion?: string;
}

export default function UsernamePrompt({
  locationData,
  session,
  username,
  onUsernameChange,
  onSubmit,
  onStayAnonymous,
  isLoading,
  error,
  suggestion,
}: UsernamePromptProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <User className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <CardTitle className="text-2xl">How should we call you?</CardTitle>
        <CardDescription>
          Choose a display name for the {locationData.city} chat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="text"
          placeholder="Enter your name (e.g., Alex, Trail Runner)"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && username.trim()) {
              onSubmit();
            }
          }}
          className="w-full"
          maxLength={30}
        />
        
        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-500">{error}</p>
            {suggestion && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try: <span className="font-medium text-gray-900 dark:text-gray-100">{suggestion}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUsernameChange(suggestion)}
                  className="text-xs"
                >
                  Use this
                </Button>
              </div>
            )}
          </div>
        )}
        
        <Button
          onClick={onSubmit}
          disabled={!username.trim() || isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining chat...
            </>
          ) : (
            "Join Chat"
          )}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onStayAnonymous}
          className="w-full"
          disabled={isLoading}
        >
          Stay anonymous
          {session?.username && (
            <span className="text-xs ml-2 text-muted-foreground">
              (as {session.username})
            </span>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          You can always change this later in your profile
        </p>
      </CardContent>
    </Card>
  );
}