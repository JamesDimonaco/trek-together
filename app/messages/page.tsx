import { Metadata } from "next";
import MessagesClient from "@/components/messages/MessagesClient";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your private conversations with other trekkers",
};

export default function MessagesPage() {
  return <MessagesClient />;
}
