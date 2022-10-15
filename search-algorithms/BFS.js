/** BFS search of a universal search problem represented by Searchable */
export class UniversalBFS {
    constructor() {
        this.statecounter = 0;
    }

    search(searchable) {
        function givereturnpath(node, tree) {
            let currnode = node;
            const path = [];
            path.push(currnode);
            while (tree[currnode] != -1) {
                currnode = tree[currnode];
                path.push(currnode);
            }
            path.reverse();
            return path;

        }
        let tree = [];
        let frontier = []; //queue
        let goal = searchable.get_finish_node();
        let currentnode = searchable.get_start_node();
        let neighbours = [];
        let neigbour;
        let queueindex = 0;
        tree[currentnode] = -1; //root of the tree
        frontier.push(currentnode);
        while (frontier.length > 0) {
            currentnode = frontier[queueindex];
            queueindex += 1;
            this.statecounter += 1;
            if (currentnode === goal) return givereturnpath(currentnode, tree);
            neighbours = searchable.get_node_neighbours(currentnode);
            while (neighbours.length > 0) {
                neigbour = neighbours.pop();
                if (tree[neigbour] === undefined) {
                    tree[neigbour] = currentnode;
                    frontier.push(neigbour);
                }
            }

        }
        return false;

    }

}