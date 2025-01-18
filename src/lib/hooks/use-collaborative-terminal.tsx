import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { FitAddon } from "xterm-addon-fit";
import { api } from "@/trpc/react";

interface UseCollaborativeTerminalProps {
  roomId: string;
  languageId: number;
  doc: React.MutableRefObject<Y.Doc | null>;
}

export function useCollaborativeTerminal({
  roomId,
  languageId,
  doc,
}: UseCollaborativeTerminalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const terminalRef = useRef<Terminal>();
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const fitAddonRef = useRef<FitAddon>();
  const elementRef = useRef<HTMLElement | null>(null);

  const executeMutation = api.judge0.submit.useMutation();

  const cleanup = () => {
    if (terminalRef.current) {
      console.log("Cleaning up terminal");
      terminalRef.current.dispose();
      terminalRef.current = undefined;
    }
    if (providerRef.current) {
      console.log("Cleaning up WebSocket provider");
      providerRef.current.destroy();
      providerRef.current = null;
    }
  };

  const writeToTerminal = (content: string, isError = false) => {
    const sanitizedContent = content.replace(/[^ -~\r\n]+/g, "");
    if (terminalRef.current && docRef.current) {
      const yTerminal = docRef.current.getArray("terminal");
      yTerminal.push([
        {
          type: "output",
          data: isError
            ? `\x1b[31m${sanitizedContent}\x1b[0m`
            : sanitizedContent,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const executeCode = async (code: string) => {
    if (!code.trim() || isExecuting) return;

    setIsExecuting(true);

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

      writeToTerminal("\r\n$ Execution completed\r\n");
    } catch (error: any) {
      writeToTerminal(`\r\n$ Execution error: ${error.message}\r\n`, true);
    } finally {
      setIsExecuting(false);
    }
  };

  const waitForContainer = (callback: () => void) => {
    const checkContainer = () => {
      if (
        elementRef.current &&
        elementRef.current.offsetWidth > 0 &&
        elementRef.current.offsetHeight > 0
      ) {
        callback();
      } else {
        requestAnimationFrame(checkContainer);
      }
    };
    checkContainer();
  };

  useEffect(() => {
    if (terminalRef.current) return;

    if (!elementRef.current) return;

    cleanup();

    waitForContainer(() => {
      const terminal = new Terminal({
        cursorBlink: false,
        fontSize: 14,
        fontFamily: "monospace",
        theme: {
          background: "#1e1e1e",
          foreground: "#000000",
        },
        rows: 10,
        cols: 80,
        convertEol: true,
        scrollback: 1000,
        disableStdin: true,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(elementRef.current!);

      requestAnimationFrame(() => {
        fitAddon.fit();
      });

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      const currentDoc = doc.current || new Y.Doc();
      docRef.current = currentDoc;
      const yTerminal = currentDoc.getArray("terminal");

      const provider = new WebsocketProvider(
        "wss://meerkat-production.up.railway.app/ws",
        `terminal-${roomId}`,
        currentDoc,
        {
          connect: true,
          maxBackoffTime: 5000,
          disableBc: true,
        },
      );

      provider.on("status", ({ status }: { status: string }) => {
        setIsConnected(status === "connected");
      });

      providerRef.current = provider;

      terminal.write("$ Terminal ready for code execution output\r\n");

      yTerminal.forEach((item: any) => {
        if (item.type === "output") {
          terminal.write(item.data);
        }
      });

      yTerminal.observe((event) => {
        event.changes.delta.forEach((change) => {
          if (change.insert) {
            if (Array.isArray(change.insert)) {
              change.insert.forEach((item: any) => {
                console.log("Writing to terminal: ", item);
                if (item.type === "output") {
                  terminal.write(item.data);
                }
              });
            }
          }
        });
      });

      const handleResize = debounce(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }, 200);

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        cleanup();
      };
    });
  }, [roomId, doc]);

  return {
    isConnected,
    isExecuting,
    initializeCollaboration: (terminalElement: HTMLElement) => {
      elementRef.current = terminalElement;
    },
    executeCode,
    terminalRef,
    fitTerminal: () => fitAddonRef.current?.fit(),
  };
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};
