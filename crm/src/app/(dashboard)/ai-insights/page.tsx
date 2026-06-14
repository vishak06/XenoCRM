"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;
  totalSpend: string;
}

export default function AIInsightsPage() {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [insightsText, setInsightsText] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchDefaultCustomers();
  }, []);

  const fetchDefaultCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?limit=100`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Failed to fetch initial customers", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      fetchDefaultCustomers();
      return;
    }
    
    setSearching(true);
    try {
      const params = new URLSearchParams({ search, limit: "5" });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      toast.error("Failed to search customers");
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateInsights = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setInsightsText("");
    setLoadingInsights(true);

    try {
      const res = await fetch("/api/ai/customer-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate insights");
      setInsightsText(data.insights);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate insights");
      setInsightsText("Failed to generate insights. Please try again.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-lg font-semibold mt-6 mb-2 first:mt-0 text-foreground">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-sm text-muted-foreground ml-5 list-disc leading-relaxed mb-1">
            {renderBold(line.replace("- ", ""))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={i} className="text-sm text-muted-foreground ml-5 list-decimal leading-relaxed mb-1">
            {renderBold(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-3" />;
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          AI Customer Insights
        </h1>
        <p className="text-muted-foreground mt-1 ml-11">
          Generate deep behavioral analysis and next-best-actions for individual customers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Search & Select */}
        <div className="col-span-1 flex flex-col h-[600px]">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={searching} variant="secondary">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {customers.length > 0 && (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleGenerateInsights(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCustomer?.id === c.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {search && customers.length === 0 && !searching && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center py-4">No customers found.</p>
            </div>
          )}
        </div>

        {/* Right Column: Insights Display */}
        <div className="col-span-1 md:col-span-2">
          {selectedCustomer ? (
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 flex flex-col h-[600px]">
              <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-card flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        {selectedCustomer.city}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        Spend: ₹{parseFloat(selectedCustomer.totalSpend).toLocaleString("en-IN")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 overflow-y-auto flex-1">
                {loadingInsights ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Analyzing customer history and behavior...</p>
                  </div>
                ) : (
                  <div className="prose-sm">{renderMarkdown(insightsText)}</div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-6 bg-muted/10">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Select a Customer</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Search and select a customer from the list on the left to generate their AI insights report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
