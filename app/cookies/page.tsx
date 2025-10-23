import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | TrekTogether",
  description: "Cookie Policy for TrekTogether - How we use cookies and tracking technologies",
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Cookie Policy</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose dark:prose-invert max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They help
              websites remember your preferences, authenticate you, and provide a better user experience.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. How We Use Cookies</h2>
            <p>
              TrekTogether uses cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences (theme, language)</li>
              <li>Maintain your session as a guest user</li>
              <li>Understand how you use our Service to improve it</li>
              <li>Provide security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Types of Cookies We Use</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">3.1 Essential Cookies (Required)</h3>
            <p className="mb-3">
              These cookies are necessary for the Service to function and cannot be disabled.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <div>
                <strong>Authentication Cookies (Clerk)</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>Purpose: Keep you signed in and manage your session</li>
                  <li>Duration: Session or up to 30 days (if &quot;Remember me&quot; is selected)</li>
                  <li>Cookie names: <code className="text-xs">__clerk_*</code>, <code className="text-xs">__session</code></li>
                </ul>
              </div>

              <div>
                <strong>Session Cookies</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>Purpose: Identify guest users and maintain state</li>
                  <li>Duration: Session or up to 24 hours</li>
                  <li>Cookie names: <code className="text-xs">session_id</code></li>
                </ul>
              </div>

              <div>
                <strong>Security Cookies</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>Purpose: Prevent CSRF attacks and ensure secure connections</li>
                  <li>Duration: Session</li>
                  <li>Cookie names: <code className="text-xs">csrf_token</code></li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2">3.2 Functional Cookies (Optional)</h3>
            <p className="mb-3">
              These cookies enhance functionality and personalization but are not strictly necessary.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <div>
                <strong>Preference Cookies</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>Purpose: Remember your theme preference (light/dark mode)</li>
                  <li>Duration: 1 year</li>
                  <li>Cookie names: <code className="text-xs">theme</code></li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2">3.3 Analytics Cookies (Optional)</h3>
            <p className="mb-3">
              These cookies help us understand how users interact with the Service.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <div>
                <strong>Vercel Analytics</strong>
                <ul className="list-disc pl-6 mt-1">
                  <li>Purpose: Understand page views and user behavior</li>
                  <li>Duration: Up to 2 years</li>
                  <li>Cookie names: <code className="text-xs">__vercel_*</code></li>
                  <li>Privacy: Anonymized data, GDPR compliant</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Cookies</h2>
            <p className="mb-3">
              Some cookies are set by third-party services we use:
            </p>

            <div className="space-y-3">
              <div>
                <strong>Clerk (Authentication)</strong>
                <p className="text-sm">
                  Clerk sets cookies to manage authentication and security.
                  <br />
                  <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    Clerk Privacy Policy
                  </a>
                </p>
              </div>

              <div>
                <strong>Google Maps</strong>
                <p className="text-sm">
                  Google may set cookies when using the geolocation feature.
                  <br />
                  <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    Google Cookies Policy
                  </a>
                </p>
              </div>

              <div>
                <strong>Vercel (Hosting)</strong>
                <p className="text-sm">
                  Vercel may set cookies for analytics and performance monitoring.
                  <br />
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    Vercel Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. How to Manage Cookies</h2>

            <h3 className="text-lg font-semibold mt-4 mb-2">5.1 Browser Settings</h3>
            <p className="mb-3">
              Most browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (this will prevent you from using the Service)</li>
              <li>Clear cookies when you close your browser</li>
            </ul>

            <p className="mt-3 mb-2">Learn how to manage cookies in popular browsers:</p>
            <ul className="list-none space-y-1">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">5.2 Impact of Blocking Cookies</h3>
            <p>
              Please note that blocking essential cookies will prevent you from using TrekTogether.
              Blocking functional or analytics cookies may limit certain features but the core Service will still work.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Do Not Track (DNT)</h2>
            <p>
              Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. Because there is no common understanding
              of how to interpret DNT signals, we do not currently respond to DNT browser signals. We will
              update this policy if industry standards are established.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Mobile Devices</h2>
            <p>
              Mobile devices may use advertising identifiers instead of cookies. You can manage these through
              your device settings:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>iOS:</strong> Settings → Privacy → Advertising → Limit Ad Tracking</li>
              <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of significant changes
              by posting a notice on the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="mb-3">
              If you have questions about our use of cookies, please contact us:
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
            <h2 className="text-xl font-semibold mb-3">10. Additional Resources</h2>
            <ul className="list-none space-y-1">
              <li>
                <Link href="/privacy" className="text-green-600 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-green-600 hover:underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
