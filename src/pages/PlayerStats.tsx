import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Coins, Calendar, TrendingUp, Award, Footprints } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface GameRun {
  id: string;
  score: number;
  distance: number;
  created_at: string;
}

export default function PlayerStats() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [gameHistory, setGameHistory] = useState<GameRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchGameHistory();
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchGameHistory = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id, score, distance, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setGameHistory(data);
    }
    setLoading(false);
  };

  // Calculate stats
  const totalGames = gameHistory.length;
  const totalScore = gameHistory.reduce((sum, g) => sum + g.score, 0);
  const totalDistance = gameHistory.reduce((sum, g) => sum + g.distance, 0);
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const avgDistance = totalGames > 0 ? Math.round(totalDistance / totalGames) : 0;
  const bestScore = Math.max(0, ...gameHistory.map(g => g.score));
  const bestDistance = Math.max(0, ...gameHistory.map(g => g.distance));

  // Prepare chart data (last 10 games, reversed for chronological order)
  const chartData = gameHistory.slice(0, 10).reverse().map((g, i) => ({
    game: i + 1,
    score: g.score,
    distance: g.distance,
    date: new Date(g.created_at).toLocaleDateString(),
  }));

  // Score distribution for pie chart
  const scoreRanges = [
    { name: '0-100', min: 0, max: 100, color: 'hsl(var(--muted))' },
    { name: '100-500', min: 100, max: 500, color: 'hsl(var(--secondary))' },
    { name: '500-1000', min: 500, max: 1000, color: 'hsl(var(--accent))' },
    { name: '1000+', min: 1000, max: Infinity, color: 'hsl(var(--primary))' },
  ];

  const scoreDistribution = scoreRanges.map(range => ({
    name: range.name,
    value: gameHistory.filter(g => g.score >= range.min && g.score < range.max).length,
    color: range.color,
  })).filter(d => d.value > 0);

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-pixel text-lg text-primary mb-2">PLAYER STATS</h1>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Sign in to track your gameplay history and statistics!
        </p>
        <Button onClick={() => navigate('/')} className="game-button">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-pixel text-xl sm:text-2xl text-primary">PLAYER STATS</h1>
            <p className="text-xs text-muted-foreground">{profile?.username || 'Player'}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="font-pixel text-sm text-muted-foreground animate-pulse">LOADING...</div>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="BEST SCORE" value={bestScore.toLocaleString()} />
              <StatCard icon={<Footprints className="w-5 h-5 text-secondary" />} label="BEST DISTANCE" value={`${bestDistance.toLocaleString()}m`} />
              <StatCard icon={<Target className="w-5 h-5 text-accent" />} label="AVG SCORE" value={avgScore.toLocaleString()} />
              <StatCard icon={<Calendar className="w-5 h-5 text-primary" />} label="TOTAL GAMES" value={totalGames.toString()} />
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={<Coins className="w-5 h-5 text-accent" />} label="COINS" value={(profile?.coins || 0).toLocaleString()} />
              <StatCard icon={<Award className="w-5 h-5 text-primary" />} label="HIGH SCORE" value={(profile?.high_score || 0).toLocaleString()} />
              <StatCard icon={<Footprints className="w-5 h-5 text-secondary" />} label="TOTAL DISTANCE" value={`${((profile?.total_distance || 0) / 1000).toFixed(1)}km`} />
              <StatCard icon={<Target className="w-5 h-5 text-primary" />} label="TOTAL RUNS" value={(profile?.total_runs || 0).toString()} />
            </div>

            {/* Score History Chart */}
            {chartData.length > 1 && (
              <div className="bg-card rounded-lg border border-border p-4 mb-6">
                <h2 className="font-pixel text-sm text-primary mb-4">SCORE HISTORY</h2>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="game" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelFormatter={(value) => `Game ${value}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Distance Chart */}
            {chartData.length > 1 && (
              <div className="bg-card rounded-lg border border-border p-4 mb-6">
                <h2 className="font-pixel text-sm text-secondary mb-4">DISTANCE HISTORY</h2>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="game" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        labelFormatter={(value) => `Game ${value}`}
                        formatter={(value) => [`${value}m`, 'Distance']}
                      />
                      <Bar dataKey="distance" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Score Distribution */}
            {scoreDistribution.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="font-pixel text-sm text-accent mb-4">SCORE DISTRIBUTION</h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scoreDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`${value} games`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {scoreDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {totalGames === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="font-pixel text-sm text-muted-foreground">NO GAMES PLAYED YET</p>
                <p className="text-xs text-muted-foreground mt-2">Start playing to see your stats!</p>
                <Button onClick={() => navigate('/')} className="game-button mt-4">
                  Play Now
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-3 sm:p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="font-pixel text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="font-pixel text-sm sm:text-base text-foreground">{value}</p>
    </div>
  );
}
