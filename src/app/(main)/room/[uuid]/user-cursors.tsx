import type { UserCursor } from "@/lib/hooks/use-collaborative-editor";
import type * as monaco from "monaco-editor";
import { Position } from "monaco-editor";

interface UserCursorsProps {
  readonly userCursors: Map<string, UserCursor>;
  readonly editorRef: React.MutableRefObject<
    monaco.editor.IStandaloneCodeEditor | undefined
  >;
}

export function UserCursors({ userCursors, editorRef }: UserCursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 delay-1000">
      {Array.from(userCursors.entries()).map(([clientID, cursor]) => {
        if (!cursor.isTyping) return null;

        const editor = editorRef.current;
        const editorModel = editor?.getModel();
        const editorDomNode = editor?.getDomNode();

        if (!editor || !editorModel || !editorDomNode) return null;

        const position = new Position(cursor.line + 1, cursor.column + 1);
        const positionCoords = editor.getScrolledVisiblePosition(position);

        if (!positionCoords) return null;

        const cursorLeft = editorDomNode.offsetLeft + positionCoords.left;
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
              className="mb-1 rounded-sm px-1.5 py-0.5 text-xs text-white"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </div>
        );
      })}
    </div>
  );
}
