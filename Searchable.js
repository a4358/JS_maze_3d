/** abstract class to represent graph/maze search problems */
export default class Searchable {
    constructor() {
        if (this.constructor == Searchable) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    get_start_node() {
        throw new Error("The method must be implemented");
    }

    get_finish_node() {
        throw new Error("The method must be implemented");
    }

    get_node_neighbours(node) {
        throw new Error("The method must be implemented");
    }

    get_node_heuristic(node1, node2) {
        throw new Error("The method must be implemented");
    }
}