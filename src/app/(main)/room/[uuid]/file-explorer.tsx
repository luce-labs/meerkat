import { FileJson2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { YjsFile } from "@/lib/hooks/use-collaborative-files";
import type { ChangeEvent, DragEvent } from "react";

interface FileExplorerProps {
  files: YjsFile[];
  selectedFile: string | null;
  onFileSelect: (file: string) => void;
  onFileAdd: (name: string, content: string) => void;
  onFileDelete: (name: string) => void;
}

export function FileExplorer({
  files,
  selectedFile,
  onFileSelect,
  onFileAdd,
  onFileDelete,
}: FileExplorerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    // Use Promise.all to properly handle async operations
    await Promise.all(
      droppedFiles.map(async (file) => {
        const content = await file.text();
        onFileAdd(file.name, content);
      }),
    );
  }

  async function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    await Promise.all(
      selectedFiles.map(async (file) => {
        const content = await file.text();
        onFileAdd(file.name, content);
      }),
    );

    e.target.value = ""; // Reset input
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between border-r border-gray-200 bg-gray-50 p-6",
        isDragging && "bg-blue-50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div>
        <div className="mb-6 text-sm font-medium text-gray-600">Files</div>
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.name}
              className={cn(
                "group cursor-pointer rounded-lg p-3 text-sm transition-colors",
                selectedFile === file.name
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              onClick={() => onFileSelect(file.name)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileJson2 className="h-4 w-4" />
                  {file.name}
                </div>
                <Trash2
                  className="h-4 w-4 cursor-pointer opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(file.name);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 border-t border-gray-200 pt-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          multiple
        />
        <div className="text-center">
          <p className="mb-3 text-sm text-gray-500">Drop files here or</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mx-auto flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-100"
          >
            <Upload className="h-4 w-4" />
            Choose Files
          </button>
        </div>
      </div>
    </div>
  );
}
