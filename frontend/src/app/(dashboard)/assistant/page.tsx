"use client";

import { AIAssistant } from "@/components/assistant/AIAssistant";
import { Bot, Sparkles, Database, TrendingUp } from "lucide-react";

export default function AssistantPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-4rem-3rem)] max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ask questions about your store — powered by real-time data
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
          {[
            { icon: Database, label: "Live inventory data" },
            { icon: TrendingUp, label: "Sales analytics" },
            { icon: Sparkles, label: "AI-powered insights" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={13} className="text-blue-500" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIAssistant />
        </div>

        {/* Side panel */}
        <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
          {/* Capabilities */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                What I can do
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              {[
                "Analyze sales trends and anomalies",
                "Identify inventory issues and stockouts",
                "Explain profit margin changes",
                "Suggest reorder quantities",
                "Detect dead and slow-moving stock",
                "Compare performance across time periods",
                "Analyze fuel pricing and margins",
                "Review invoice discrepancies",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Data sources */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Connected Data
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "POS Sales Data", status: "Live", color: "bg-emerald-500" },
                { label: "Inventory System", status: "Live", color: "bg-emerald-500" },
                { label: "Fuel Analytics", status: "Live", color: "bg-emerald-500" },
                { label: "Invoice Records", status: "Live", color: "bg-emerald-500" },
                { label: "Flash Reports", status: "3 pending", color: "bg-amber-500" },
              ].map((ds) => (
                <div key={ds.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{ds.label}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${ds.color}`} />
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick questions */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Quick Questions
              </h3>
            </div>
            <div className="space-y-1.5">
              {[
                "What's my top margin product?",
                "How did this week compare to last?",
                "Any theft or shrink incidents?",
                "When should I order fuel?",
                "What's selling best right now?",
              ].map((q) => (
                <div
                  key={q}
                  className="text-xs text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                >
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
