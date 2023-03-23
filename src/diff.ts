// import { DefaultTreeElement } from 'parse5'
type Attribute = {
  name: string;
  value: string;
};

type Node = any
// DefaultTreeElement & {
//   attrs?: Attribute[];
//   childNodes?: Node[];
// };

type Diff = {
    type: 'name' | 'attribute' | 'attributes' | 'child' | 'children' | 'root-child' | 'root-children';
    node1: Node | Attribute[] | Node[];
    node2?: Node | Attribute[] | Node[];
    attr1?: Attribute;
    attr2?: Attribute;
    childIndex?: number;
  };

  
  function compareNode(node1: Node, node2: Node): Diff[] {
    const diffs: Diff[] = [];
  
    // compare tag name
    if (node1.tagName !== node2.tagName) {
      diffs.push({
        type: 'name',
        node1,
        node2,
      });
    }
  
    // compare attributes
    const attrs1 = node1.attrs || [];
    const attrs2 = node2.attrs || [];
  
    if (attrs1.length !== attrs2.length) {
      diffs.push({
        type: 'attributes',
        node1: { target: node1, diff: attrs1},
        node2: { target: node2, diff: attrs2},
      });
    } else {
      for (let i = 0; i < attrs1.length; i++) {
        const attr1 = attrs1[i];
        const attr2 = attrs2[i];
        if (attr1.name !== attr2.name || attr1.value !== attr2.value) {
          diffs.push({
            type: 'attribute',
            node1: { target: node1, diff: attr1},
            node2: { target: node2, diff: attr2},
          });
        }
      }
    }
  
    // compare child nodes
    const childNodes1 = node1.childNodes || [];
    const childNodes2 = node2.childNodes || [];
  
    if (childNodes1.length !== childNodes2.length) {
      diffs.push({
        type: 'children',
        node1: childNodes1,
        node2: childNodes2,
      });
    } else {
      for (let i = 0; i < childNodes1.length; i++) {
        const childDiffs = compareNode(childNodes1[i] as Node, childNodes2[i] as Node);
        childDiffs.forEach((diff) => {
          diff.type = 'child';
          diff.childIndex = i;
          diffs.push(diff);
        });
      }
    }
  
    return diffs;
  }
  
  export function compare(root1: Node, root2: Node): Diff[] {
    const diffs: Diff[] = [];
  
    // compare root child nodes
    const childNodes1 = root1.childNodes || [];
    const childNodes2 = root2.childNodes || [];
    // debugger
  
    if (childNodes1.length !== childNodes2.length) {
      diffs.push({
        type: 'root-children',
        node1: childNodes1,
        node2: childNodes2,
      });
    } else {
      for (let i = 0; i < childNodes1.length; i++) {
        if(childNodes1[i].nodeName === '#comment' && childNodes2[i].nodeName === '#comment') continue
        const childDiffs = compareNode(childNodes1[i] as Node, childNodes2[i] as Node);
        childDiffs.forEach((diff) => {
          diff.type = 'root-child';
          diff.childIndex = i;
          diffs.push(diff);
        });
      }
    }
  
    return diffs;
  }