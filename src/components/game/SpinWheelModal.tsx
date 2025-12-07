import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCw, Coins, Sparkles, Star, Zap, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  profileId: string | null;
  currentCoins: number;
  onSpinComplete: () => void;
  onOpenAuth: () => void;
}

interface WheelSegment {
  id: string;
  label: string;
  value: number;
  type: 'coins' | 'multiplier' | 'jackpot' | 'lose';
  color: string;
  probability: number;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: '1', label: '10', value: 10, type: 'coins', color: '#4ECDC4', probability: 25 },
  { id: '2', label: '25', value: 25, type: 'coins', color: '#45B7D1', probability: 20 },
  { id: '3', label: '2x', value: 2, type: 'multiplier', color: '#96CEB4', probability: 15 },
  { id: '4', label: '50', value: 50, type: 'coins', color: '#FFEAA7', probability: 12 },
  { id: '5', label: '💀', value: 0, type: 'lose', color: '#FF6B6B', probability: 10 },
  { id: '6', label: '75', value: 75, type: 'coins', color: '#DDA0DD', probability: 8 },
  { id: '7', label: '3x', value: 3, type: 'multiplier', color: '#98D8C8', probability: 5 },
  { id: '8', label: '🎰', value: 200, type: 'jackpot', color: '#FFD700', probability: 5 },
];

const SPIN_COST = 50;

export function SpinWheelModal({
  isOpen,
  onClose,
  isLoggedIn,
  profileId,
  currentCoins,
  onSpinComplete,
  onOpenAuth,
}: SpinWheelModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getWeightedRandomSegment = (): WheelSegment => {
    const totalProbability = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const segment of WHEEL_SEGMENTS) {
      random -= segment.probability;
      if (random <= 0) return segment;
    }
    return WHEEL_SEGMENTS[0];
  };

  const handleSpin = async () => {
    if (!isLoggedIn || !profileId) {
      onOpenAuth();
      return;
    }

    if (currentCoins < SPIN_COST) {
      toast.error(`Not enough coins! You need ${SPIN_COST} coins to spin.`);
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Deduct spin cost
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: currentCoins - SPIN_COST })
      .eq('id', profileId);

    if (updateError) {
      toast.error('Failed to spin. Please try again.');
      setIsSpinning(false);
      return;
    }

    // Get winning segment
    const winningSegment = getWeightedRandomSegment();
    const segmentIndex = WHEEL_SEGMENTS.findIndex(s => s.id === winningSegment.id);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    
    // Calculate rotation to land on winning segment
    const extraSpins = 5; // Number of full rotations
    const targetAngle = 360 - (segmentIndex * segmentAngle) - (segmentAngle / 2);
    const totalRotation = rotation + (extraSpins * 360) + targetAngle + (Math.random() * 20 - 10);
    
    setRotation(totalRotation);

    // Wait for spin to complete
    setTimeout(async () => {
      setResult(winningSegment);
      setIsSpinning(false);

      if (winningSegment.type === 'lose') {
        toast.error('💀 Better luck next time!');
      } else {
        let reward = 0;
        let message = '';

        if (winningSegment.type === 'coins') {
          reward = winningSegment.value;
          message = `🎉 You won ${reward} coins!`;
        } else if (winningSegment.type === 'multiplier') {
          reward = SPIN_COST * winningSegment.value;
          message = `⚡ ${winningSegment.value}x Multiplier! You won ${reward} coins!`;
        } else if (winningSegment.type === 'jackpot') {
          reward = winningSegment.value;
          message = `🎰 JACKPOT! You won ${reward} coins!`;
        }

        if (reward > 0) {
          // Add winnings to profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', profileId)
            .single();

          if (profileData) {
            await supabase
              .from('profiles')
              .update({ coins: profileData.coins + reward })
              .eq('id', profileId);
          }

          toast.success(message);
        }
      }

      onSpinComplete();
    }, 5000);
  };

  const canSpin = isLoggedIn && currentCoins >= SPIN_COST && !isSpinning;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-4 sm:p-6 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-base sm:text-lg text-primary flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              SPIN WHEEL
            </div>
            {isLoggedIn && (
              <span className="text-[10px] sm:text-xs text-accent font-pixel">
                {currentCoins} 🪙
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center">
          {/* Wheel Container */}
          <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-4">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-accent drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-4 border-accent/50 overflow-hidden shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const segmentAngle = 360 / WHEEL_SEGMENTS.length;
                  const startAngle = index * segmentAngle - 90;
                  const endAngle = startAngle + segmentAngle;
                  
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);
                  
                  const largeArc = segmentAngle > 180 ? 1 : 0;
                  
                  const textAngle = startAngle + segmentAngle / 2;
                  const textRad = (textAngle * Math.PI) / 180;
                  const textX = 50 + 32 * Math.cos(textRad);
                  const textY = 50 + 32 * Math.sin(textRad);

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={segment.color}
                        stroke="#1a1a2e"
                        strokeWidth="0.5"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="#1a1a2e"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      >
                        {segment.label}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="50" cy="50" r="8" fill="#1a1a2e" stroke="#4ECDC4" strokeWidth="1" />
                <circle cx="50" cy="50" r="4" fill="#4ECDC4" />
              </svg>
            </div>
          </div>

          {/* Result Display */}
          {result && !isSpinning && (
            <div className={`mb-4 p-3 rounded-lg text-center animate-scale-in ${
              result.type === 'lose' ? 'bg-destructive/20' : 'bg-accent/20'
            }`}>
              <p className="font-pixel text-sm text-foreground">
                {result.type === 'lose' ? '💀 No luck!' : 
                 result.type === 'jackpot' ? `🎰 JACKPOT: ${result.value} coins!` :
                 result.type === 'multiplier' ? `⚡ ${result.value}x = ${SPIN_COST * result.value} coins!` :
                 `🎉 Won ${result.value} coins!`}
              </p>
            </div>
          )}

          {/* Spin Cost */}
          <div className="text-center mb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Cost per spin: <span className="text-accent font-pixel">{SPIN_COST} 🪙</span>
            </p>
          </div>

          {/* Spin Button */}
          {!isLoggedIn ? (
            <Button onClick={onOpenAuth} className="game-button w-full max-w-xs">
              SIGN IN TO SPIN
            </Button>
          ) : (
            <Button
              onClick={handleSpin}
              disabled={!canSpin}
              className={`game-button w-full max-w-xs ${isSpinning ? 'animate-pulse' : ''}`}
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                  SPINNING...
                </>
              ) : currentCoins < SPIN_COST ? (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  NOT ENOUGH COINS
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  SPIN FOR {SPIN_COST} 🪙
                </>
              )}
            </Button>
          )}

          {/* Prize Legend */}
          <div className="mt-4 grid grid-cols-4 gap-2 w-full">
            {[
              { icon: Coins, label: 'Coins', color: 'text-accent' },
              { icon: Zap, label: 'Multi', color: 'text-yellow-400' },
              { icon: Star, label: 'Jackpot', color: 'text-amber-400' },
              { icon: Gift, label: 'Bonus', color: 'text-purple-400' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-[8px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
