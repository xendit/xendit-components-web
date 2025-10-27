import { SdkEventManager } from "../sdk-event-manager";
import { areArraysShallowEqual, ParsedSdkKey } from "../utils";

/**
 * Immutable data passed to every node.
 */
export type SdkData = {
  sdkKey: ParsedSdkKey;
  sdkEvents: SdkEventManager;
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
 * https://en.wikipedia.org/wiki/Behavior_tree_(artificial_intelligence,_robotics_and_control)
 *
 * Takes a constructor implementing Behavior, a subject for that behavior, and a child.
 *
 * A node is considered to be changed if its impl or subject change.
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

/**
 * Updates the behavior tree, calling enter on new nodes and exit on old nodes.
 */
export function behaviorTreeUpdate(
  previousRoot: BehaviorNode<unknown[]> | undefined,
  newRoot: BehaviorNode<unknown[]> | undefined,
  sdkData: SdkData,
) {
  const isChanged =
    previousRoot === undefined ||
    newRoot === undefined ||
    previousRoot.impl !== newRoot.impl ||
    !areArraysShallowEqual(previousRoot.subjects, newRoot.subjects);

  if (isChanged) {
    if (previousRoot) {
      exitSubtree(previousRoot);
    }
    if (newRoot) {
      enterSubtree(newRoot, sdkData);
    }
  } else {
    behaviorTreeUpdate(previousRoot?.child, newRoot?.child, sdkData);
  }
}

function enterSubtree(node: BehaviorNode<unknown[]>, sdkData: SdkData) {
  // construct instances traversing downwards and call enter traversing upwards
  node.instance = new node.impl(sdkData, ...node.subjects);
  if (node.child) {
    enterSubtree(node.child, sdkData);
  }
  node.instance?.enter?.();
}

function exitSubtree(node: BehaviorNode<unknown[]>) {
  // call exit traversing upwards
  if (node.child) {
    exitSubtree(node.child);
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
