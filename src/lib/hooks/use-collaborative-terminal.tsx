import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { FitAddon } from "xterm-addon-fit";
import { api } from "@/trpc/react";
import { generateName } from "@/lib/generic-name-generator";

interface TerminalUser {
  name: string;
  isActive: boolean;
}

interface UseCollaborativeTerminalProps {
  roomId: string;
  languageId: number;
}

export function useCollaborativeTerminal({
  roomId,
  languageId,
}: UseCollaborativeTerminalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Map<string, TerminalUser>>(
    new Map(),
  );
  const [isExecuting, setIsExecuting] = useState(false);

  const terminalRef = useRef<Terminal>();
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const fitAddonRef = useRef<FitAddon>();

  const executeMutation = api.judge0.submit.useMutation();

  const cleanup = () => {
    terminalRef.current?.dispose();
    providerRef.current?.destroy();
    docRef.current?.destroy();

    terminalRef.current = undefined;
    providerRef.current = null;
    docRef.current = null;
  };

  const writeToTerminal = (content: string, isError = false) => {
    if (terminalRef.current && docRef.current) {
      const yTerminal = docRef.current.getArray("terminal");
      yTerminal.push([
        {
          type: "output",
          data: isError ? `\x1b[31m${content}\x1b[0m` : content,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const executeCode = async (code: string) => {
    if (!code.trim() || isExecuting) return;

    setIsExecuting(true);
    writeToTerminal("\r\nExecuting code...\r\n");

    try {
      const result = await executeMutation.mutateAsync({
        source_code: code,
        language_id: languageId,
      });

      if (result.stdout) {
        writeToTerminal(result.stdout);
      }

      if (result.stderr) {
        writeToTerminal(result.stderr, true);
      }

      if (result.compile_output) {
        writeToTerminal(result.compile_output, true);
      }

      writeToTerminal("\r\nExecution completed\r\n");
    } catch (error: any) {
      writeToTerminal(`\r\nExecution error: ${error.message}\r\n`, true);
    } finally {
      setIsExecuting(false);
    }
  };

  const initializeCollaboration = (terminalElement: HTMLElement) => {
    cleanup();

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "monospace",
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalElement);
    fitAddon.fit();

    const doc = new Y.Doc();
    const yTerminal = doc.getArray("terminal");

    const provider = new WebsocketProvider(
      "wss://meerkat-production.up.railway.app/ws",
      `terminal-${roomId}`,
      doc,
      {
        connect: true,
        maxBackoffTime: 5000,
        disableBc: true,
      },
    );

    provider.awareness.setLocalStateField("user", {
      name: generateName(),
      isActive: true,
    });

    yTerminal.observe((event) => {
      event.changes.delta.forEach((change) => {
        if (change.insert) {
          if (Array.isArray(change.insert)) {
            change.insert.forEach((item: any) => {
              if (item.type === "output") {
                terminal.write(item.data);
              }
            });
          }
        }
      });
    });

    provider.awareness.on("change", () => {
      const states = provider.awareness.getStates();
      const newUsers = new Map();

      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          newUsers.set(clientId.toString(), {
            name: state.user.name,
            isActive: state.user.isActive,
          });
        }
      });

      setActiveUsers(newUsers);
    });

    provider.on("status", ({ status }: { status: string }) => {
      setIsConnected(status === "connected");
    });

    terminalRef.current = terminal;
    docRef.current = doc;
    providerRef.current = provider;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    isConnected,
    activeUsers,
    isExecuting,
    initializeCollaboration,
    executeCode,
    terminalRef,
    fitTerminal: () => fitAddonRef.current?.fit(),
  };
}
