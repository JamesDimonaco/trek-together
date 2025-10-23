import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | TrekTogether",
  description: "Terms of Service for TrekTogether - Rules and guidelines for using our platform",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose dark:prose-invert max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TrekTogether (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p>
              TrekTogether is a web application that connects travelers and outdoor enthusiasts in specific cities
              through group chats and direct messaging. The Service allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participate in city-based group chats (available to all users including guests)</li>
              <li>Create authenticated accounts for enhanced features</li>
              <li>Send direct messages to other authenticated users</li>
              <li>Create and manage user profiles</li>
              <li>Track cities visited</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old to use this Service. By using the Service, you represent and warrant
              that you are at least 18 years of age and have the legal capacity to enter into these Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Guest Access</h3>
            <p>
              You may use city group chats as a guest without creating an account. Guest access is provided
              for your convenience but has limited functionality.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Account Registration</h3>
            <p>
              To access full features including direct messaging and profiles, you must create an authenticated account.
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Account Termination</h3>
            <p>
              You may delete your account at any time through your settings. We may suspend or terminate
              your account if you violate these Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use Policy</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Harass, abuse, threaten, or intimidate other users</li>
              <li>Post content that is hateful, discriminatory, or promotes violence</li>
              <li>Share spam, advertising, or promotional content without permission</li>
              <li>Impersonate another person or misrepresent your affiliation</li>
              <li>Share explicit sexual content or solicit sexual services</li>
              <li>Attempt to gain unauthorized access to the Service or other accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Collect or harvest user data without consent</li>
              <li>Use automated systems (bots) to access the Service</li>
              <li>Post content that infringes intellectual property rights</li>
              <li>Share malware, viruses, or malicious code</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Content and Conduct</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.1 Your Content</h3>
            <p>
              You retain ownership of content you post (&quot;User Content&quot;). By posting User Content, you grant
              us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content
              in connection with the Service.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.2 Content Moderation</h3>
            <p>
              We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable.
              However, we are not obligated to monitor or review all content.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">6.3 Reporting Violations</h3>
            <p>
              If you encounter content or behavior that violates these Terms, please report it to{" "}
              <a href="mailto:dimonaco.james@gmail.com" className="text-green-600 hover:underline">
                dimonaco.james@gmail.com
              </a>
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Safety and Meetings</h2>
            <p className="mb-3 font-semibold text-yellow-600 dark:text-yellow-500">
              IMPORTANT SAFETY NOTICE:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>TrekTogether facilitates online connections only. We do not organize or supervise in-person meetings.</li>
              <li>If you choose to meet someone in person, you do so at your own risk.</li>
              <li>Always meet in public places and inform someone of your plans.</li>
              <li>We are not responsible for any interactions, meetings, or activities that occur outside the platform.</li>
              <li>Trust your instincts and prioritize your safety.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and functionality, is owned by TrekTogether and protected
              by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute,
              or create derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services (Clerk, Convex, Google Maps, etc.). Your use of
              these services is subject to their respective terms and policies. We are not responsible for
              third-party services.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">10. Disclaimers</h2>
            <p className="mb-3 uppercase font-semibold">
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not guarantee the Service will be uninterrupted, secure, or error-free</li>
              <li>We do not verify the identity or background of users</li>
              <li>We are not responsible for user conduct or content</li>
              <li>We do not guarantee the accuracy of user-provided information</li>
              <li>We are not liable for any harm resulting from your use of the Service</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
            <p className="mb-3 uppercase font-semibold">
              To the fullest extent permitted by law:
            </p>
            <p>
              TrekTogether, its owners, employees, and affiliates shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of profits, data, use,
              or goodwill, arising from your use of the Service.
            </p>
            <p className="mt-3">
              Our total liability shall not exceed the amount you paid us in the past 12 months, or $100,
              whichever is greater.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless TrekTogether from any claims, damages, losses, liabilities,
              and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">13. Dispute Resolution</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">13.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
              in which TrekTogether operates, without regard to conflict of law principles.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">13.2 Informal Resolution</h3>
            <p>
              Before filing a claim, you agree to contact us at{" "}
              <a href="mailto:dimonaco.james@gmail.com" className="text-green-600 hover:underline">
                dimonaco.james@gmail.com
              </a>{" "}
              to attempt to resolve the dispute informally.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">13.3 Arbitration</h3>
            <p>
              If informal resolution fails, disputes shall be resolved through binding arbitration rather than
              in court, except where prohibited by law.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant changes
              by posting a notice on the Service or sending an email. Continued use after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall
              remain in full force and effect.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">16. Contact Information</h2>
            <p className="mb-3">
              If you have questions about these Terms, please contact us:
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

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">17. Additional Resources</h2>
            <ul className="list-none space-y-1">
              <li>
                <Link href="/privacy" className="text-green-600 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-green-600 hover:underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
