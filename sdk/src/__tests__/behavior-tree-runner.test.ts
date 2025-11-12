import { describe, expect, it } from "vitest";
import { behaviorNode, BehaviorTree } from "../lifecycle/behavior-tree-runner";
import { assert } from "../utils";

type BB = {
  testCase?: string;
  updateAgain?: () => void;
};

// index to track order of enter/update/exit calls
let i = 1;

// behavier that counts its enter/update/exit calls
class TestBehavior {
  enterCalled: number | null = null;
  updateCalled: number | null = null;
  exitCalled: number | null = null;

  constructor(
    public bb: BB,
    public key: string,
  ) {}

  enter() {
    this.enterCalled = i++;
  }

  update() {
    this.updateCalled = i++;
  }

  exit() {
    this.exitCalled = i++;
  }
}

// behavior that's the same but has a different class
class TestBehavior2 extends TestBehavior {}

class TestBehavior3 extends TestBehavior {}

// behavior that switches the test case number to "SINGLE" when entered
class TestBehavior4 extends TestBehavior {
  enter() {
    super.enter();
    this.bb.testCase = "SINGLE";
    this.bb.updateAgain?.();
  }
}

function testBehaviorTree(bb: BB) {
  switch (bb.testCase) {
    case "SINGLE":
      // case with single node
      return behaviorNode(TestBehavior);
    case "SINGLE2":
      // case with a different single node
      return behaviorNode(TestBehavior2);
    case "NESTED":
      // case with nested nodes
      return behaviorNode(
        TestBehavior,
        undefined,
        behaviorNode(
          TestBehavior2,
          undefined,
          behaviorNode(TestBehavior3, undefined),
        ),
      );
    case "RECURSIVE_UPDATE":
      // case with a different single node
      return behaviorNode(TestBehavior4);
    case "INFINITE_RECURSION": {
      // case with a different single node
      const node = behaviorNode(TestBehavior);
      node.child = node;
      return node;
    }
    default:
      throw new Error("Invalid test case");
  }
}

describe("Behavior Tree", () => {
  it("should call enter when creating new tree nodes", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    let node;

    tree.bb.testCase = "SINGLE";
    tree.update(); // create TestBehavior
    node = tree.findBehavior(TestBehavior);
    assert(node);
    expect(node.enterCalled).toBeTruthy();
    expect(node.updateCalled).toBeNull();
    expect(node.exitCalled).toBeNull();

    tree.bb.testCase = "NESTED";
    tree.update(); // add TestBehavior2 under TestBehavior
    node = tree.findBehavior(TestBehavior2);
    assert(node);
    expect(node.enterCalled).toBeTruthy();
    expect(node.updateCalled).toBeNull();
    expect(node.exitCalled).toBeNull();
  });

  it("should call exit when removing nodes", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "SINGLE";
    tree.update(); // create TestBehavior
    const node = tree.findBehavior(TestBehavior);
    assert(node);

    tree.bb.testCase = "SINGLE2";
    tree.update(); // change TestBehavior to TestBehavior2
    expect(node).toBeDefined();
    expect(node.enterCalled).toBeTruthy();
    expect(node.updateCalled).toBeNull();
    expect(node.exitCalled).toBeTruthy();
  });

  it("should call exit recursively, bottom up", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "NESTED";
    tree.update(); // create TestBehavior, TestBehavior2, TestBehavior3
    const node = tree.findBehavior(TestBehavior);
    const node2 = tree.findBehavior(TestBehavior2);
    const node3 = tree.findBehavior(TestBehavior3);
    assert(node);
    assert(node2);
    assert(node3);

    tree.bb.testCase = "SINGLE";
    tree.update(); // remove TestBehavior3 then TestBehavior2
    expect(node3.exitCalled).toBeTruthy();
    expect(node2.exitCalled).toBeTruthy();
    expect(node.exitCalled).toBeNull();

    // child node exit should be called before parent node exit
    expect(node2.exitCalled).toBeLessThan(node.exitCalled ?? Infinity);
    expect(node3.exitCalled).toBeLessThan(node2.exitCalled ?? Infinity);
  });

  it("should call update when existing nodes are not changed", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "NESTED";
    tree.update(); // create TestBehavior, TestBehavior2, TestBehavior3
    const node = tree.findBehavior(TestBehavior);
    const node2 = tree.findBehavior(TestBehavior2);
    const node3 = tree.findBehavior(TestBehavior3);
    assert(node);
    assert(node2);
    assert(node3);

    expect(node.updateCalled).toBeNull();
    expect(node2.updateCalled).toBeNull();
    expect(node3.updateCalled).toBeNull();

    tree.update(); // both nodes are unchanged, should call update

    expect(node.updateCalled).toBeTruthy();
    expect(node2.updateCalled).toBeTruthy();
    expect(node3.updateCalled).toBeTruthy();

    // parent node update should be called after child node update
    expect(node.updateCalled).toBeGreaterThan(node2.updateCalled ?? 0);
    expect(node2.updateCalled).toBeGreaterThan(node3.updateCalled ?? 0);
  });

  it("should schedule recursive updates", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "RECURSIVE_UPDATE";
    tree.bb.updateAgain = () => {
      tree.update();
    };
    tree.update(); // create TestBehavior3 which should immediently switch to TestBehavior

    const node = tree.findBehavior(TestBehavior);
    expect(node).toBeDefined();
  });

  it("should throw on too-deep recursion", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "INFINITE_RECURSION";
    expect(() => {
      tree.update();
    }).toThrow(/Max recursion depth exceeded; .*/);
  });

  it("should be unable to find behaviors that don't exist", () => {
    const tree = new BehaviorTree<BB>(testBehaviorTree, {});

    tree.bb.testCase = "NESTED";
    tree.update();

    const node = tree.findBehavior(TestBehavior4);
    expect(node).toBeNull();
  });
});
