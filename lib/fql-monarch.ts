import type { languages } from "monaco-editor";

/**
 * Minimal Monarch tokenizer for FQL shell editing (not full grammar parity).
 */
export const fqlMonarchLanguage: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenizer: {
    root: [
      [/\/\/.*$/, "comment"],
      [/\/\*/, "comment", "@blockComment"],
      [/'(?:[^'\\]|\\.)*'/, "string"],
      [/"(?:[^"\\]|\\.)*"/, "string"],
      [/\d+\.\d+([eE][+-]?\d+)?/, "number.float"],
      [/0x[0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],
      [
        /\b(true|false|null)\b/,
        "keyword.literal",
      ],
      [
        /\b(let|if|else|in|and|or|not|contains|like|by|all|where|take|drop|order|asc|desc|union|distinct|join|event|set|get|map|select|filter|reduce|time|date|to|from|as|with|pageSize|paginate|events)\b/,
        "keyword",
      ],
      [
        /\b(Collection|Document|Database|Role|Index|Function|Api|AccessProvider|Key|Token|Credential|Auth|User|Set|Abort|Call|Do|Var|Query|Time|Date|Math|String|Object|Array|Page|Event)\b/,
        "type.identifier",
      ],
      [/[a-zA-Z_][\w]*/, "identifier"],
      [/[(){}\[\].,;:+\-*/%^!=<>|&]+/, "delimiter"],
      [/\s+/, "white"],
    ],
    blockComment: [
      [/\*\//, "comment", "@pop"],
      [/./, "comment"],
    ],
  },
};
