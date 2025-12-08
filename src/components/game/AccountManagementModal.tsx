import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trash2, CreditCard, Shield, Edit2, Loader2, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { purchaseManager } from '@/lib/purchaseManager';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    username: string;
    coins: number;
    high_score: number;
    total_runs: number;
    total_distance: number;
    created_at?: string;
  } | null;
  onSignOut: () => void;
  onProfileUpdate: () => void;
}

export function AccountManagementModal({
  isOpen,
  onClose,
  profile,
  onSignOut,
  onProfileUpdate,
}: AccountManagementModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleUpdateUsername = async () => {
    if (!profile || !newUsername.trim()) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim() })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast.success('Username updated!');
      setIsEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update username');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile || deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
      // Delete all user data from related tables
      await supabase.from('vip_stats').delete().eq('profile_id', profile.id);
      await supabase.from('vip_daily_bonuses').delete().eq('profile_id', profile.id);
      await supabase.from('vip_subscriptions').delete().eq('profile_id', profile.id);
      await supabase.from('user_boss_rush_challenges').delete().eq('profile_id', profile.id);
      await supabase.from('user_daily_challenges').delete().eq('profile_id', profile.id);
      await supabase.from('user_battle_pass').delete().eq('profile_id', profile.id);
      await supabase.from('user_achievements').delete().eq('profile_id', profile.id);
      await supabase.from('owned_skins').delete().eq('profile_id', profile.id);
      await supabase.from('leaderboard_entries').delete().eq('profile_id', profile.id);
      await supabase.from('daily_rewards').delete().eq('profile_id', profile.id);
      await supabase.from('boss_rush_scores').delete().eq('profile_id', profile.id);
      await supabase.from('boss_defeats').delete().eq('profile_id', profile.id);
      
      // Delete friendships where user is requester or addressee
      await supabase.from('friendships').delete().eq('requester_id', profile.id);
      await supabase.from('friendships').delete().eq('addressee_id', profile.id);
      
      // Delete profile
      await supabase.from('profiles').delete().eq('id', profile.id);
      
      // Sign out
      await supabase.auth.signOut();
      
      toast.success('Account deleted successfully');
      onClose();
      onSignOut();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const result = await purchaseManager.restorePurchases();
      if (result.success) {
        toast.success('Purchases restored successfully!');
        onProfileUpdate();
      } else {
        toast.error(result.error || 'Failed to restore purchases');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  if (!profile) return null;

  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-card border-primary/30 p-0 max-h-[90vh]">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-pixel text-base text-primary flex items-center gap-2">
            <User className="w-5 h-5" />
            ACCOUNT
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mx-4" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="profile" className="font-pixel text-[9px]">Profile</TabsTrigger>
            <TabsTrigger value="purchases" className="font-pixel text-[9px]">Purchases</TabsTrigger>
            <TabsTrigger value="security" className="font-pixel text-[9px]">Security</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-4">
                {/* Avatar and Username */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-pixel text-2xl text-primary">
                      {profile.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Enter username"
                          className="h-8 text-sm"
                          maxLength={20}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={handleUpdateUsername}
                            disabled={updating || !newUsername.trim()}
                            className="h-7 text-xs"
                          >
                            {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setIsEditing(false); setNewUsername(profile.username); }}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-lg text-foreground">{profile.username}</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 rounded hover:bg-muted/50"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Member since {memberSince}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <h3 className="font-pixel text-xs text-muted-foreground">STATS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="High Score" value={profile.high_score.toLocaleString()} icon="🏆" />
                    <StatCard label="Total Coins" value={profile.coins.toLocaleString()} icon="🪙" />
                    <StatCard label="Total Runs" value={profile.total_runs.toLocaleString()} icon="🏃" />
                    <StatCard label="Distance" value={`${Math.floor(profile.total_distance / 1000)}km`} icon="📏" />
                  </div>
                </div>
              </TabsContent>

              {/* Purchases Tab */}
              <TabsContent value="purchases" className="mt-0 space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
                  <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-pixel text-sm text-foreground mb-1">Purchase History</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Manage your in-app purchases and subscriptions
                  </p>
                  
                  <Button
                    onClick={handleRestorePurchases}
                    disabled={restoring}
                    className="w-full font-pixel text-xs"
                    variant="outline"
                  >
                    {restoring ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {restoring ? 'Restoring...' : 'Restore Purchases'}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Purchases are managed through Google Play or App Store. Use restore to recover any missing purchases.
                </p>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0 space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-pixel text-sm text-foreground">Account Security</h3>
                      <p className="text-xs text-muted-foreground">Manage your account settings</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={onSignOut}
                    variant="outline"
                    className="w-full font-pixel text-xs mb-2"
                  >
                    Sign Out
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                      <h3 className="font-pixel text-sm text-destructive">Danger Zone</h3>
                      <p className="text-xs text-muted-foreground">Permanent actions</p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      className="w-full font-pixel text-xs"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-destructive">
                        ⚠️ This will permanently delete all your data including scores, achievements, skins, and coins.
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder='Type "DELETE" to confirm'
                        className="h-8 text-sm border-destructive/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleting || deleteConfirmText !== 'DELETE'}
                          variant="destructive"
                          className="flex-1 font-pixel text-xs"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                        </Button>
                        <Button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          variant="outline"
                          className="font-pixel text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="font-pixel text-sm text-foreground">{value}</p>
    </div>
  );
}