import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Bug, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Support() {
  const navigate = useNavigate();
  const supportEmail = 'support-game@pilllens.com';

  const handleEmailClick = () => {
    window.location.href = `mailto:${supportEmail}`;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      toast.success('Email copied to clipboard!');
    } catch {
      toast.error('Failed to copy email');
    }
  };

  const faqItems = [
    {
      question: 'How do I save my progress?',
      answer: 'Create an account to save your progress, scores, and achievements. Your data will sync across devices.',
    },
    {
      question: 'How do I get more coins?',
      answer: 'Collect coins during gameplay, complete achievements, claim daily rewards, or watch rewarded ads.',
    },
    {
      question: 'How do I unlock new worlds?',
      answer: 'Run further to unlock new worlds! Each world unlocks at different distance milestones.',
    },
    {
      question: 'How do I add friends?',
      answer: 'Go to the Friends menu and enter your friend\'s username to send a friend request.',
    },
    {
      question: 'Can I play offline?',
      answer: 'Yes! The game works offline, but online features like leaderboards require an internet connection.',
    },
  ];

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
          <HelpCircle className="w-8 h-8 text-primary" />
          <h1 className="font-pixel text-xl sm:text-2xl text-primary">Support</h1>
        </div>

        {/* Contact Section */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            CONTACT US
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Have a question, found a bug, or want to share feedback? We'd love to hear from you!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleEmailClick} className="game-button flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline" onClick={handleCopyEmail} className="flex-1 border-primary/50">
              Copy Email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {supportEmail}
          </p>
        </div>

        {/* Quick Help */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="font-pixel text-sm text-primary mb-4">REPORT AN ISSUE</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = `mailto:${supportEmail}?subject=Bug Report - Pixel Runner`}
              className="border-destructive/50 hover:bg-destructive/20 text-xs"
            >
              <Bug className="w-4 h-4 mr-2 text-destructive" />
              Report Bug
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = `mailto:${supportEmail}?subject=Feature Request - Pixel Runner`}
              className="border-accent/50 hover:bg-accent/20 text-xs"
            >
              <Lightbulb className="w-4 h-4 mr-2 text-accent" />
              Suggest Feature
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium text-sm text-foreground mb-2">
                  {item.question}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Pixel Runner v1.0.0</p>
          <p className="mt-1">© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
