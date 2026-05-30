"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ChevronRight,
  Database,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AIAssistantMessage } from "@/types";
import { assistantApi } from "@/lib/api";
import { useAppStore } from "@/store/appStore";

const SUGGESTED_QUESTIONS = [
  "Why were profits down yesterday?",
  "What should I reorder this week?",
  "Show me slow-moving inventory",
  "How does fuel margin compare to last week?",
  "Which items have the highest margin?",
  "What's causing the sales drop in beverages?",
];

const MOCK_RESPONSES: Record<string, Omit<AIAssistantMessage, "id" | "role" | "timestamp">> = {
  default: {
    content:
      "Based on your store data, I can see a few key insights:\n\n**Sales Performance:** Today's total sales of $22,340 are up 8.2% vs yesterday, driven mainly by a strong morning fuel rush and increased snack sales.\n\n**Top Concern:** Regular unleaded fuel is at critically low levels (18% capacity). With current sell-through rate of ~1,800 gal/day, you have about 28 hours of stock. I recommend scheduling a delivery immediately.\n\n**Opportunity:** Red Bull and Celsius are selling well above average today — consider front-of-store placement to maximize visibility.",
    sources: ["Daily Flash Report - 5/25/2026", "Fuel Inventory System", "Sales Analytics"],
    suggestedActions: [
      "Schedule fuel delivery for Regular Unleaded",
      "View reorder recommendations",
      "Check Red Bull/Celsius inventory levels",
    ],
  },
  profit: {
    content:
      "Looking at yesterday's data, profits were down 6.2% compared to the same day last week. Here are the main contributors:\n\n**1. Tobacco margin compression (-$180):** Marlboro price dropped $0.15/pk due to a promotional program, reducing margins by 1.8 percentage points.\n\n**2. Low fuel margin day (-$290):** Crude oil costs spiked, but your retail prices weren't adjusted. The Regular Unleaded margin was 7.2¢/gal vs your typical 11-12¢/gal.\n\n**3. Shrink event:** 8 units of 5-Hour Energy unaccounted for (~$35 cost impact).\n\n**Offset by:** Strong beverage performance (+$95 above baseline).",
    sources: ["Profit & Loss Report - 5/24/2026", "Fuel Price Log", "Inventory Movements"],
    suggestedActions: [
      "Review fuel pricing strategy",
      "Check tobacco promotional programs",
      "Review security footage for shrink event",
    ],
  },
  reorder: {
    content:
      "Based on current inventory levels and sales velocity, here are your **top reorder priorities** for this week:\n\n**Urgent (order today):**\n• Newport 100s Box — OUT OF STOCK, ~98 units/week demand\n• Marlboro Red 20pk — 12 units left, 2 days of supply\n• Regular Unleaded Fuel — 18% tank capacity\n\n**Soon (order within 3 days):**\n• Monster Zero Ultra — 22 units, 3.8 days supply\n• Prime Hydration Blue — 18 units, 2.5 days supply\n\n**Estimated total order value:** $1,240 (inside products) + fuel delivery",
    sources: ["Inventory System", "Sales Velocity Analytics", "Reorder Algorithm"],
    suggestedActions: [
      "Generate purchase order for McLane",
      "Schedule fuel delivery",
      "View full reorder recommendations",
    ],
  },
  "slow-moving": {
    content:
      "I've identified **3 dead stock items** that haven't sold in 45+ days:\n\n**Chapstick Original (48 units)** — 92 days no sale, $57.60 tied up. Recommend: Mark down 30% and move to checkout counter.\n\n**Diet Pepsi 20oz (24 units)** — 45 days no sale, $15.60 tied up. Recommend: Bundle with snack items, or reduce cooler facings.\n\n**Vitamin C 500mg 60ct (18 units)** — 62 days no sale, $68.40 tied up. Recommend: Return to vendor if possible, or deep discount.\n\n**Total dead stock value:** ~$141.60 cost basis that could be converted to cash.",
    sources: ["Inventory Movement History", "Dead Stock Analysis", "AI Pricing Engine"],
    suggestedActions: [
      "Apply markdowns to dead stock items",
      "Request vendor return authorization",
      "View full dead stock report",
    ],
  },
};

function getResponse(question: string) {
  const q = question.toLowerCase();
  if (q.includes("profit") || q.includes("down")) return MOCK_RESPONSES.profit;
  if (q.includes("reorder") || q.includes("order")) return MOCK_RESPONSES.reorder;
  if (q.includes("slow") || q.includes("dead")) return MOCK_RESPONSES["slow-moving"];
  return MOCK_RESPONSES.default;
}

function MessageBubble({ message }: { message: AIAssistantMessage }) {
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-3.5 shadow-sm">
          <div className="flex gap-1.5 items-center h-5">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 items-start animate-fade-in",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          isUser ? "bg-slate-700" : "bg-blue-600"
        )}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Bot size={15} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn("max-w-[85%] space-y-2", isUser && "items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl p-3.5 shadow-sm text-sm leading-relaxed",
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
          )}
        >
          {/* Render markdown-ish content */}
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: message.content
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n\n/g, "<br/><br/>")
                .replace(/\n/g, "<br/>")
                .replace(/• /g, "&#8226; "),
            }}
          />
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-xs text-slate-500 rounded-lg border border-slate-200"
              >
                <Database size={10} />
                {source}
              </span>
            ))}
          </div>
        )}

        {/* Suggested actions */}
        {!isUser &&
          message.suggestedActions &&
          message.suggestedActions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Lightbulb size={11} />
                Suggested actions
              </p>
              {message.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  className="flex items-center gap-1.5 w-full text-left px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                >
                  <ChevronRight size={12} />
                  {action}
                </button>
              ))}
            </div>
          )}

        {/* Timestamp */}
        <p
          className={cn(
            "text-xs text-slate-400",
            isUser && "text-right"
          )}
        >
          {formatDateTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function AIAssistant() {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your RetailOS AI assistant. I have access to your store's sales data, inventory levels, fuel analytics, and more. Ask me anything about your business performance, or try one of the suggested questions below.",
      timestamp: new Date().toISOString(),
      sources: [],
      suggestedActions: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: AIAssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const loadingMessage: AIAssistantMessage = {
        id: `loading-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Try real API, fall back to mock
        let response;
        try {
          response = await assistantApi.askQuestion(storeId, text.trim());
        } catch {
          // Use mock response
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
          const mock = getResponse(text);
          response = {
            answer: mock.content,
            sources: mock.sources ?? [],
            suggestedActions: mock.suggestedActions ?? [],
            confidence: 0.92,
            queryId: `mock-${Date.now()}`,
          };
        }

        const assistantMessage: AIAssistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer,
          timestamp: new Date().toISOString(),
          sources: response.sources,
          suggestedActions: response.suggestedActions,
        };

        setMessages((prev) =>
          prev.filter((m) => !m.isLoading).concat(assistantMessage)
        );
      } catch {
        setMessages((prev) =>
          prev.filter((m) => !m.isLoading).concat({
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date().toISOString(),
          })
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, storeId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat cleared. How can I help you with your store today?",
        timestamp: new Date().toISOString(),
        sources: [],
        suggestedActions: [],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            RetailOS AI Assistant
          </p>
          <p className="text-xs text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            Online — Real-time store data
          </p>
        </div>
        <button
          onClick={clearChat}
          title="Clear chat"
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex-shrink-0">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles size={11} />
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your store performance..."
            rows={1}
            disabled={isLoading}
            className={cn(
              "flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-slate-50 disabled:cursor-not-allowed transition-all",
              "max-h-32 overflow-y-auto"
            )}
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Press Enter to send &bull; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
