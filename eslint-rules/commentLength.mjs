/**
 * Custom ESLint rule: flags comments (including runs of consecutive `//` lines, treated as one
 * logical comment) that exceed a configurable character length. JSDoc (`/** ... *\/`) comments
 * are checked on their description text only (everything before the first `@tag`), against a
 * separate, typically higher, limit — the tag list itself (`@param`, `@returns`, etc.) is exempt
 * since it legitimately grows with a method's signature.
 */

/**
 * Determines whether two adjacent `Line` comments belong to the same logical comment block, i.e.
 * they sit on consecutive lines, share the same start column, and have no code token between them.
 * @param {object} root0 - Named parameters.
 * @param {object} root0.sourceCode - The rule's `SourceCode` instance.
 * @param {object} root0.previous - The preceding `Line` comment node.
 * @param {object} root0.current - The candidate `Line` comment node to test for continuation.
 * @returns {boolean} True if `current` continues the same comment block as `previous`.
 */
function continuesLineCommentBlock({ sourceCode, previous, current }) {
  const sameColumn = current.loc.start.column === previous.loc.start.column;
  const consecutiveLine = current.loc.start.line === previous.loc.end.line + 1;
  if (!sameColumn || !consecutiveLine) return false;

  const tokenAfterPrevious = sourceCode.getTokenAfter(previous, { includeComments: false });
  return !tokenAfterPrevious || tokenAfterPrevious.range[0] >= current.range[1];
}

/**
 * Extracts the description text of a JSDoc block comment, i.e. everything before the first
 * `@tag` line, with the leading `*` markup on each line stripped.
 * @param {string} rawValue - The raw `value` of a `Block` comment node starting with `*`.
 * @returns {string} The trimmed, single-line description text.
 */
function extractJSDocDescription(rawValue) {
  const lines = rawValue.split('\n').map(line => line.replace(/^\s*\*?/, '').trim());
  const descriptionLines = [];
  for (const line of lines) {
    if (/^@\w+/.test(line)) break;
    if (line) descriptionLines.push(line);
  }
  return descriptionLines.join(' ').trim();
}

const commentLength = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Flag comments (and JSDoc descriptions) that exceed a configured character length.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxLength: { type: 'number' },
          maxJSDocDescriptionLength: { type: 'number' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        'Comment is {{ length }} characters long, exceeding the {{ max }}-character limit. Shorten it or move the detail to linked documentation.',
      jsdocDescriptionTooLong:
        'JSDoc description is {{ length }} characters long, exceeding the {{ max }}-character limit. Shorten it or move the detail to linked documentation.',
    },
  },
  create(context) {
    const { maxLength = 200, maxJSDocDescriptionLength = 400 } = context.options[0] ?? {};
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        let index = 0;

        while (index < comments.length) {
          const comment = comments[index];

          if (comment.type === 'Line') {
            const group = [comment];
            let next = index + 1;
            while (
              next < comments.length &&
              comments[next].type === 'Line' &&
              continuesLineCommentBlock({
                sourceCode,
                previous: group[group.length - 1],
                current: comments[next],
              })
            ) {
              group.push(comments[next]);
              next += 1;
            }

            const combinedText = group
              .map(part => part.value.trim())
              .join(' ')
              .trim();
            if (combinedText.length > maxLength) {
              context.report({
                loc: { start: group[0].loc.start, end: group[group.length - 1].loc.end },
                messageId: 'tooLong',
                data: { length: String(combinedText.length), max: String(maxLength) },
              });
            }
            index = next;
            continue;
          }

          if (comment.type === 'Block') {
            const isJSDoc = comment.value.startsWith('*');
            if (isJSDoc) {
              const description = extractJSDocDescription(comment.value);
              if (description.length > maxJSDocDescriptionLength) {
                context.report({
                  node: comment,
                  messageId: 'jsdocDescriptionTooLong',
                  data: {
                    length: String(description.length),
                    max: String(maxJSDocDescriptionLength),
                  },
                });
              }
            } else {
              const text = comment.value.trim();
              if (text.length > maxLength) {
                context.report({
                  node: comment,
                  messageId: 'tooLong',
                  data: { length: String(text.length), max: String(maxLength) },
                });
              }
            }
          }

          index += 1;
        }
      },
    };
  },
};

export default commentLength;
