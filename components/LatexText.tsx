"use client";

import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

interface Props {
  text: string;
  dark?: boolean;
}

export default function LatexText({ text, dark = false }: Props) {
  // $...$で囲まれた部分をLaTeXとして分割レンダリング
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const formula = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={formula} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
