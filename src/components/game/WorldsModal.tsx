import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Check, Lock } from 'lucide-react';
import { WorldTheme, WORLD_CONFIGS } from '@/types/game';

interface WorldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorld: WorldTheme;
  totalDistance: number;
  onSelectWorld: (world: WorldTheme) => void;
}

export function WorldsModal({ isOpen, onClose, currentWorld, totalDistance, onSelectWorld }: WorldsModalProps) {
  const worlds = Object.values(WORLD_CONFIGS);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md bg-card border-secondary/30 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm sm:text-lg text-secondary flex items-center gap-2">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            WORLDS
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            {worlds.map((world) => {
              const isUnlocked = totalDistance >= world.unlockDistance;
              const isSelected = currentWorld === world.id;
              
              return (
                <div
                  key={world.id}
                  className={`relative overflow-hidden rounded-lg border transition-all ${
                    isSelected ? 'border-secondary ring-2 ring-secondary' :
                    isUnlocked ? 'border-border hover:border-secondary/50 cursor-pointer' :
                    'border-border/30 opacity-50'
                  }`}
                  onClick={() => isUnlocked && onSelectWorld(world.id)}
                >
                  {/* Preview gradient */}
                  <div 
                    className="h-16 sm:h-20"
                    style={{
                      background: `linear-gradient(to bottom, ${world.colors.sky.join(', ')})`,
                    }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-6 sm:h-8"
                      style={{ backgroundColor: world.colors.ground }}
                    />
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-card/90">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-pixel text-[10px] sm:text-xs text-foreground">{world.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                          {world.unlockDistance === 0 ? 'Available' : `Unlock at ${world.unlockDistance.toLocaleString()}m`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />}
                        {!isUnlocked && <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="mt-2 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Total distance: <span className="text-secondary font-pixel">{totalDistance.toLocaleString()}m</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
