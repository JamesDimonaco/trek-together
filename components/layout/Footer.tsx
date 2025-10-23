import Link from "next/link";
import { Mountain } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <Mountain className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                TrekTogether
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with fellow trekkers and hikers worldwide. Find adventure buddies in your city.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Contact: <a href="mailto:dimonaco.james@gmail.com" className="text-green-600 hover:underline">dimonaco.james@gmail.com</a>
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              © {currentYear} TrekTogether. All rights reserved.
            </p>
            <p className="text-xs">
              Made with ❤️ for the hiking community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
