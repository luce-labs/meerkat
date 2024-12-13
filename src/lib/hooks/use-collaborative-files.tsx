import { useEffect, useState } from "react";
import * as Y from "yjs";

export interface YjsFile {
  name: string;
  content: string;
  lastModified: number;
}

export function useCollaborativeFiles(
  doc: React.MutableRefObject<Y.Doc | null>,
) {
  const [files, setFiles] = useState<YjsFile[]>([]);
  const [currentlySelectedFile, setCurrentlySelectedFile] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!doc.current) return;

    const filesMap = doc.current.getMap("files");

    // Create default file if it doesn't exist
    if (!filesMap.get("current.js")) {
      filesMap.set("current.js", {
        name: "current.js",
        content: "// Start coding here",
        lastModified: Date.now(),
      });
      setCurrentlySelectedFile("current.js");
    }

    // Update local files state when the Yjs map changes
    const updateFiles = () => {
      setFiles(Array.from(filesMap.values()) as YjsFile[]);
    };

    filesMap.observe(updateFiles);
    updateFiles(); // Initial load

    return () => {
      filesMap.unobserve(updateFiles);
    };
  }, [doc.current]);

  const getFilesMap = () => {
    if (!doc.current) return null;
    return doc.current.getMap("files");
  };

  const addFile = (name: string, content: string) => {
    const filesMap = getFilesMap();
    if (!filesMap) return;

    filesMap.set(name, {
      name,
      content,
      lastModified: Date.now(),
    });
  };

  const updateFile = (name: string, content: string) => {
    const filesMap = getFilesMap();
    if (!filesMap) return;

    const file = filesMap.get(name);
    if (file) {
      filesMap.set(name, {
        ...file,
        content,
        lastModified: Date.now(),
      });
    }
  };

  const getFile = (name: string): YjsFile | undefined => {
    const filesMap = getFilesMap();
    if (!filesMap) return undefined;
    const file = filesMap.get(name) as YjsFile | undefined;
    if (!file) return undefined;

    setCurrentlySelectedFile(name);
    return file;
  };

  const deleteFile = (name: string) => {
    const filesMap = getFilesMap();
    if (!filesMap) return;
    if (currentlySelectedFile === name) {
      // remove the content of the editor if the content in view is what was deleted
      setCurrentlySelectedFile(null);
      doc.current
        ?.getText("monaco")
        .delete(0, doc.current?.getText("monaco").length);
    }
    filesMap.delete(name);
  };

  return {
    addFile,
    updateFile,
    getFile,
    deleteFile,
    files,
  };
}
