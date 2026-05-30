"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoiceUploaderProps {
  onUpload?: (file: File) => Promise<void>;
}

export function InvoiceUploader({ onUpload }: InvoiceUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadError(null);
      setUploadSuccess(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile || !onUpload) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      await onUpload(selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          size={32}
          className={cn(
            "mx-auto mb-3",
            isDragActive ? "text-blue-500" : "text-slate-300"
          )}
        />
        {isDragActive ? (
          <p className="text-sm text-blue-600 font-medium">Drop invoice here</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Drag & drop invoice, or click to select
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 20MB</p>
          </>
        )}
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
          <FileText size={18} className="text-blue-500 flex-shrink-0" />
          <span className="text-sm text-slate-700 flex-1 truncate">
            {selectedFile.name}
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {uploadSuccess && (
        <p className="text-sm text-emerald-600">Invoice uploaded successfully!</p>
      )}

      {selectedFile && (
        <Button
          onClick={handleUpload}
          isLoading={isUploading}
          disabled={isUploading}
          className="w-full"
        >
          Upload Invoice
        </Button>
      )}
    </div>
  );
}
