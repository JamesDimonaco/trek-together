"use client";

import { useEffect, useState } from "react";
import { MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface CurrentCity {
  _id: string;
  name: string;
  country: string;
}

export default function CurrentCityCard() {
  const [currentCity, setCurrentCity] = useState<CurrentCity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentCity = async () => {
      try {
        const response = await fetch("/api/current-city");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.city) {
            setCurrentCity(data.city);
          }
        }
      } catch (error) {
        console.error("Failed to fetch current city:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentCity();
  }, []);

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!currentCity) {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-lg">Continue Your Chat</CardTitle>
        </div>
        <CardDescription>
          You have an active chat in {currentCity.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4" />
          <span>{currentCity.name}, {currentCity.country}</span>
        </div>
        
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href={`/chat/${currentCity._id}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Return to {currentCity.name} Chat
          </Link>
        </Button>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Or find trekkers in a different city below
        </p>
      </CardContent>
    </Card>
  );
}