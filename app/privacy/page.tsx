import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | TrekTogether",
  description: "Privacy Policy for TrekTogether - How we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose dark:prose-invert max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              TrekTogether (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you use our web application.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Username, email address (when you create an authenticated account)</li>
              <li><strong>Profile Information:</strong> Avatar, bio, WhatsApp number (optional), date of birth (optional)</li>
              <li><strong>Content:</strong> Messages sent in city chats and direct messages</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Location Data:</strong> Approximate location (city-level) via browser geolocation and Google Maps API for city detection</li>
              <li><strong>Session Data:</strong> Session identifiers for guest users, timestamps of activity</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, interaction with the application</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Cookies and Tracking</h3>
            <p>
              We use cookies and similar tracking technologies to maintain your session and improve your experience.
              See our <Link href="/cookies" className="text-green-600 hover:underline">Cookie Policy</Link> for details.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To enable communication between users in city chats and direct messages</li>
              <li>To personalize your experience and display relevant content</li>
              <li>To send email notifications (only if you opt-in)</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
              <li>To comply with legal obligations</li>
              <li>To improve and develop new features</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services that may collect and process your data:</p>

            <div className="space-y-3">
              <div>
                <strong>Clerk (Authentication):</strong> Manages user authentication and account security.
                <br />
                <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                  Clerk Privacy Policy
                </a>
              </div>

              <div>
                <strong>Convex (Database):</strong> Stores all application data including messages, user profiles, and city information.
                <br />
                <a href="https://www.convex.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                  Convex Privacy Policy
                </a>
              </div>

              <div>
                <strong>Google Maps API:</strong> Provides geolocation and reverse geocoding services.
                <br />
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                  Google Privacy Policy
                </a>
              </div>

              <div>
                <strong>Vercel (Hosting):</strong> Hosts our application and may collect analytics data.
                <br />
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                  Vercel Privacy Policy
                </a>
              </div>

              <div>
                <strong>Resend (Email Delivery):</strong> Delivers email notifications when enabled.
                <br />
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                  Resend Privacy Policy
                </a>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing and Disclosure</h2>
            <p className="mb-3">We do not sell your personal information. We may share your data only in these circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Public Information:</strong> Messages in city chats are visible to all users in that city</li>
              <li><strong>Profile Information:</strong> Your username, avatar, and bio are visible to other authenticated users</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Service Providers:</strong> With third-party services listed above that help us operate</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Your Rights (GDPR & CCPA)</h2>
            <p className="mb-3">Depending on your location, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from email notifications</li>
              <li><strong>Object:</strong> Object to processing of your personal data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:dimonaco.james@gmail.com" className="text-green-600 hover:underline">
                dimonaco.james@gmail.com
              </a>
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services.
              When you delete your account, we will delete or anonymize your personal information within 30 days,
              except where we must retain it for legal obligations.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">8. Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your data.
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for users under 18 years of age. We do not knowingly collect information
              from children under 18. If you become aware that a child has provided us with personal information,
              please contact us.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have different data protection laws. By using our service, you consent to such transfers.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="mb-3">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-1">
              <li>
                Email:{" "}
                <a href="mailto:dimonaco.james@gmail.com" className="text-green-600 hover:underline">
                  dimonaco.james@gmail.com
                </a>
              </li>
              <li>
                Website:{" "}
                <Link href="/" className="text-green-600 hover:underline">
                  trektogether.app
                </Link>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
