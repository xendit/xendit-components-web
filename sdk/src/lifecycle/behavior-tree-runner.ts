import { SdkEventManager } from "../sdk-event-manager";
import { areArraysShallowEqual, ParsedSdkKey } from "../utils";

/**
 * Immutable data passed to every node.
 */
export type SdkData = {
  sdkKey: ParsedSdkKey;
  sdkEvents: SdkEventManager;
  mock: boolean;
};

/**
 * A node in a behavior tree.
 */
export type BehaviorNode<SubjectsType extends unknown[]> = {
  impl: BehaviorConstructor<SubjectsType>;
  subjects: SubjectsType;
  child: BehaviorNode<unknown[]> | undefined;
  instance: Behavior | undefined;
};

/**
 * Creates a behavior tree node.
 *
 * Takes a constructor implementing Behavior, args for that constructor, and a child.
 */
export function behaviorNode<
  SubjectsType extends unknown[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChildNode extends BehaviorNode<any>,
>(
  impl: BehaviorConstructor<SubjectsType>,
  subjects: SubjectsType,
  child?: ChildNode,
): BehaviorNode<SubjectsType> {
  return {
    impl,
    subjects,
    child,
    instance: undefined,
  };
}

/**
 * A behavior implementation constructor.
 */
export interface BehaviorConstructor<SubjectsType extends unknown[]> {
  new (sdkEvents: SdkData, ...subjects: SubjectsType): Behavior;
}

export interface Behavior {
  /**
   * Called when entering this behavior
   */
  enter(): void;
  /**
   * Called when exiting this behavior
   */
  exit?(): void;
}

class EmptyBehavior implements Behavior {
  enter() {}
}

/**
 * A behavior tree.
 * https://en.wikipedia.org/wiki/Behavior_tree_(artificial_intelligence,_robotics_and_control)
 *
 * Updating a tree diffs the nodes and calls enter on new nodes and exit on removed nodes.
 */
export class BehaviorTree {
  root: BehaviorNode<unknown[]> = behaviorNode(EmptyBehavior, []);

  nextRoot: BehaviorNode<unknown[]> | null = null;
  updating: boolean = false;

  constructor(private sdkData: SdkData) {}

  update(newRoot: BehaviorNode<unknown[]>): void {
    this.nextRoot = newRoot;
    if (this.updating) {
      // if this gets called recursively, just return, the outermost call will handle it
      return;
    }

    this.updating = true;

    while (this.nextRoot) {
      const prev = this.root ?? undefined;
      const next = this.nextRoot;
      this.nextRoot = null;
      this.root = next;

      updateTree(prev, next, this.sdkData, 0);
    }
    this.updating = false;
  }

  findBehavior<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends BehaviorConstructor<any>,
  >(constructor: T): InstanceType<T> | null {
    let node: BehaviorNode<unknown[]> | undefined = this.root;
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

function updateTree(
  prev: BehaviorNode<unknown[]> | undefined,
  next: BehaviorNode<unknown[]> | undefined,
  sdkData: SdkData,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  // decend down the tree until there's a change
  const isChanged =
    prev === undefined ||
    next === undefined ||
    prev.impl !== next.impl ||
    !areArraysShallowEqual(prev.subjects, next.subjects);

  if (isChanged) {
    // after we find a change, exit the previous nodes
    if (prev) {
      exitSubtree(prev, depth + 1);
    }

    // then enter the new nodes
    if (next) {
      enterSubtree(next, sdkData, depth + 1);
    }
  } else {
    // the nodes are the same, copy the instance to the new tree
    if (next) {
      next.instance = prev?.instance;
    }
    if (prev) {
      prev.instance = undefined;
    }
    updateTree(prev?.child, next?.child, sdkData, depth + 1);
  }
}

function enterSubtree(
  node: BehaviorNode<unknown[]>,
  sdkData: SdkData,
  depth: number,
) {
  assertMaxRecursionDepth(depth);

  // construct instances and call enter traversing downwards
  node.instance = new node.impl(sdkData, ...node.subjects);
  node.instance.enter?.();
  if (node.child) {
    enterSubtree(node.child, sdkData, depth + 1);
  }
}

function exitSubtree(node: BehaviorNode<unknown[]>, depth: number) {
  assertMaxRecursionDepth(depth);

  // call exit traversing upwards
  if (node.child) {
    exitSubtree(node.child, depth + 1);
  }
  node.instance?.exit?.();
  node.instance = undefined;
}

export function findBehaviorNodeByType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends BehaviorConstructor<any>,
>(node: BehaviorNode<unknown[]>, constructor: T): InstanceType<T> | null {
  if (node.impl === constructor) {
    return node.instance ? (node.instance as InstanceType<T>) : null;
  }
  if (node.child) {
    return findBehaviorNodeByType(node.child, constructor);
  }
  return null;
}
