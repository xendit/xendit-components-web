import { assertIsArray, assertIsNotArray } from "../utils";

/**
 * A node in a behavior tree.
 */
export type BehaviorNodeSingle<BB extends object> = {
  impl: BehaviorConstructor<BB>;
  key: string;
  child: BehaviorNode<BB> | undefined;
  instance: Behavior | undefined;
};

export type BehaviorNode<BB extends object> =
  | BehaviorNodeSingle<BB>
  | (BehaviorNodeSingle<BB> | undefined)[];

/**
 * Creates a behavior tree node.
 *
 * Takes a constructor implementing Behavior and a unique key. Nodes that are different from the previous tree
 * are removed and replaced. "different" means either the constructor or the key is different.
 *
 * The BB (blackboard) is data shared between all nodes in the tree. It is mutable.
 */
export function behaviorNode<BB extends object>(
  impl: BehaviorConstructor<BB>,
  key?: string,
  child?: BehaviorNode<BB>,
): BehaviorNodeSingle<BB> {
  return {
    impl,
    key: key ?? "",
    child,
    instance: undefined,
  };
}

/**
 * A behavior implementation constructor.
 */
export interface BehaviorConstructor<BB extends object> {
  new (blackboard: BB, key: string): Behavior;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBehaviorConstructor = BehaviorConstructor<any>;

export interface Behavior {
  /**
   * Called when entering this behavior
   */
  enter?(): void;
  /**
   * Called when a tree is updated but this node is not changed. (preorder traversal)
   */
  updatePreorder?(): void;
  /**
   * Called when a tree is updated but this node is not changed. (postorder traversal)
   */
  updatePostorder?(): void;
  /**
   * Called when exiting this behavior
   */
  exit?(): void;
}

/**
 * A behavior tree.
 * https://en.wikipedia.org/wiki/Behavior_tree_(artificial_intelligence,_robotics_and_control)
 *
 * Updating a tree diffs the nodes and calls enter on new nodes and exit on removed nodes.
 */
export class BehaviorTree<BB extends object> {
  root: BehaviorNode<BB> = behaviorNode(class {});

  // whether an update is in progress
  updating: boolean = false;
  // whether another update is requested
  again: boolean = false;

  constructor(
    private fn: (bb: BB) => BehaviorNode<BB>,
    public bb: BB,
  ) {}

  update(): void {
    // flag to scheule an update
    this.again = true;

    if (this.updating) {
      // if this gets called recursively, just return, the outermost call will handle it
      return;
    }

    let updateCount = 0;

    try {
      this.updating = true;
      while (this.again) {
        this.again = false;
        updateCount += 1;
        assertMaxRecursionDepth(updateCount);

        const prev = this.root ?? undefined;
        const next = this.fn(this.bb);
        this.root = next;

        updateTree(prev, next, this.bb, 0);
      }
    } finally {
      this.updating = false;
    }
  }

  findBehavior<T extends AnyBehaviorConstructor>(
    constructor: T,
  ): InstanceType<T> | null {
    return findBehavior(this.root, constructor);
  }
}

function assertMaxRecursionDepth(depth: number) {
  if (depth > 32) {
    throw new Error(
      "Max recursion depth exceeded; this is a bug, please contact support.",
    );
  }
}

function isChanged<BB extends object>(
  prev: BehaviorNode<BB> | undefined,
  next: BehaviorNode<BB> | undefined,
) {
  if (prev === undefined || next === undefined) {
    return true;
  }

  if (Array.isArray(prev) !== Array.isArray(next)) {
    // if it changed from an array to a non-array or vice versa, it is changed
    return true;
  }

  if (Array.isArray(prev) && Array.isArray(next)) {
    // if both are arrays, they aren't "changed" because arrays are functionally the same, but their children might be changed
    return false;
  }

  // they must both be non-arrays here
  assertIsNotArray(prev);
  assertIsNotArray(next);

  return prev.impl !== next.impl || prev.key !== next.key;
}

function updateTree<BB extends object>(
  prev: BehaviorNode<BB> | undefined,
  next: BehaviorNode<BB> | undefined,
  bb: BB,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  if (isChanged(prev, next)) {
    // after we find a change, exit the previous nodes
    if (prev) {
      exitSubtree(prev, depth + 1);
    }
    // then enter the new nodes
    if (next) {
      enterSubtree(next, bb, depth + 1);
    }
  } else {
    // the nodes are equal
    if (Array.isArray(prev) || Array.isArray(next)) {
      // if the nodes are arrays, just update their children
      // (assert they are both arrays to keep typescript happy (we already checked that))
      assertIsArray(prev);
      assertIsArray(next);
      const maxLength = Math.max(prev.length, next.length);
      for (let i = 0; i < maxLength; i++) {
        updateTree(prev[i], next[i], bb, depth + 1);
      }
    } else {
      // if the nodes are not arrays, move the instance to the new node and update its child
      if (next) {
        next.instance = prev?.instance;
      }
      if (prev) {
        prev.instance = undefined;
      }
      next?.instance?.updatePreorder?.();
      updateTree(prev?.child, next?.child, bb, depth + 1);
      next?.instance?.updatePostorder?.();
    }
  }
}

function enterSubtree<BB extends object>(
  node: BehaviorNode<BB>,
  bb: BB,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  // handle parallel nodes
  if (Array.isArray(node)) {
    for (const child of node) {
      if (!child) continue;
      enterSubtree(child, bb, depth + 1);
    }
    return;
  }

  // construct instances and call enter traversing downwards
  node.instance = new node.impl(bb, node.key);
  node.instance.enter?.();
  if (node.child) {
    enterSubtree(node.child, bb, depth + 1);
  }
}

function exitSubtree<BB extends object>(node: BehaviorNode<BB>, depth: number) {
  assertMaxRecursionDepth(depth);

  // handle parallel nodes
  if (Array.isArray(node)) {
    for (const child of node) {
      if (!child) continue;
      exitSubtree(child, depth + 1);
    }
    return;
  }

  // call exit traversing upwards
  if (node.child) {
    exitSubtree(node.child, depth + 1);
  }
  node.instance?.exit?.();
  node.instance = undefined;
}

export function flattenBehaviors<BB extends object>(
  node: BehaviorNode<BB>,
): BehaviorNodeSingle<BB>[] {
  const result: BehaviorNodeSingle<BB>[] = [];
  function traverse(node: BehaviorNode<BB>) {
    if (Array.isArray(node)) {
      for (const child of node) {
        if (!child) continue;
        traverse(child);
      }
    } else {
      result.push(node);
      if (node.child) {
        traverse(node.child);
      }
    }
  }
  traverse(node);
  return result;
}

function findBehavior<BB extends object, T extends AnyBehaviorConstructor>(
  node: BehaviorNode<BB>,
  constructor: T,
): InstanceType<T> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      if (!child) continue;
      const result = findBehavior(child, constructor);
      if (result) {
        return result;
      }
    }
  } else {
    if (node.impl === constructor) {
      return (node.instance as InstanceType<T>) ?? null;
    } else {
      if (node.child) {
        return findBehavior(node.child, constructor);
      }
    }
  }

  return null;
}
