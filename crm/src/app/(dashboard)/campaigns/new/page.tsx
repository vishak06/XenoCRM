"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Send,
  Users,
  Check,
  Edit3,
  Rocket,
  Loader2,
  MessageSquare,
  RefreshCw,
  Layers,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ============================================
// Types
// ============================================

type ChatStep =
  | "IDLE"
  | "PARSING"
  | "SEGMENT_PREVIEW"
  | "REFINING"
  | "DRAFTING_MESSAGE"
  | "MESSAGE_DRAFT"
  | "CREATING_CAMPAIGN"
  | "CAMPAIGN_CREATED"
  | "DISPATCHING";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "segment-preview" | "message-draft" | "campaign-created";
  data?: Record<string, unknown>;
}

interface SegmentPreview {
  totalCount: number;
  sample: Array<{
    id: string;
    name: string;
    city: string;
    totalSpend: string | number;
    lastOrderDate: string | null;
    orderCount: number;
    lastProduct: string | null;
  }>;
}

interface ParsedIntent {
  segment: {
    combinator: string;
    conditions: Array<{ field: string; operator: string; value: string | number }>;
  };
  messageIntent: {
    channel: string;
    tone: string;
    offerDescription: string;
  };
}

// ============================================
// Component
// ============================================

export default function NewCampaignPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Welcome to the AI Campaign Builder! Describe your campaign in natural language, and I'll help you create it.\n\nFor example:\n• *\"Customers in Bangalore who spent over ₹10,000 and haven't ordered in 60 days — send a 15% off coupon via WhatsApp\"*\n• *\"Email VIP customers about our new summer collection with an exclusive early access offer\"*\n• *\"SMS customers in Mumbai tagged as churn-risk with a win-back discount\"*",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState<ChatStep>("IDLE");
  const [currentSegment, setCurrentSegment] = useState<ParsedIntent["segment"] | null>(null);
  const [currentMessageIntent, setCurrentMessageIntent] = useState<ParsedIntent["messageIntent"] | null>(null);
  const [currentPreview, setCurrentPreview] = useState<SegmentPreview | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================
  // Helper functions
  // ============================================

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
    ]);
  };

  const getSegmentDescription = (segment: ParsedIntent["segment"]) => {
    return segment.conditions
      .map((c) => `${c.field} ${c.operator} ${c.value}`)
      .join(` ${segment.combinator} `);
  };

  // ============================================
  // Flow handlers
  // ============================================

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message) return;

    addMessage({ role: "user", content: message });
    setInputValue("");

    if (step === "IDLE" || step === "PARSING") {
      // Initial intent parsing
      await handleParseIntent(message);
    } else if (step === "SEGMENT_PREVIEW") {
      // Refinement
      await handleRefineSegment(message);
    }
  };

  const handleParseIntent = async (message: string) => {
    setStep("PARSING");
    addMessage({
      role: "assistant",
      content: "🧠 Analyzing your campaign intent...",
      type: "text",
    });

    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse intent");
      }

      const data: ParsedIntent = await res.json();
      setCurrentSegment(data.segment);
      setCurrentMessageIntent(data.messageIntent);

      // Get preview
      await fetchPreview(data.segment, data.messageIntent);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      addMessage({
        role: "assistant",
        content: `❌ ${errMsg}\n\nPlease try rephrasing your campaign description.`,
      });
      setStep("IDLE");
    }
  };

  const fetchPreview = async (
    segment: ParsedIntent["segment"],
    messageIntent: ParsedIntent["messageIntent"]
  ) => {
    try {
      const previewRes = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleDefinition: segment }),
      });
      const preview: SegmentPreview = await previewRes.json();
      setCurrentPreview(preview);

      // Remove the "analyzing" message and add the preview
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => m.content !== "🧠 Analyzing your campaign intent..." &&
                 m.content !== "🔄 Refining your segment..."
        );
        return [
          ...filtered,
          {
            id: `preview-${Date.now()}`,
            role: "assistant" as const,
            content: "",
            type: "segment-preview" as const,
            data: {
              segment,
              messageIntent,
              preview,
            },
          },
        ];
      });

      setStep("SEGMENT_PREVIEW");
    } catch {
      addMessage({
        role: "assistant",
        content: "❌ Failed to preview segment. Please try again.",
      });
      setStep("IDLE");
    }
  };

  const handleRefineSegment = async (message: string) => {
    if (!currentSegment || !currentMessageIntent) return;
    setStep("REFINING");
    addMessage({
      role: "assistant",
      content: "🔄 Refining your segment...",
    });

    try {
      const res = await fetch("/api/ai/refine-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSegment,
          messageIntent: currentMessageIntent,
          refinementMessage: message,
          conversationHistory: [],
        }),
      });

      if (!res.ok) throw new Error("Failed to refine segment");

      const data: ParsedIntent = await res.json();
      setCurrentSegment(data.segment);
      setCurrentMessageIntent(data.messageIntent);

      await fetchPreview(data.segment, data.messageIntent);
    } catch {
      addMessage({
        role: "assistant",
        content: "❌ Failed to refine segment. Please try again.",
      });
      setStep("SEGMENT_PREVIEW");
    }
  };

  const handleConfirmSegment = async () => {
    if (!currentSegment || !currentMessageIntent) return;
    setStep("DRAFTING_MESSAGE");
    addMessage({
      role: "assistant",
      content: "✅ Segment confirmed! Drafting your message...",
    });

    try {
      const res = await fetch("/api/ai/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentMessageIntent,
          segmentDescription: getSegmentDescription(currentSegment),
        }),
      });

      if (!res.ok) throw new Error("Failed to draft message");

      const data = await res.json();
      setCurrentTemplate(data.messageTemplate);

      // Remove drafting message and add draft
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => m.content !== "✅ Segment confirmed! Drafting your message..."
        );
        return [
          ...filtered,
          {
            id: `draft-${Date.now()}`,
            role: "assistant" as const,
            content: "",
            type: "message-draft" as const,
            data: {
              template: data.messageTemplate,
              sampleCustomer: currentPreview?.sample[0] || null,
              channel: currentMessageIntent?.channel,
            },
          },
        ];
      });

      setStep("MESSAGE_DRAFT");
    } catch {
      addMessage({
        role: "assistant",
        content: "❌ Failed to draft message. Please try again.",
      });
      setStep("SEGMENT_PREVIEW");
    }
  };

  const handleApproveAndCreate = async () => {
    if (!currentSegment || !currentMessageIntent) return;
    setStep("CREATING_CAMPAIGN");

    const template = editingTemplate ? currentTemplate : currentTemplate;

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Campaign — ${currentMessageIntent.offerDescription}`,
          segmentRule: currentSegment,
          messageTemplate: template,
          channel: currentMessageIntent.channel,
        }),
      });

      if (!res.ok) throw new Error("Failed to create campaign");

      const data = await res.json();
      setCampaignId(data.campaign.id);

      addMessage({
        role: "assistant",
        content: "",
        type: "campaign-created",
        data: {
          campaignId: data.campaign.id,
          recipientCount: data.recipientCount,
          channel: currentMessageIntent.channel,
          campaignName: data.campaign.name,
        },
      });

      setStep("CAMPAIGN_CREATED");
    } catch {
      addMessage({
        role: "assistant",
        content: "❌ Failed to create campaign. Please try again.",
      });
      setStep("MESSAGE_DRAFT");
    }
  };

  const handleDispatch = async () => {
    if (!campaignId) return;
    setStep("DISPATCHING");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/dispatch`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`🚀 Campaign dispatched: ${data.sent} messages sent!`);
        addMessage({
          role: "assistant",
          content: `🚀 Campaign dispatched successfully!\n\n• **${data.sent}** messages sent\n• **${data.failed}** failed\n\nYou can track the delivery progress on the campaign detail page.`,
        });

        // Redirect after a short delay
        setTimeout(() => router.push(`/campaigns/${campaignId}`), 2000);
      }
    } catch {
      toast.error("Failed to dispatch campaign");
      setStep("CAMPAIGN_CREATED");
    }
  };

  // ============================================
  // Render helpers
  // ============================================

  const renderMessage = (msg: Message) => {
    if (msg.type === "segment-preview" && msg.data) {
      return renderSegmentPreview(msg);
    }
    if (msg.type === "message-draft" && msg.data) {
      return renderMessageDraft(msg);
    }
    if (msg.type === "campaign-created" && msg.data) {
      return renderCampaignCreated(msg);
    }
    return renderTextMessage(msg);
  };

  const renderTextMessage = (msg: Message) => (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          msg.role === "user"
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "glass rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {msg.content.split(/(\*[^*]+\*)/).map((part, i) =>
            part.startsWith("*") && part.endsWith("*") ? (
              <em key={i} className="text-muted-foreground not-italic">{part.slice(1, -1)}</em>
            ) : part.startsWith("**") && part.endsWith("**") ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      </div>
    </div>
  );

  const renderSegmentPreview = (msg: Message) => {
    const { segment, messageIntent, preview } = msg.data as {
      segment: ParsedIntent["segment"];
      messageIntent: ParsedIntent["messageIntent"];
      preview: SegmentPreview;
    };

    return (
      <div className="flex justify-start animate-slide-up">
        <Card className="max-w-[90%] border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/15">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">Segment Preview</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 ml-auto">
                <Users className="w-3 h-3 mr-1" />
                {preview.totalCount} matches
              </Badge>
            </div>

            {/* Conditions */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Conditions ({segment.combinator})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {segment.conditions.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-muted/50">
                    {c.field} {c.operator} {c.value}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Channel + Tone */}
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                {messageIntent.channel}
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                {messageIntent.tone}
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                {messageIntent.offerDescription}
              </Badge>
            </div>

            {/* Sample Customers */}
            {preview.sample.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Sample Customers
                </p>
                <div className="space-y-1.5">
                  {preview.sample.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-xs"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{c.city}</span>
                      <span className="font-mono text-muted-foreground">
                        ₹{typeof c.totalSpend === 'string' ? parseFloat(c.totalSpend).toLocaleString("en-IN") : c.totalSpend.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {step === "SEGMENT_PREVIEW" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleConfirmSegment} className="gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Confirm Segment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground border-border/50"
                  onClick={() => inputRef.current?.focus()}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMessageDraft = (msg: Message) => {
    const { sampleCustomer, channel } = msg.data as {
      template: string;
      sampleCustomer: SegmentPreview["sample"][0] | null;
      channel: string;
    };

    // Render preview with sample customer data
    let renderedPreview = currentTemplate;
    if (sampleCustomer) {
      renderedPreview = renderedPreview
        .replace(/\{\{name\}\}/g, sampleCustomer.name)
        .replace(/\{\{city\}\}/g, sampleCustomer.city)
        .replace(/\{\{totalSpend\}\}/g, `₹${typeof sampleCustomer.totalSpend === 'string' ? parseFloat(sampleCustomer.totalSpend).toLocaleString("en-IN") : sampleCustomer.totalSpend.toLocaleString("en-IN")}`)
        .replace(/\{\{lastProduct\}\}/g, sampleCustomer.lastProduct || "your favorite items")
        .replace(/\{\{lastOrderDate\}\}/g, sampleCustomer.lastOrderDate ? new Date(sampleCustomer.lastOrderDate).toLocaleDateString("en-IN") : "recently");
    }

    return (
      <div className="flex justify-start animate-slide-up">
        <Card className="max-w-[90%] border-emerald-500/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/15">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-semibold text-sm">Message Draft</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 ml-auto">
                {channel}
              </Badge>
            </div>

            {/* Template (editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {editingTemplate ? "Edit Template" : "Template"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => setEditingTemplate(!editingTemplate)}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  {editingTemplate ? "Preview" : "Edit"}
                </Button>
              </div>
              {editingTemplate ? (
                <Textarea
                  value={currentTemplate}
                  onChange={(e) => setCurrentTemplate(e.target.value)}
                  className="min-h-[120px] text-sm bg-muted/30 border-border/30"
                />
              ) : (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-sm whitespace-pre-wrap">{renderedPreview}</p>
                </div>
              )}
            </div>

            {sampleCustomer && !editingTemplate && (
              <p className="text-[10px] text-muted-foreground">
                ↑ Preview rendered with data from: <strong>{sampleCustomer.name}</strong>
              </p>
            )}

            {/* Actions */}
            {step === "MESSAGE_DRAFT" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleApproveAndCreate} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  <Rocket className="w-3.5 h-3.5" /> Approve & Create Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCampaignCreated = (msg: Message) => {
    const { recipientCount, channel, campaignName } = msg.data as {
      campaignId: string;
      recipientCount: number;
      channel: string;
      campaignName: string;
    };

    return (
      <div className="flex justify-start animate-slide-up">
        <Card className="max-w-[90%] border-amber-500/20 bg-card/80 backdrop-blur-sm glow">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/15">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-semibold text-sm">Campaign Created! 🎉</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{campaignName}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                <span className="text-muted-foreground">Channel</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  {channel}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-bold text-lg">{recipientCount}</span>
              </div>
            </div>

            {step === "CAMPAIGN_CREATED" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleDispatch} className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                  <Rocket className="w-3.5 h-3.5" /> Launch Campaign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => campaignId && router.push(`/campaigns/${campaignId}`)}
                  className="border-border/50"
                >
                  View Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================
  // Main render
  // ============================================

  const isProcessing = [
    "PARSING",
    "REFINING",
    "DRAFTING_MESSAGE",
    "CREATING_CAMPAIGN",
    "DISPATCHING",
  ].includes(step);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/15">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Campaign Builder</h1>
            <p className="text-sm text-muted-foreground">
              Describe your campaign and let AI handle the rest
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 px-1">
        {messages.map((msg) => (
          <div key={msg.id}>{renderMessage(msg)}</div>
        ))}

        {isProcessing && (
          <div className="flex justify-start animate-slide-up">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {step === "PARSING" && "Analyzing your campaign intent..."}
                {step === "REFINING" && "Refining segment..."}
                {step === "DRAFTING_MESSAGE" && "Crafting your message..."}
                {step === "CREATING_CAMPAIGN" && "Creating campaign..."}
                {step === "DISPATCHING" && "Dispatching messages..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {step !== "CAMPAIGN_CREATED" && step !== "DISPATCHING" && (
        <div className="flex-shrink-0 pt-4 border-t border-border/30">
          <div className="flex gap-3">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                step === "SEGMENT_PREVIEW"
                  ? "Type to refine the segment (e.g., 'make it 90 days instead')..."
                  : "Describe your campaign..."
              }
              className="min-h-[52px] max-h-[120px] resize-none bg-card border-border/50 text-sm"
              disabled={isProcessing || step === "MESSAGE_DRAFT"}
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() || isProcessing || step === "MESSAGE_DRAFT"
              }
              className="self-end px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {step === "SEGMENT_PREVIEW" && (
            <p className="text-[10px] text-muted-foreground mt-2">
              💡 Type a follow-up to refine, or click &quot;Confirm Segment&quot; above to proceed to message drafting.
            </p>
          )}
          {step === "MESSAGE_DRAFT" && (
            <p className="text-[10px] text-muted-foreground mt-2">
              ✏️ Edit the message template above if needed, then click &quot;Approve & Create Campaign&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
