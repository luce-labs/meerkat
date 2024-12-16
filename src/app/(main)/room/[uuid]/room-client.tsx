"use client";

import * as monaco from "monaco-editor";
import Editor from "@monaco-editor/react";
import { Room } from "@prisma/client";
import { motion } from "framer-motion";
import { Mic, MonitorOff, Play, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCollaborativeEditor } from "@/lib/hooks/use-collaborative-editor";
import { useCollaborativeFiles } from "@/lib/hooks/use-collaborative-files";
import { cn } from "@/lib/utils";

import { FileExplorer } from "./file-explorer";
import { UserCursors } from "./user-cursors";

interface RoomClientProps {
  room: Room;
}

export function RoomClient({ room }: Readonly<RoomClientProps>) {
  const [selectedFile, setSelectedFile] = useState<string>("current.js");
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState("calc(100% - 32px)");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const {
    isConnected,
    userCursors,
    initializeCollaboration,
    editorRef,
    docRef,
  } = useCollaborativeEditor(room);

  const { files, addFile, updateFile, getFile, deleteFile, renameFile } =
    useCollaborativeFiles(docRef);

  useEffect(() => {
    if (containerRef.current) {
      const totalHeight = containerRef.current.clientHeight;
      const terminalHeight = isTerminalExpanded ? 300 : 32;
      const newEditorHeight = totalHeight - terminalHeight;
      setEditorHeight(`${newEditorHeight}px`);
    }
  }, [isTerminalExpanded, containerRef.current]);

  useEffect(() => {
    if (!editorRef.current) return;

    const disposable = editorRef.current.onDidChangeModelContent(() => {
      if (selectedFile && docRef.current) {
        const yText = docRef.current.getText("monaco");
        const content = yText.toJSON();

        updateFile(selectedFile, content);
      }
    });

    return () => disposable.dispose();
  }, [selectedFile, editorRef.current]);

  // Handle file selection
  const handleFileSelect = (fileName: string) => {
    const file = getFile(fileName);
    if (file && editorRef.current && docRef.current) {
      const yText = docRef.current.getText("monaco");

      // Update the monaco text with the selected file's content
      yText.delete(0, yText.length);
      yText.insert(0, file.content);

      setSelectedFile(fileName);
    }
  };

  const getFileExtension = (language: string) => {
    switch (language) {
      case "javascript":
        return "js";
      case "typescript":
        return "ts";
      case "python":
        return "py";
      case "java":
        return "java";
      default:
        return "js";
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
      }
    }

    if (selectedFile) {
      const fileNameWithoutExt = selectedFile.split(".")[0];
      const newExt = getFileExtension(newLanguage);
      const newFileName = `${fileNameWithoutExt}.${newExt}`;

      if (newFileName !== selectedFile) {
        renameFile(selectedFile, newFileName);
        setSelectedFile(newFileName);
      }
    }
  };

  return (
    <div className="pointer-events-auto flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="grid h-16 grid-cols-3 items-center border-b border-gray-200 bg-gray-50 px-6">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <div className="text-xl font-medium text-gray-900">Meerkat</div>
          <div className="text-sm text-gray-500">/ {room.roomName}</div>
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500",
            )}
            title={isConnected ? "Connected" : "Disconnected"}
          />
        </div>

        {/* Middle section */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <MonitorOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center justify-end gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            Run
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid flex-1 grid-cols-[minmax(280px,_320px)_1fr]">
        <FileExplorer
          files={files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onFileAdd={addFile}
          onFileDelete={deleteFile}
        />

        {/* Editor and Terminal Container */}
        <div
          ref={containerRef}
          className="relative flex flex-1 flex-col bg-gray-50"
        >
          <div
            style={{ height: editorHeight }}
            className="relative transition-all duration-200"
          >
            <Editor
              height="100%"
              defaultLanguage={selectedLanguage}
              defaultValue={room.boilerplateCode ?? "// Start coding here"}
              onMount={initializeCollaboration}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                fontSize: 17,
              }}
            />
            <UserCursors userCursors={userCursors} editorRef={editorRef} />
          </div>

          {/* Terminal */}
          <motion.div
            animate={{
              height: isTerminalExpanded ? 0 : 32,
              opacity: 1,
            }}
            initial={false}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className={cn(
              "border-t border-gray-200 bg-gray-50 transition-colors",
              isTerminalExpanded
                ? "bg-opacity-100"
                : "bg-opacity-50 hover:bg-opacity-75",
            )}
            onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
          >
            {/* Terminal UI (Add more content here) */}
            <span>Terminal</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
