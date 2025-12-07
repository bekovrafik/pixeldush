import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-pixel text-xl sm:text-2xl text-primary">Privacy Policy</h1>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <p className="text-foreground font-medium">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">1. INFORMATION WE COLLECT</h2>
            <p>
              When you use Pixel Runner, we may collect the following information:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (email, username) when you create an account</li>
              <li>Gameplay data (scores, achievements, game progress)</li>
              <li>Device information for analytics and crash reporting</li>
              <li>Advertising identifiers for personalized ads</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">2. HOW WE USE YOUR INFORMATION</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and maintain the game services</li>
              <li>Save your game progress and achievements</li>
              <li>Display leaderboards and friend features</li>
              <li>Show relevant advertisements</li>
              <li>Improve our game and user experience</li>
              <li>Communicate important updates</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">3. ADVERTISING</h2>
            <p>
              We use Google AdMob to display advertisements in our app. AdMob may collect and use data about your device and app usage to show personalized ads. You can opt out of personalized advertising through your device settings.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">4. DATA SHARING</h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Service providers who assist in operating our game</li>
              <li>Analytics partners to understand app usage</li>
              <li>Advertising networks to display ads</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">5. DATA SECURITY</h2>
            <p>
              We implement appropriate security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">6. CHILDREN'S PRIVACY</h2>
            <p>
              Our game is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">7. YOUR RIGHTS</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of personalized advertising</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">8. CHANGES TO THIS POLICY</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-pixel text-sm text-primary mb-2">9. CONTACT US</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2 text-primary font-medium">
              support-game@pilllens.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
