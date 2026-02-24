"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function FileUploader({ onFileSelect, selectedFile }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
        alert("Please upload a PDF, DOCX, or TXT file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be under 10MB.");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-[var(--primary)] bg-[var(--accent)]"
            : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium">{selectedFile.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              PDF, DOCX, or TXT (max 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
