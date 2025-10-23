import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface DMNotificationEmailProps {
  senderUsername: string;
  messagePreview: string;
  conversationUrl: string;
  recipientUsername: string;
}

export default function DMNotificationEmail({
  senderUsername = "Adventurer",
  messagePreview = "Hey! Want to go trekking this weekend?",
  conversationUrl = "https://trektogether.app/messages",
  recipientUsername = "Trekker",
}: DMNotificationEmailProps) {
  const previewText = `New message from ${senderUsername}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-lg bg-white p-8 shadow-lg">
            {/* Header */}
            <Section className="mb-8">
              <Heading className="m-0 text-center text-3xl font-bold text-green-600">
                🏔️ TrekTogether
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="mb-6">
              <Heading className="mb-4 text-xl font-semibold text-gray-900">
                Hi {recipientUsername}!
              </Heading>
              <Text className="mb-4 text-base text-gray-700">
                You have a new message from <strong>{senderUsername}</strong>:
              </Text>

              {/* Message Preview */}
              <Section className="my-6 rounded-lg border-l-4 border-green-500 bg-gray-50 p-4">
                <Text className="m-0 italic text-gray-800">
                  "{messagePreview}"
                </Text>
              </Section>

              <Text className="mb-6 text-base text-gray-700">
                Click the button below to read and reply:
              </Text>

              {/* CTA Button */}
              <Section className="text-center">
                <Button
                  href={conversationUrl}
                  className="inline-block rounded-lg bg-green-600 px-6 py-3 text-center text-base font-semibold text-white no-underline hover:bg-green-700"
                >
                  View Message
                </Button>
              </Section>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="mb-2 text-sm text-gray-600">
                Connect with fellow trekkers around the world
              </Text>
              <Text className="mb-4 text-xs text-gray-500">
                <Link
                  href={`${conversationUrl.split("/messages")[0]}/settings`}
                  className="text-green-600 underline"
                >
                  Manage notification preferences
                </Link>
              </Text>
              <Text className="text-xs text-gray-500">
                TrekTogether - Find your adventure buddies
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
