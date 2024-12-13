import { useEffect, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import type { Room } from "@prisma/client";
import type * as monaco from "monaco-editor";

interface AwarenessState {
  cursor?: {
    line: number;
    column: number;
  };
  user?: {
    name: string;
    color: string;
  };
  typing?: boolean;
}

export interface UserCursor {
  line: number;
  column: number;
  username: string;
  color: string;
  isTyping: boolean;
}

export function useCollaborativeEditor(room: Room) {
  const [isConnected, setIsConnected] = useState(false);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(
    new Map(),
  );

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const cleanup = () => {
    bindingRef.current?.destroy();
    providerRef.current?.destroy();
    docRef.current?.destroy();

    bindingRef.current = null;
    providerRef.current = null;
    docRef.current = null;
  };

  const initializeCollaboration = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
  ) => {
    cleanup();

    const doc = new Y.Doc();
    const yText = doc.getText("monaco");
    yText.insert(0, room.boilerplateCode ?? "");

    const provider = new WebsocketProvider(
      "wss://meerkat-production.up.railway.app/ws",
      room.id,
      doc,
      {
        connect: true,
        maxBackoffTime: 5000,
        disableBc: true,
      },
    );

    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness,
    );

    setupAwareness(provider, editor);
    setupEventListeners(provider, yText);

    docRef.current = doc;
    providerRef.current = provider;
    bindingRef.current = binding;
    editorRef.current = editor;
  };

  const setupAwareness = (
    provider: WebsocketProvider,
    editor: monaco.editor.IStandaloneCodeEditor,
  ) => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    provider.awareness.setLocalStateField("user", {
      name: room.userName,
      color: randomColor,
    });

    provider.awareness.on("change", () => {
      const awarenessState = provider.awareness.getStates();
      const newCursors = new Map();

      awarenessState.forEach((state, clientID) => {
        const typedState = state as AwarenessState;
        const cursorPosition = typedState?.cursor;
        const username = typedState?.user?.name ?? "Anonymous";
        const color = typedState?.user?.color ?? "#FF6347";
        const isTyping = typedState?.typing ?? false;

        if (cursorPosition?.line != null && cursorPosition?.column != null) {
          newCursors.set(clientID.toString(), {
            line: cursorPosition.line,
            column: cursorPosition.column,
            username,
            color,
            isTyping,
          });
        }
      });

      setUserCursors(newCursors);
    });

    setupEditorEvents(editor, provider);
  };

  const setupEditorEvents = (
    editor: monaco.editor.IStandaloneCodeEditor,
    provider: WebsocketProvider,
  ) => {
    editor.onDidChangeCursorPosition((e) => {
      provider.awareness.setLocalStateField("cursor", {
        line: e.position.lineNumber - 1,
        column: e.position.column - 1,
      });
    });

    editor.onDidChangeModelContent(() => {
      provider.awareness.setLocalStateField("typing", true);
      setTimeout(() => {
        provider.awareness.setLocalStateField("typing", false);
      }, 1000);
    });
  };

  const setupEventListeners = (provider: WebsocketProvider, yText: Y.Text) => {
    provider.on("status", ({ status }: { status: string }) => {
      setIsConnected(status === "connected");
    });

    provider.on("sync", (isSynced: boolean) => {
      if (isSynced && editorRef.current) {
        const editorModel = editorRef.current.getModel();
        const currentContent = yText.toJSON();

        if (
          editorModel &&
          currentContent &&
          currentContent !== editorModel.getValue()
        ) {
          editorModel.setValue(currentContent);
        }
      }
    });
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    isConnected,
    userCursors,
    initializeCollaboration,
    editorRef,
    docRef,
  };
}
