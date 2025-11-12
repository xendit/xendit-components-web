/**
 * A node in a behavior tree.
 */
export type BehaviorNode<BB extends object> = {
  impl: BehaviorConstructor<BB>;
  key: string;
  child: BehaviorNode<BB> | undefined;
  instance: Behavior | undefined;
};

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
): BehaviorNode<BB> {
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

export interface Behavior {
  /**
   * Called when entering this behavior
   */
  enter?(): void;
  /**
   * Called when a tree is updated but this node is not changed.
   */
  update?(): void;
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

  findBehavior<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends BehaviorConstructor<any>,
  >(constructor: T): InstanceType<T> | null {
    let node: BehaviorNode<BB> | undefined = this.root;
    while (node) {
      if (node.impl === constructor) {
        return node.instance ? (node.instance as InstanceType<T>) : null;
      }
      node = node.child;
    }
    return null;
  }
}

function assertMaxRecursionDepth(depth: number) {
  if (depth > 32) {
    throw new Error(
      "Max recursion depth exceeded; this is a bug, please contact support.",
    );
  }
}

function updateTree<BB extends object>(
  prev: BehaviorNode<BB> | undefined,
  next: BehaviorNode<BB> | undefined,
  bb: BB,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  // descend down the tree until there's a change
  const isChanged =
    prev === undefined ||
    next === undefined ||
    prev.impl !== next.impl ||
    prev.key !== next.key;

  if (isChanged) {
    // after we find a change, exit the previous nodes
    if (prev) {
      exitSubtree(prev, depth + 1);
    }

    // then enter the new nodes
    if (next) {
      enterSubtree(next, bb, depth + 1);
    }
  } else {
    // the nodes are the same, copy the instance to the new tree
    if (next) {
      next.instance = prev?.instance;
    }
    if (prev) {
      prev.instance = undefined;
    }
    updateTree(prev?.child, next?.child, bb, depth + 1);
    next?.instance?.update?.();
  }
}

function enterSubtree<BB extends object>(
  node: BehaviorNode<BB>,
  bb: BB,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  // construct instances and call enter traversing downwards
  node.instance = new node.impl(bb, node.key);
  node.instance.enter?.();
  if (node.child) {
    enterSubtree(node.child, bb, depth + 1);
  }
}

function exitSubtree<BB extends object>(node: BehaviorNode<BB>, depth: number) {
  assertMaxRecursionDepth(depth);

  // call exit traversing upwards
  if (node.child) {
    exitSubtree(node.child, depth + 1);
  }
  node.instance?.exit?.();
  node.instance = undefined;
}
