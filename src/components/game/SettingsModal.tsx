import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Volume2, Music, Shield, HelpCircle, User, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  isMusicMuted: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenAccount?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isMuted,
  isMusicMuted,
  onToggleMute,
  onToggleMusic,
  onOpenAccount,
}: SettingsModalProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleOpenAccount = () => {
    onClose();
    onOpenAccount?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <Settings className="w-5 h-5" />
            SETTINGS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sound Settings */}
          <div className="bg-background/50 rounded-lg p-4 space-y-3">
            <h3 className="font-pixel text-xs text-muted-foreground">SOUND</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="text-sm">Sound Effects</span>
              </div>
              <Switch
                checked={!isMuted}
                onCheckedChange={onToggleMute}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-secondary" />
                <span className="text-sm">Background Music</span>
              </div>
              <Switch
                checked={!isMusicMuted}
                onCheckedChange={onToggleMusic}
              />
            </div>
          </div>

          {/* Account & Links */}
          <div className="space-y-2">
            {onOpenAccount && (
              <Button
                variant="outline"
                className="w-full justify-start border-primary/30 text-sm"
                onClick={handleOpenAccount}
              >
                <User className="w-4 h-4 mr-3 text-primary" />
                Account Management
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start border-primary/30 text-sm"
              onClick={() => handleNavigate('/stats')}
            >
              <BarChart3 className="w-4 h-4 mr-3 text-accent" />
              Player Statistics
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start border-primary/30 text-sm"
              onClick={() => handleNavigate('/support')}
            >
              <HelpCircle className="w-4 h-4 mr-3 text-primary" />
              Help & Support
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start border-primary/30 text-sm"
              onClick={() => handleNavigate('/privacy')}
            >
              <Shield className="w-4 h-4 mr-3 text-secondary" />
              Privacy Policy
            </Button>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Pixel Runner v1.0.0</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
