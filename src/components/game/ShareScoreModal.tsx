import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  distance: number;
  username?: string;
}

export function ShareScoreModal({ isOpen, onClose, score, distance, username }: ShareScoreModalProps) {
  const shareText = `🎮 I scored ${score.toLocaleString()} points and ran ${distance.toLocaleString()}m in Pixel Runner! ${username ? `- ${username}` : ''}\n\nCan you beat my score? 🏃‍♂️💨`;
  
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pixel Runner - My Score!',
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
        onClose();
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
    onClose();
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            SHARE SCORE
          </DialogTitle>
        </DialogHeader>

        <div className="bg-background/50 rounded-lg p-4 text-center mb-4">
          <p className="font-pixel text-2xl text-primary neon-glow mb-1">
            {score.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {distance.toLocaleString()}m distance
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="game-button col-span-2 text-xs"
            >
              <Share2 className="w-4 h-4 mr-2" />
              SHARE
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleTwitterShare}
            className="border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/20 text-xs"
          >
            <Twitter className="w-4 h-4 mr-2 text-[#1DA1F2]" />
            TWITTER
          </Button>

          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            className="border-[#25D366]/50 hover:bg-[#25D366]/20 text-xs"
          >
            <MessageCircle className="w-4 h-4 mr-2 text-[#25D366]" />
            WHATSAPP
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyToClipboard}
            className="col-span-2 border-primary/50 text-xs"
          >
            <Copy className="w-4 h-4 mr-2" />
            COPY TO CLIPBOARD
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
