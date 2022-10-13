import Searchable from "../Searchable.js";
class PriorityQueue {
    //borrowed priority queue implementation from https://javascript.plainenglish.io/introduction-to-priority-queues-in-javascript-30cfc49b01ee
    constructor() {
      this.values = [];
    }
    
    enqueue(value, priority) {
      let newNode = new Node(value, priority);
      this.values.push(newNode);
    
      let index = this.values.length - 1;
      const element = this.values[index];
      
      while(index > 0) {
        let parentIndex = Math.floor((index - 1) / 2);
        const parent = this.values[parentIndex];
        
        if(element.priority >= parent.priority) break;
        this.values[parentIndex] = element;
        this.values[index] = parent;
        index = parentIndex;
      }
      return this.values;
    }
    
    dequeue() {
      const min = this.values[0];
      const end = this.values.pop();
      if(this.values.length > 0) {
        this.values[0] = end;
        
        let index = 0;
        const length = this.values.length;
        const element = this.values[0];
        
        while(true) {
          let leftIndex = 2 * index + 1;
          let rightIndex = 2 * index + 2;
          let leftChild, rightChild;
          let swap = null;
        
          if(leftIndex < length) {
            leftChild = this.values[leftIndex];
            if(leftChild.priority < element.priority) {
              swap = leftIndex;
            }
          }
          if(rightIndex < length) {
            rightChild = this.values[rightIndex];
            if((swap === null && rightChild.priority < element.priority) || (swap !== null && rightChild.priority < leftChild.priority)) {
              swap = rightIndex;
            }
          }
          if(swap === null) break;
          this.values[index] = this.values[swap];
          this.values[swap] = element;
          index = swap;
        }
      }
      return min;
    }
  }
  
  class Node {
    constructor(value, priority) {
      this.value = value;
      this.priority = priority;
    }
  }


export class UniversalAstar{
    constructor(){
        this.statecounter = 0;
    }
    
    search(searchable){
        function give_return_path(node,tree){
            let currnode = node;
            const path = [];
            path.push(currnode);
            while (tree[currnode] != -1){
                currnode = tree[currnode];
                path.push(currnode);
            }
            path.reverse();
            return path;
            
        }
        
        let frontier = new PriorityQueue; //queue
        let tree = []; //tree lists parents of already visited cells
        let nodescore = []; //distance from start
        let nodescoreH = []; //heurisitc based cost
        let goal = searchable.get_finish_node();
        let currentnode = searchable.get_start_node();
        nodescore[currentnode] = 0;
        nodescoreH[currentnode] = searchable.get_node_heuristic(currentnode,goal);
        let neighbours = [];
        let neigbour;
        let possiblescore;
        tree[currentnode] = -1; //root of the tree
        frontier.enqueue(currentnode,nodescoreH[currentnode]);
        while (frontier.values.length > 0){
            currentnode = frontier.dequeue().value;
            this.statecounter += 1;
            if (currentnode === goal) return give_return_path(currentnode,tree);
            //console.log(currentnode);
            neighbours = searchable.get_node_neighbours(currentnode);
            while (neighbours.length > 0){
                neigbour = neighbours.pop();
                possiblescore = nodescore[currentnode] + 1;
                if ((tree[neigbour] === undefined) || (possiblescore < nodescore[neigbour])){ //if a neighbour is new or a shorter path to the neighbour is found, update neighbours score and parent
                    nodescore[neigbour] = possiblescore;
                    nodescoreH[neigbour] = possiblescore + searchable.get_node_heuristic(neigbour,goal);
                    tree[neigbour] = currentnode;
                    frontier.enqueue(neigbour,nodescoreH[neigbour]);
                }
            }

        }
        return false;

    }

}