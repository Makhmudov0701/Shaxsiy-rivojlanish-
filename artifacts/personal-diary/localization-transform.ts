import ts from "typescript";
import type { Plugin } from "vite";

const translatedAttributes = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "description",
  "detail",
  "label",
  "placeholder",
  "title",
]);

const userContentProperty = /\b(?:entry|idea|goal|task|book|note|habit|card|flashcard|vaultEntry|diaryEntry|userEntry)\.(?:title|text|content|name|author|front|back|takeaways|excerpt)\b/;
const userContentIdentifier = /^\s*(?:author|back|content|description|entryContent|entryText|excerpt|firstName|front|fullName|ideaText|lastName|name|query|quoteText|search|tag|tagName|takeaways|text|title|userText)\s*$/;

function shouldTranslateExpression(expression: string): boolean {
  return !userContentProperty.test(expression) && !userContentIdentifier.test(expression);
}

function normalizeJsxText(text: string): string {
  return text
    .replace(/^\r?\n[ \t]*/, "")
    .replace(/[ \t]*\r?\n$/, "")
    .replace(/\r?\n[ \t]*/g, " ");
}

function isNonUiElement(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isJsxElement(current)) {
      const tagName = current.openingElement.tagName.getText(sourceFile).toLowerCase();
      if (tagName === "code" || tagName === "pre" || tagName === "script" || tagName === "style") {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

function containsNestedJsx(node: ts.Node): boolean {
  let found = false;
  const visit = (child: ts.Node) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return found;
}

export function diaryLocalizationTransform(): Plugin {
  return {
    name: "personal-diary-jsx-localization",
    enforce: "pre",
    transform(code, id) {
      if (
        !id.includes("/src/") ||
        !/\.[jt]sx?$/.test(id) ||
        id.endsWith("/lib/i18n.tsx") ||
        id.includes(".test.")
      ) {
        return null;
      }

      const sourceFile = ts.createSourceFile(
        id,
        code,
        ts.ScriptTarget.Latest,
        true,
        id.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const edits: Array<{ start: number; end: number; text: string }> = [];
      let needsLocalizedText = false;
      let needsAttributeTranslator = false;

      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && !isNonUiElement(node, sourceFile)) {
          const text = normalizeJsxText(node.text);
          if (text.trim() && /[\p{L}]{2}/u.test(text)) {
            edits.push({
              start: node.pos,
              end: node.end,
              text: `{<__DiaryLocalizedText>${text}</__DiaryLocalizedText>}`,
            });
            needsLocalizedText = true;
          }
        }

        if (ts.isJsxAttribute(node) && translatedAttributes.has(node.name.getText(sourceFile))) {
          if (node.initializer && ts.isStringLiteral(node.initializer)) {
            edits.push({
              start: node.initializer.getStart(sourceFile),
              end: node.initializer.end,
              text: `{__diaryTranslateUiText(${JSON.stringify(node.initializer.text)})}`,
            });
            needsAttributeTranslator = true;
          } else if (
            node.initializer &&
            ts.isJsxExpression(node.initializer) &&
            node.initializer.expression
          ) {
            const expression = node.initializer.expression;
            const expressionText = expression.getText(sourceFile);
            if (shouldTranslateExpression(expressionText)) {
              edits.push({
                start: expression.getStart(sourceFile),
                end: expression.end,
                text: `__diaryTranslateUiText(${expressionText})`,
              });
              needsAttributeTranslator = true;
            }
          }
        }

        if (
          ts.isJsxExpression(node) &&
          node.expression &&
          (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) &&
          !containsNestedJsx(node.expression) &&
          !isNonUiElement(node, sourceFile)
        ) {
          const expressionText = node.expression.getText(sourceFile);
          if (shouldTranslateExpression(expressionText)) {
            edits.push({
              start: node.getStart(sourceFile),
              end: node.end,
              text: `{<__DiaryLocalizedText>${node.getText(sourceFile)}</__DiaryLocalizedText>}`,
            });
            needsLocalizedText = true;
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
      if (!edits.length) return null;

      const importSpecifiers = [
        needsLocalizedText ? "LocalizedText as __DiaryLocalizedText" : "",
        needsAttributeTranslator ? "translateUiText as __diaryTranslateUiText" : "",
      ].filter(Boolean);
      const prefix = `import { ${importSpecifiers.join(", ")} } from "@/lib/i18n";\n`;
      edits.push({ start: 0, end: 0, text: prefix });

      let transformed = code;
      edits.sort((left, right) => right.start - left.start);
      for (const edit of edits) {
        transformed =
          transformed.slice(0, edit.start) +
          edit.text +
          transformed.slice(edit.end);
      }

      return { code: transformed, map: null };
    },
  };
}