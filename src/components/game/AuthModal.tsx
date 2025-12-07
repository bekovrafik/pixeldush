import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types/game';
import { z } from 'zod';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  profile: Profile | null;
  onSignUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignOut: () => Promise<{ error: Error | null }>;
}

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters');

export function AuthModal({
  isOpen,
  onClose,
  isLoggedIn,
  profile,
  onSignUp,
  onSignIn,
  onSignOut,
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      usernameSchema.parse(username);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await onSignUp(email, password, username);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! Check your email to confirm.');
      setEmail('');
      setPassword('');
      setUsername('');
    }
  };

  const handleSignIn = async () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await onSignIn(email, password);
    setLoading(false);

    if (error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      onClose();
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await onSignOut();
    setLoading(false);

    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out');
      onClose();
    }
  };

  if (isLoggedIn && profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
              <User className="w-5 h-5" />
              PROFILE
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="font-pixel text-sm text-foreground">{profile.username}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-pixel text-lg text-primary">{profile.high_score}</p>
                <p className="text-[10px] text-muted-foreground">HIGH SCORE</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-pixel text-lg text-accent">{profile.total_runs}</p>
                <p className="text-[10px] text-muted-foreground">RUNS</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-pixel text-lg text-secondary">{Math.floor(profile.total_distance / 1000)}k</p>
                <p className="text-[10px] text-muted-foreground">DISTANCE</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary">
            SIGN IN
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin" className="font-pixel text-xs">SIGN IN</TabsTrigger>
            <TabsTrigger value="signup" className="font-pixel text-xs">SIGN UP</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full game-button"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username" className="text-xs">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <Button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full game-button"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
