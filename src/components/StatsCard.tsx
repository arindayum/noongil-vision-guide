import React, { useState } from 'react';
import { Eye, FileText, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsData } from '@/hooks/useAnalytics';

interface StatsCardProps {
  data: AnalyticsData;
}

const formatDate = (ts: number | null): string => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-2xl font-bold tabular-nums">{value}</span>
  </div>
);

const StatsCard: React.FC<StatsCardProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const total = data.objectDetections + data.textReads;

  if (total === 0 && data.totalSessions <= 1) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          aria-label="Toggle usage statistics"
        >
          <CardTitle className="text-base flex items-center gap-2">
            📊 Usage Statistics
          </CardTitle>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 divide-y divide-border">
          <StatItem
            icon={<Eye className="h-4 w-4 text-primary" />}
            label="Object detections"
            value={data.objectDetections}
            color="bg-primary/10"
          />
          <StatItem
            icon={<FileText className="h-4 w-4 text-primary" />}
            label="Text reads"
            value={data.textReads}
            color="bg-primary/10"
          />
          <StatItem
            icon={<ShieldAlert className="h-4 w-4 text-accent" />}
            label="Hazards detected"
            value={data.hazardDetections}
            color="bg-accent/10"
          />
          <StatItem
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            label="Emergency activations"
            value={data.emergencyActivations}
            color="bg-destructive/10"
          />


          <div className="pt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total sessions</span>
              <span className="font-medium">{data.totalSessions}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>First used</span>
              <span className="font-medium">{formatDate(data.firstUsed)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Last used</span>
              <span className="font-medium">{formatDate(data.lastUsed)}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default StatsCard;
