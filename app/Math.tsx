import katex from "katex";

export const katexOptions = {
  output: "htmlAndMathml" as const,
  strict: "ignore" as const,
  throwOnError: false,
};

export function renderMathToString(tex: string, block = false) {
  return katex.renderToString(tex, {
    ...katexOptions,
    displayMode: block,
  });
}

type MathProps = {
  tex: string;
  block?: boolean;
  className?: string;
  label?: string;
};

export default function Math({ tex, block = false, className = "", label }: MathProps) {
  const html = renderMathToString(tex, block);

  const classes = `${block ? "math-katex-block" : "math-katex-inline"} ${className}`.trim();
  const props = {
    className: classes,
    ...(label ? { "aria-label": label } : {}),
    dangerouslySetInnerHTML: { __html: html },
  };

  return block ? <div {...props} /> : <span {...props} />;
}
