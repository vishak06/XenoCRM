"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Layers, Users, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  ruleDefinition: unknown;
  matchCount: number;
  englishDescription: string;
  createdAt: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
      toast.error("Failed to load segments");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (segment: Segment) => {
    if (explanations[segment.id]) return;
    setExplaining(segment.id);
    try {
      const res = await fetch("/api/ai/explain-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleDefinition: segment.ruleDefinition }),
      });
      const data = await res.json();
      if (data.explanation) {
        setExplanations((prev) => ({ ...prev, [segment.id]: data.explanation }));
      } else {
        toast.error("Failed to get AI explanation");
      }
    } catch {
      toast.error("Failed to get AI explanation");
    } finally {
      setExplaining(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground mt-1">
            {segments.length} saved segments with live match counts
          </p>
        </div>
      </div>

      {segments.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-center">
              No segments yet. Create one through the AI Campaign builder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((segment, index) => (
            <Card
              key={segment.id}
              className="border-border/50 hover:border-border transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    {segment.matchCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {segment.description && (
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                )}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rule Summary</p>
                  <p className="text-sm">{segment.englishDescription}</p>
                </div>

                {/* AI Explanation */}
                {explanations[segment.id] ? (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Explanation
                    </p>
                    <p className="text-sm text-muted-foreground">{explanations[segment.id]}</p>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => handleExplain(segment)}
                    disabled={explaining === segment.id}
                  >
                    {explaining === segment.id ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Explaining...</>
                    ) : (
                      <><Sparkles className="w-3 h-3 mr-1" /> Explain with AI</>
                    )}
                  </Button>
                )}

                <p className="text-[10px] text-muted-foreground/60">
                  Created {new Date(segment.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
