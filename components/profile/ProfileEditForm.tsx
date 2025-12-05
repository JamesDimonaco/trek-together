"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
import AvatarUpload from "./AvatarUpload";
import { analytics } from "@/lib/analytics";

export default function ProfileEditForm() {
  const router = useRouter();
  const { userId: authUserId } = useAuth();
  const { user: clerkUser } = useUser();

  // Get current user's Convex user ID
  const currentUser = useQuery(
    api.users.getUserByAuthId,
    authUserId ? { authId: authUserId } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getFileUrl);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [location, setLocation] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Populate form with current user data
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setWhatsappNumber(currentUser.whatsappNumber || "");
      setDateOfBirth(currentUser.dateOfBirth || "");
      setLocation(currentUser.location || "");
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      let avatarUrl = currentUser.avatarUrl || clerkUser?.imageUrl;

      // Upload new avatar if file selected
      if (avatarFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });

        if (!result.ok) {
          throw new Error("Failed to upload avatar");
        }

        const { storageId } = await result.json();

        // Get the URL from Convex storage using the mutation
        const fileUrl = await getFileUrl({ storageId });
        if (fileUrl) {
          avatarUrl = fileUrl;
          analytics.avatarUploaded();
        }
      }

      await updateProfile({
        userId: currentUser._id,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        location: location.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      // Track which fields were updated
      const fieldsUpdated: string[] = [];
      if (username.trim() !== currentUser.username) fieldsUpdated.push("username");
      if (bio.trim() !== (currentUser.bio || "")) fieldsUpdated.push("bio");
      if (whatsappNumber.trim() !== (currentUser.whatsappNumber || "")) fieldsUpdated.push("whatsapp");
      if (dateOfBirth !== (currentUser.dateOfBirth || "")) fieldsUpdated.push("dateOfBirth");
      if (location.trim() !== (currentUser.location || "")) fieldsUpdated.push("location");
      if (avatarFile) fieldsUpdated.push("avatar");
      if (fieldsUpdated.length > 0) {
        analytics.profileEdited(fieldsUpdated);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/${currentUser._id}`);
      }, 1000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Require auth
  if (authUserId === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to be signed in to edit your profile
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (currentUser === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/profile/${currentUser?._id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information and let other trekkers know about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <AvatarUpload
              currentAvatar={currentUser?.avatarUrl || clerkUser?.imageUrl}
              onAvatarChange={setAvatarFile}
            />

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                maxLength={50}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other trekkers about yourself, your favorite trails, hiking experience..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Date of Birth and Location Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="text-base"
                />
                <p className="text-xs text-gray-500">
                  Your age will be calculated automatically
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">From (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, USA"
                  maxLength={100}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+1234567890"
                maxLength={20}
              />
              <p className="text-xs text-gray-500">
                Share your WhatsApp to connect with other trekkers
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                Profile updated successfully! Redirecting...
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
