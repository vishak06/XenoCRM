"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Layers, Users, Sparkles, Loader2, Plus, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [combinator, setCombinator] = useState("AND");
  const [conditions, setConditions] = useState([{ field: "totalSpend", operator: "greaterThan", value: "" }]);

  const handleAddSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      let finalRule;
      if (activeTab === "ai") {
        const aiRes = await fetch("/api/ai/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: aiPrompt }),
        });
        if (!aiRes.ok) throw new Error("Failed to parse AI intent");
        const aiData = await aiRes.json();
        finalRule = aiData.segment;
      } else {
        finalRule = {
          combinator,
          conditions: conditions.map(c => ({
             ...c, 
             value: isNaN(Number(c.value)) ? c.value : Number(c.value) 
          }))
        };
      }

      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc,
          ruleDefinition: finalRule,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create segment");
      }
      toast.success("Segment created successfully");
      setIsAddOpen(false);
      setSegmentName("");
      setSegmentDesc("");
      setAiPrompt("");
      setConditions([{ field: "totalSpend", operator: "greaterThan", value: "" }]);
      fetchSegments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create segment");
    } finally {
      setIsAdding(false);
    }
  };

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
            <Card key={i}>
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
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2"><Plus className="w-4 h-4" /> Create Segment</Button>} />
          <DialogContent className="sm:max-w-[550px] p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Create Segment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSegment} className="space-y-6 pt-2">
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">Name</label>
                <Input required value={segmentName} onChange={e => setSegmentName(e.target.value)} placeholder="High Value Customers" />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium block mb-1">Description</label>
                <Input value={segmentDesc} onChange={e => setSegmentDesc(e.target.value)} placeholder="Customers who spend more than 1000" />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai"><Sparkles className="w-4 h-4 mr-2 text-blue-500" /> AI Generator</TabsTrigger>
                  <TabsTrigger value="manual"><Layers className="w-4 h-4 mr-2" /> Manual Builder</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="space-y-5 mt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground block mb-1">Describe your target audience</label>
                    <Textarea 
                      placeholder="e.g. Customers in Mumbai who spent over 5000 and haven't ordered in 30 days..."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="min-h-[120px] resize-none focus-visible:ring-primary/50"
                      required={activeTab === "ai"}
                    />
                    <p className="text-xs text-muted-foreground">The AI will automatically convert this into a set of segment rules.</p>
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-5 mt-6">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <label className="text-sm font-medium">Match</label>
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground" 
                      value={combinator} 
                      onChange={e => setCombinator(e.target.value)}
                    >
                      <option value="AND">ALL</option>
                      <option value="OR">ANY</option>
                    </select>
                    <span className="text-sm text-muted-foreground">of the following conditions</span>
                  </div>
                  
                  <div className="space-y-3">
                  {conditions.map((cond, i) => (
                    <div key={i} className="flex gap-3 items-center bg-card p-3 rounded-lg border border-border shadow-sm">
                      <select 
                        className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground" 
                        value={cond.field} 
                        onChange={e => {
                          const newConds = [...conditions];
                          newConds[i].field = e.target.value;
                          setConditions(newConds);
                        }}
                      >
                        <option value="city">City</option>
                        <option value="totalSpend">Total Spend</option>
                        <option value="lastOrderDate">Last Order Date</option>
                        <option value="tags">Tags</option>
                        <option value="orderCount">Order Count</option>
                      </select>
                      <select 
                        className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground" 
                        value={cond.operator} 
                        onChange={e => {
                          const newConds = [...conditions];
                          newConds[i].operator = e.target.value;
                          setConditions(newConds);
                        }}
                      >
                        <option value="equals">Equals</option>
                        <option value="notEquals">Not Equals</option>
                        <option value="greaterThan">Greater Than</option>
                        <option value="lessThan">Less Than</option>
                        <option value="olderThanDays">Older Than (days)</option>
                        <option value="withinDays">Within (days)</option>
                        <option value="contains">Contains</option>
                      </select>
                      <Input 
                        className="flex-1 h-9 bg-background text-foreground" 
                        placeholder="Value..."
                        required={activeTab === "manual"} 
                        value={cond.value} 
                        onChange={e => {
                          const newConds = [...conditions];
                          newConds[i].value = e.target.value;
                          setConditions(newConds);
                        }} 
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => {
                        if (conditions.length > 1) {
                          setConditions(conditions.filter((_, idx) => idx !== i));
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => setConditions([...conditions, { field: "city", operator: "equals", value: "" }])}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Condition
                  </Button>
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Segment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {segments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
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
              className="hover:shadow-md transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/8 dark:bg-primary/15">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    {segment.matchCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {segment.description && (
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                )}
                <div className="p-3 rounded-lg bg-muted/40 dark:bg-muted/30 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Rule Summary</p>
                  <p className="text-sm">{segment.englishDescription}</p>
                </div>

                {/* AI Explanation */}
                {explanations[segment.id] ? (
                  <div className="p-3 rounded-lg bg-primary/5 dark:bg-primary/8 border border-primary/15 dark:border-primary/20">
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
