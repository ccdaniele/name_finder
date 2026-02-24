"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/components/shared/ChatMessage";
import type { PreferenceSummary } from "@/lib/types";

interface InterviewStepProps {
  preferenceSummary: PreferenceSummary;
  onComplete: (insights: string) => void;
  onBack: () => void;
}

export function InterviewStep({
  preferenceSummary,
  onComplete,
  onBack,
}: InterviewStepProps) {
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasStarted = useRef(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/interview",
      body: { preferenceSummary },
      onFinish: (message) => {
        if (message.content.includes("[INTERVIEW_COMPLETE]")) {
          setIsComplete(true);
          const parts = message.content.split("[INTERVIEW_COMPLETE]");
          const insightsPart = parts[1] || "";
          onComplete(insightsPart.trim());
        }
      },
    });

  // Auto-start the interview by sending an initial hidden message
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      append({ role: "user", content: "Please begin the discovery interview." });
    }
  }, [append]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEndEarly = () => {
    const conversationSummary = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n");
    onComplete(conversationSummary);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Discovery Interview</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Answer a few questions to help us understand your naming preferences
            better.
          </p>
        </div>
        {!isComplete && messages.length > 3 && (
          <button
            onClick={handleEndEarly}
            className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            End interview early
          </button>
        )}
      </div>

      <div className="border border-[var(--border)] rounded-lg p-4 h-[400px] overflow-y-auto mb-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            The interview will begin shortly...
          </p>
        )}
        {messages
          .filter((_, i) => i !== 0) // Hide the initial seed message
          .map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={
              message.content.includes("[INTERVIEW_COMPLETE]")
                ? message.content.split("[INTERVIEW_COMPLETE]")[0].trim()
                : message.content
            }
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-[var(--muted)] rounded-lg px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isComplete ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your answer..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2.5 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Interview complete! Ready to generate names.
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
