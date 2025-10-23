"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Loader2, Bell, Mail as MailIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SettingsClient() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [unblockingUserId, setUnblockingUserId] = useState<Id<"users"> | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: Id<"users">; username: string } | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  const currentUser = useQuery(
    api.users.getUserByAuthId,
    clerkUser?.id ? { authId: clerkUser.id } : "skip"
  );

  const blockedUsers = useQuery(
    api.safety.getBlockedUsers,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  const unblockUser = useMutation(api.safety.unblockUser);
  const updateNotificationPreferences = useMutation(api.users.updateNotificationPreferences);

  useEffect(() => {
    if (currentUser?._id) {
      setConvexUserId(currentUser._id);
      // Initialize notification preferences from current user
      setEmailNotifications(currentUser.emailNotifications ?? true);
      setBrowserNotifications(currentUser.browserNotifications ?? false);
    }
  }, [currentUser]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/sign-in");
    }
  }, [isLoaded, clerkUser, router]);

  const handleUnblockClick = (userId: Id<"users">, username: string) => {
    setSelectedUser({ id: userId, username });
    setConfirmDialogOpen(true);
  };

  const handleUnblock = async () => {
    if (!convexUserId || !selectedUser) return;

    setUnblockingUserId(selectedUser.id);
    try {
      await unblockUser({
        blockerId: convexUserId,
        blockedId: selectedUser.id,
      });

      toast.success(`Unblocked ${selectedUser.username}`);
      setConfirmDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Unblock error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unblock user");
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handleEmailNotificationsToggle = async (checked: boolean) => {
    if (!convexUserId) return;

    setEmailNotifications(checked);
    try {
      await updateNotificationPreferences({
        userId: convexUserId,
        emailNotifications: checked,
      });

      toast.success(
        checked ? "Email notifications enabled" : "Email notifications disabled"
      );
    } catch (error) {
      console.error("Failed to update email notifications:", error);
      toast.error("Failed to update notification preferences");
      // Revert on error
      setEmailNotifications(!checked);
    }
  };

  const handleBrowserNotificationsToggle = async (checked: boolean) => {
    if (!convexUserId) return;

    if (checked) {
      // Request browser notification permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          toast.error("Please allow notifications in your browser settings");
          return;
        }
      } else {
        toast.error("Your browser doesn't support notifications");
        return;
      }
    }

    setBrowserNotifications(checked);
    try {
      await updateNotificationPreferences({
        userId: convexUserId,
        browserNotifications: checked,
      });

      toast.success(
        checked ? "Browser notifications enabled" : "Browser notifications disabled"
      );
    } catch (error) {
      console.error("Failed to update browser notifications:", error);
      toast.error("Failed to update notification preferences");
      // Revert on error
      setBrowserNotifications(!checked);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Notification Preferences Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MailIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified by email when you receive a new DM
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={handleEmailNotificationsToggle}
                />
              </div>

              {/* Browser Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="browser-notifications" className="text-base font-medium cursor-pointer">
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get browser notifications for new messages
                    </p>
                  </div>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={browserNotifications}
                  onCheckedChange={handleBrowserNotificationsToggle}
                />
              </div>

              {!currentUser?.email && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  ⚠ No email address on file. Email notifications will not work until you add an email to your account.
                </p>
              )}
            </div>
          </Card>

          {/* Blocked Users Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold">Blocked Users</h2>
            </div>

            {!blockedUsers || blockedUsers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                You haven&apos;t blocked anyone yet
              </p>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((block: {
                  blockId: Id<"blocked_users">;
                  blockedAt: number;
                  reason?: string;
                  user: {
                    _id: Id<"users">;
                    username: string;
                    avatarUrl?: string;
                  } | null;
                }) => {
                  if (!block.user) return null;

                  return (
                    <div
                      key={block.blockId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {block.user.avatarUrl ? (
                          <Image
                            src={block.user.avatarUrl}
                            alt={block.user.username}
                            width={40}
                            height={40}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {block.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* User Info */}
                        <div>
                          <p className="font-medium">{block.user.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Blocked on {formatDate(block.blockedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Unblock Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockClick(block.user!._id, block.user!.username)}
                        disabled={unblockingUserId === block.user._id}
                      >
                        {unblockingUserId === block.user._id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Unblocking...
                          </>
                        ) : (
                          "Unblock"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Unblock Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock {selectedUser?.username}?</DialogTitle>
            <DialogDescription>
              You will start seeing messages from {selectedUser?.username} again, and they&apos;ll be able to send you messages.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={!!unblockingUserId}
            >
              Cancel
            </Button>
            <Button onClick={handleUnblock} disabled={!!unblockingUserId}>
              {unblockingUserId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Unblocking...
                </>
              ) : (
                "Unblock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
