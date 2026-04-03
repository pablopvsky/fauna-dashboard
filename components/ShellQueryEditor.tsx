"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import {
  KeyCode,
  type IDisposable,
  type IPosition,
  type editor,
} from "monaco-editor";
import { useEffect, useRef } from "react";
import { FQL_STATIC_COMPLETION_LABELS } from "@/lib/fql-completion-static";
import { fqlMonarchLanguage } from "@/lib/fql-monarch";
import "@/styles/shell-editor-monaco.css";

const FQL_LANGUAGE_ID = "fql";
const FQL_THEME_ID = "fauna-shell-fql";

function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function hexNoHash(hex: string): string {
  return hex.replace(/^#/, "");
}

function registerFqlLanguage(monaco: Monaco) {
  const existing = monaco.languages.getLanguages().some(
    (lang: { id: string }) => lang.id === FQL_LANGUAGE_ID,
  );
  if (!existing) {
    monaco.languages.register({ id: FQL_LANGUAGE_ID });
  }
  monaco.languages.setMonarchTokensProvider(
    FQL_LANGUAGE_ID,
    fqlMonarchLanguage,
  );

  const bg = readCssVar("--gray-3", "#d7e6ff");
  const fg = readCssVar("--gray-12", "#061c4d");
  const gray9 = readCssVar("--gray-9", "#537ed3");
  const accent9 = readCssVar("--accent-9", "#0040ff");

  monaco.editor.defineTheme(FQL_THEME_ID, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: hexNoHash(readCssVar("--gray-11", "#355698")) },
      { token: "string", foreground: "be185d" },
      { token: "keyword", foreground: "db2777" },
      { token: "keyword.literal", foreground: hexNoHash(accent9) },
      { token: "number", foreground: hexNoHash(gray9) },
      { token: "number.float", foreground: hexNoHash(gray9) },
      { token: "number.hex", foreground: hexNoHash(gray9) },
      { token: "type.identifier", foreground: hexNoHash(readCssVar("--accent-12", "#0e2a6e")) },
      { token: "identifier", foreground: hexNoHash(fg) },
      { token: "delimiter", foreground: hexNoHash(readCssVar("--gray-10", "#4c73c3")) },
    ],
    colors: {
      "editor.background": bg,
      "editor.foreground": fg,
      "editorLineNumber.foreground": hexNoHash(readCssVar("--gray-8", "#7facff")),
      "editorLineNumber.activeForeground": hexNoHash(gray9),
      "editorCursor.foreground": hexNoHash(accent9),
      "editor.selectionBackground": readCssVar("--accent-a4", "#036aff2a"),
      "editor.inactiveSelectionBackground": readCssVar("--accent-a3", "#025ab217"),
      "editorWhitespace.foreground": hexNoHash(readCssVar("--gray-7", "#9fc2ff")),
    },
  });
}

export type ShellCollectionIndexCompletion = {
  name: string;
  collectionName: string;
};

export type ShellQueryEditorProps = {
  value: string;
  onChange: (value: string) => void;
  collectionNames: readonly string[];
  /** Per-collection index names from live schema (detail shows owning collection). */
  collectionIndexes: readonly ShellCollectionIndexCompletion[];
  /** When false, arrow keys use default editor navigation (same as empty history in textarea). */
  historyNavigationActive: boolean;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  minHeightPx?: number;
};

export function ShellQueryEditor({
  value,
  onChange,
  collectionNames,
  collectionIndexes,
  historyNavigationActive,
  onHistoryUp,
  onHistoryDown,
  minHeightPx = 120,
}: ShellQueryEditorProps) {
  const collectionNamesRef = useRef(collectionNames);
  const collectionIndexesRef = useRef(collectionIndexes);
  const historyActiveRef = useRef(historyNavigationActive);
  const onHistoryUpRef = useRef(onHistoryUp);
  const onHistoryDownRef = useRef(onHistoryDown);

  const completionDisposableRef = useRef<IDisposable | null>(null);
  const keyDownDisposableRef = useRef<IDisposable | null>(null);

  useEffect(() => {
    collectionNamesRef.current = collectionNames;
    collectionIndexesRef.current = collectionIndexes;
    historyActiveRef.current = historyNavigationActive;
    onHistoryUpRef.current = onHistoryUp;
    onHistoryDownRef.current = onHistoryDown;
  });

  useEffect(() => {
    return () => {
      completionDisposableRef.current?.dispose();
      completionDisposableRef.current = null;
      keyDownDisposableRef.current?.dispose();
      keyDownDisposableRef.current = null;
    };
  }, []);

  const handleBeforeMount = (monaco: Monaco) => {
    registerFqlLanguage(monaco);
  };

  const handleMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = monaco.languages.registerCompletionItemProvider(
      FQL_LANGUAGE_ID,
      {
        triggerCharacters: [".", "(", " "],
        provideCompletionItems(model: editor.ITextModel, position: IPosition) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const staticItems = FQL_STATIC_COMPLETION_LABELS.map((label) => ({
            label,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: label,
            range,
            sortText: `0${label}`,
          }));

          const names = collectionNamesRef.current;
          const collectionItems = names.map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Module,
            detail: "Collection",
            insertText: name,
            range,
            sortText: `1${name}`,
          }));

          const indexRows = collectionIndexesRef.current;
          const indexItems = indexRows.map((row) => ({
            label: row.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: `Index · ${row.collectionName}`,
            insertText: row.name,
            range,
            sortText: `2${row.collectionName}/${row.name}`,
          }));

          return {
            suggestions: [...staticItems, ...collectionItems, ...indexItems],
          };
        },
      },
    );

    keyDownDisposableRef.current?.dispose();
    keyDownDisposableRef.current = ed.onKeyDown((e) => {
      if (!historyActiveRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.keyCode === KeyCode.UpArrow) {
        e.preventDefault();
        e.stopPropagation();
        onHistoryUpRef.current();
      } else if (e.keyCode === KeyCode.DownArrow) {
        e.preventDefault();
        e.stopPropagation();
        onHistoryDownRef.current();
      }
    });
  };

  return (
    <div
      className="shell-query-editor--monaco relative z-20 min-w-0 max-w-full overflow-visible rounded-[var(--aura-input-radius)] border border-gray-6 bg-gray-3"
      style={{ minHeight: minHeightPx }}
    >
      <Editor
        height={`${minHeightPx}px`}
        defaultLanguage={FQL_LANGUAGE_ID}
        language={FQL_LANGUAGE_ID}
        theme={FQL_THEME_ID}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          // Render suggest/hover widgets with position:fixed so they are not clipped by
          // shell layout (overflow-hidden flex ancestors).
          fixedOverflowWidgets: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: false,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          wrappingIndent: "none",
          padding: { top: 13, bottom: 13 },
          overviewRulerLanes: 0,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          wordBasedSuggestions: "off",
          accessibilitySupport: "auto",
        }}
      />
    </div>
  );
}
