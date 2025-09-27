"use client";
import { useRef, useEffect, useCallback } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import { TemplateFile } from "../lib/path-to-json";
import {
  configureMonaco,
  defaultEditorOptions,
  getEditorLanguage,
} from "../lib/editor-config";
import { editor } from "monaco-editor";

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined;
  content: string;
  onContentChange: (value: string) => void;
  suggestion: string | null;
  suggestionLoading: boolean;
  suggestionPosition: { line: number; column: number } | null;
  onAcceptSuggestion: (editor: any, monaco: any) => void;
  onRejectSuggestion: (editor: any) => void;
  onTriggerSuggestion: (type: string, editor: any) => void;
}
const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    console.log("Editor mounted:", !!editorRef.current);

    editor.updateOptions({
      ...defaultEditorOptions,
    });
    configureMonaco(monaco);

    updateEditorLanguage();
  };

  const updateEditorLanguage = () => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const language = getEditorLanguage(activeFile.fileExtension || "");
    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch (error) {
      console.warn("Failed to set editor language:", error);
    }
  };
  
  return (
    <div className="h-full relative">
      <Editor
        height={"100%"}
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={
          activeFile
            ? getEditorLanguage(activeFile.fileExtension) || "plaintext"
            : "plaintext"
        }
        // @ts-ignore
        options={defaultEditorOptions}
      />
    </div>
  );
};

export default PlaygroundEditor;
