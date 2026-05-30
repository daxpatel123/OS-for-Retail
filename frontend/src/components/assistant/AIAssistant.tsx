"use client";

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Send, Bot, User } from "lucide-react";
import { askAssistant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  dataSources?: string[];
  suggestedActions?: string[];
}

const suggestedQuestions = [
  "What were my top-selling products today?",
  "Which invoices have discrepancies?",
  "What items need to be reordered?",
  "How does today's fuel margin compare to last week?",
  "Summarize yesterday's flash report",
];

const STORE_ID = "s1";

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your RetailOS AI assistant. I can help you analyze sales, inventory, invoices, and more. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askAssistant(question, STORE_ID);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        dataSources: response.dataSources,
        suggestedActions: response.suggestedActions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "I'm sorry, I couldn't connect to the AI service right now. Please check that the backend is running and try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-blue-600"
                  : "bg-slate-100 border border-slate-200"
              )}
            >
              {msg.role === "user" ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-slate-600" />
              )}
            </div>

            {/* Bubble */}
            <div className={cn("max-w-[75%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>

              {msg.dataSources && msg.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.dataSources.map((src) => (
                    <span
                      key={src}
                      className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="space-y-1">
                  {msg.suggestedActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="block text-xs text-blue-600 hover:underline text-left"
                    >
                      → {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Bot size={14} className="text-slate-600" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400 mb-2">Suggested questions</p>
        <div className="flex gap-2 flex-wrap">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1.5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4 flex gap-3 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your store..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          size="md"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
