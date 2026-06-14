"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AIAnalyticsPage() {
  const [summaryText, setSummaryText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analytics-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate summary");
      setSummaryText(result.summary);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate AI summary");
      setSummaryText("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xl font-semibold mt-6 mb-3 first:mt-0 flex items-center gap-2 text-foreground">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-base text-muted-foreground ml-6 list-disc leading-relaxed mb-1">
            {renderBold(line.replace("- ", ""))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={i} className="text-base text-muted-foreground ml-6 list-decimal leading-relaxed mb-1">
            {renderBold(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-4" />;
      return (
        <p key={i} className="text-base text-muted-foreground leading-relaxed mb-2">
          {renderBold(line)}
        </p>
      );
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            AI Executive Summary
          </h1>
          <p className="text-muted-foreground mt-1 ml-11">
            AI-generated analysis of your CRM performance.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={generateSummary}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50">
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Analyzing dashboard metrics and trends...</p>
            </div>
          ) : (
            <div className="prose-sm">{renderMarkdown(summaryText)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
