function isIdentifierKey(node) {
  return node && node.type === 'Identifier';
}

function isThisPropertyAssignment(node) {
  return (
    node &&
    node.type === 'AssignmentExpression' &&
    node.operator === '=' &&
    node.left.type === 'MemberExpression' &&
    node.left.object.type === 'ThisExpression' &&
    !node.left.computed &&
    isIdentifierKey(node.left.property)
  );
}

function collectThisAssignments(node, assignments, visitorKeys) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (
    node.type === 'FunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'ClassDeclaration' ||
    node.type === 'ClassExpression'
  ) {
    return;
  }

  if (isThisPropertyAssignment(node)) {
    assignments.push(node.left.property.name);
  }

  for (const key of visitorKeys[node.type] ?? []) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        collectThisAssignments(child, assignments, visitorKeys);
      }
      continue;
    }

    collectThisAssignments(value, assignments, visitorKeys);
  }
}

function unique(names) {
  return [...new Set(names)];
}

function hasCommentsInRange(sourceCode, start, end) {
  return sourceCode
    .getAllComments()
    .some(comment => comment.range[0] >= start && comment.range[1] <= end);
}

const classPropertyOrderMatchesConstructor = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require class property declarations to follow the same order as their constructor assignments.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      outOfOrder:
        'Class property declarations should follow the same order as their constructor assignments.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const visitorKeys = sourceCode.visitorKeys ?? context.sourceCode.visitorKeys;

    return {
      ClassBody(node) {
        const constructorNode = node.body.find(
          member => member.type === 'MethodDefinition' && member.kind === 'constructor'
        );
        if (!constructorNode?.value?.body) {
          return;
        }

        const propertyNodes = node.body.filter(
          member =>
            member.type === 'PropertyDefinition' &&
            !member.computed &&
            isIdentifierKey(member.key) &&
            member.value == null
        );
        if (propertyNodes.length < 2) {
          return;
        }

        const declarationNames = propertyNodes.map(member => member.key.name);
        const constructorAssignments = [];
        collectThisAssignments(constructorNode.value.body, constructorAssignments, visitorKeys);

        const constructorNames = unique(
          constructorAssignments.filter(name => declarationNames.includes(name))
        );
        if (constructorNames.length < 2) {
          return;
        }

        const orderedNames = [
          ...constructorNames,
          ...declarationNames.filter(name => !constructorNames.includes(name)),
        ];

        const isAlreadyOrdered = declarationNames.every(
          (name, index) => name === orderedNames[index]
        );
        if (isAlreadyOrdered) {
          return;
        }

        const nameToNode = new Map(propertyNodes.map(member => [member.key.name, member]));
        const sortedNodes = orderedNames.map(name => nameToNode.get(name)).filter(Boolean);

        context.report({
          node: propertyNodes[0],
          messageId: 'outOfOrder',
          fix(fixer) {
            const start = propertyNodes[0].range[0];
            const end = propertyNodes[propertyNodes.length - 1].range[1];
            const indentation = ' '.repeat(propertyNodes[0].loc.start.column);

            if (hasCommentsInRange(sourceCode, start, end)) {
              return null;
            }

            const replacement = sortedNodes
              .map(
                (member, index) => `${index === 0 ? '' : indentation}${sourceCode.getText(member)}`
              )
              .join('\n');
            return fixer.replaceTextRange([start, end], replacement);
          },
        });
      },
    };
  },
};

export default classPropertyOrderMatchesConstructor;
