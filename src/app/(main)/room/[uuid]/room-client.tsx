"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Room } from "@prisma/client";
import { motion } from "framer-motion";
import { HardDrive, Mic, MonitorOff, Play, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

interface RoomClientProps {
  room: Room;
}

export function RoomClient({ room }: RoomClientProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState("calc(100% - 32px)");
  const [isConnected, setIsConnected] = useState(false);
  const editorRef = useRef<any>();
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [userCursors, setUserCursors] = useState<
    Map<
      string,
      {
        line: number;
        column: number;
        username: string;
        color: string;
        isTyping: boolean;
      }
    >
  >(new Map());

  // Update editor height when terminal expands/collapses
  useEffect(() => {
    if (containerRef.current) {
      const totalHeight = containerRef.current.clientHeight;
      const terminalHeight = isTerminalExpanded ? 300 : 32;
      const newEditorHeight = totalHeight - terminalHeight;
      setEditorHeight(`${newEditorHeight}px`);
    }
  }, [isTerminalExpanded]);

  // Cleanup function for Y.js resources
  const cleanup = () => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (docRef.current) {
      docRef.current.destroy();
      docRef.current = null;
    }
  };

  // Setup Y.js collaboration when editor mounts
  function handleEditorDidMount(editor: any, monaco: any) {
    try {
      // Cleanup any existing instances
      cleanup();

      // Initialize new Y.js document
      const doc = new Y.Doc();
      docRef.current = doc;

      // Create text instance for the editor
      const yText = doc.getText("monaco");

      yText.insert(0, room.boilerplateCode ?? "");

      // Setup WebSocket provider with retry logic
      const provider = new WebsocketProvider(
        "wss://meerkat-production.up.railway.app/ws",
        room.id,
        doc,
        {
          connect: true,
          maxBackoffTime: 5000,
          disableBc: true, // Disable broadcast channel to prevent duplicate connections
        },
      );
      providerRef.current = provider;

      // Handle connection status
      provider.on("status", ({ status }: { status: string }) => {
        console.log("Connection status:", status);
        setIsConnected(status === "connected");
      });

      provider.on("sync", (isSynced: boolean) => {
        console.log("Sync status:", isSynced);
        if (isSynced) {
          // If we have synced successfully, ensure the editor has the latest content
          const editorModel = editor.getModel();
          if (editorModel) {
            const currentContent = yText.toString();
            if (currentContent && currentContent !== editorModel.getValue()) {
              editorModel.setValue(currentContent);
            }
          }
        }
      });

      // Create Monaco binding with awareness
      const binding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        provider.awareness,
      );
      bindingRef.current = binding;

      // Store editor reference
      editorRef.current = editor;

      // Setup error handling for document updates
      doc.on("update", (update: Uint8Array, origin: any) => {
        try {
          console.log("Document updated:", {
            updateSize: update.length,
            origin,
            currentText: yText.toString().length,
          });
        } catch (error) {
          console.error("Error processing update:", error);
        }
      });

      // We have to set the user's actual name here
      const randomName = room.userName;
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      // Set the local awareness state (user's name and color)
      providerRef.current.awareness.setLocalStateField("user", {
        name: randomName,
        color: randomColor,
      });

      // Listen to awareness changes and cursor positions
      provider.awareness.on("change", () => {
        const awarenessState = provider.awareness.getStates();
        const newCursors = new Map();
        awarenessState.forEach((state, clientID) => {
          const cursorPosition = state?.cursor;
          const username = state?.user?.name ?? "Anonymous";
          const color = state?.user?.color ?? "#FF6347";
          const isTyping = state?.typing ?? false; // Check if the user is typing
          if (cursorPosition) {
            newCursors.set(clientID.toString(), {
              line: cursorPosition.line,
              column: cursorPosition.column,
              username,
              color,
              isTyping, // Add typing state to the cursor
            });
          }
        });
        setUserCursors(newCursors);
      });

      // Monitor cursor position changes in the editor
      editor.onDidChangeCursorPosition((e: any) => {
        const currentCursor = e.position;
        const awareness = provider.awareness;
        const clientID = awareness.clientID;
        awareness.setLocalStateField("cursor", {
          line: currentCursor.lineNumber - 1, // 0-based index
          column: currentCursor.column - 1, // 0-based index
        });
      });

      // Customizing cursor style using Monaco API
      editor.updateOptions({
        cursorStyle: "line",
        cursorWidth: 3,
      });

      // Track typing status
      editor.onDidChangeModelContent(() => {
        // Mark the user as typing whenever they change content
        const awareness = provider.awareness;
        const clientID = awareness.clientID;
        awareness.setLocalStateField("typing", true);

        // Set a timer to stop typing after a short delay
        setTimeout(() => {
          awareness.setLocalStateField("typing", false);
        }, 1000); // Consider a 1-second delay for when typing stops
      });
    } catch (error) {
      console.error("Error setting up collaborative editing:", error);
      setIsConnected(false);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div className="flex h-screen flex-col bg-white">
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
        {/* File Explorer */}
        <div className="border-r border-gray-200 bg-gray-50 p-6">
          <div className="mb-6 text-sm font-medium text-gray-600">Files</div>
          <div className="space-y-3">
            {["file1.readme", "file2.py", "file3.something"].map((file) => (
              <div
                key={file}
                className={cn(
                  "cursor-pointer rounded-lg p-3 text-sm transition-colors",
                  selectedFile === file
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-700 hover:bg-gray-100",
                )}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {file}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor and Terminal Container */}
        <div
          ref={containerRef}
          className="relative flex flex-1 flex-col bg-gray-50"
        >
          {/* Editor */}
          <div
            style={{ height: editorHeight }}
            className="relative transition-all duration-200"
          >
            <Editor
              height="100%"
              defaultLanguage={room.programmingLanguage ?? "javascript"}
              defaultValue={room.boilerplateCode ?? "// Start coding here"}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                fontSize: 17,
              }}
            />
            {/* Render User Cursors */}
            <div className="pointer-events-none absolute inset-0 delay-1000">
              {Array.from(userCursors.entries()).map(([clientID, cursor]) => {
                if (!cursor.isTyping) return null; // Only show when typing

                const editorModel = editorRef.current?.getModel();
                if (!editorModel || !editorRef.current) return null;

                const editorDomNode = editorRef.current.getDomNode();
                if (!editorDomNode) return null;

                const position = new monaco.Position(
                  cursor.line + 1,
                  cursor.column + 1,
                );
                const positionCoords =
                  editorRef.current.getScrolledVisiblePosition(position);

                if (!positionCoords) return null;

                // Calculate position relative to editor container
                const cursorLeft =
                  editorDomNode.offsetLeft + positionCoords.left;
                const cursorTop = editorDomNode.offsetTop + positionCoords.top;

                return (
                  <div
                    key={clientID}
                    className="absolute whitespace-nowrap delay-1000"
                    style={{
                      transform: `translate(${cursorLeft + 10}px, ${cursorTop - 20}px)`,
                      zIndex: 1000,
                    }}
                  >
                    <div
                      className="mb-1 rounded-sm px-1.5 py-0.5 text-xs"
                      style={{ backgroundColor: cursor.color }}
                    >
                      {cursor.username}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal */}
          <motion.div
            layout
            animate={{
              height: isTerminalExpanded ? 300 : 32,
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
          >
            {/* Terminal UI (Add more content here) */}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
