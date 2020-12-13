import { Graph } from '../parser';
import { getInternalNodeLocation } from '../utils';
import createGraphNode, { InternalPath, Node } from './base';

/**
 * Handles an script entry node
 *
 * @param node
 * @param graph
 * @returns Node
 */
export async function handleJavascriptEntryNode(
  node: Promise<Node>,
  graph: Graph
) {
  let scriptNode = await node;

  if (scriptNode.mimeType === 'javascript') {
    return await getJavascriptNodeMeta(scriptNode.location as string, graph);
  }

  return node;
}

/**
 * Traverses a single html file's AST, creating its node and
 * collecting its child nodes and adding them to the graph if necessary
 *
 * @param node
 * @param graph
 * @returns Promise<Node>
 */
export async function getJavascriptNodeMeta(
  nodePath: any,
  graph: Graph,
  internalPath?: InternalPath
): Promise<Node> {
  const node = await createGraphNode(nodePath);

  if (internalPath) {
    node.location = internalPath;
  }

  graph.push(node);

  return node;
}

/**
 * Returns all script nodes from within an HTML node
 * by walking the HTML node's AST and extracting them
 *
 * @param graph
 * @param htmlNode
 * @returns Function
 */
export function getJavascriptNodesFromHtmlNode(
  htmlNode: Node,
  graph: Graph
): Function {
  const walkToScriptTag = (tree: any, htmlNode: any, graph: Graph): void => {
    tree.forEach((node: any) => {
      if (node.name === 'script') {
        const isFirstChildText =
          node &&
          node.content &&
          node.content[0] &&
          node.content[0].type === 'text';
        const hasOnlyChildText = isFirstChildText && node.content.length === 1;
        const hasAttrs =
          node !== undefined &&
          node.attrs !== undefined &&
          node.attrs.src !== undefined &&
          node.attrs.src[0] !== undefined;

        if (hasAttrs) {
          if (
            node.attrs.src[0].type === 'text' &&
            !node.attrs.src[0].content.startsWith('http')
          ) {
            const fileName = node.attrs.src[0].content as string;

            getJavascriptNodeMeta(fileName, graph);
            htmlNode.children.push(fileName);
          }
        }

        if (hasOnlyChildText) {
          const location: InternalPath = getInternalNodeLocation(
            node.content[0],
            true
          );

          // TODO: get internal node, and push location string to parent
          console.log('INLINE SCRIPT LOCATION: ', location);
        }
      } else if (Array.isArray(node.content) && node.content.length > 0) {
        walkToScriptTag(node.content, htmlNode, graph);
      }
    }, []);

    return tree;
  };

  return (tree: any) => walkToScriptTag(tree, htmlNode, graph);
}