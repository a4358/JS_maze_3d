import Searchable from "./Searchable.js";
import Maze3d from "./Maze3d.js";
import {NORTH, ABOVE, BELOW, EAST, SOUTH, WEST } from './Maze3d.js';


export default class MazeAdapter extends Searchable{
    constructor(maze){
        super();
        this.maze = maze;
    }
    get_start_node(){
        return this.maze.get_cell_id(...this.maze.entrance);
    }
    get_finish_node(){
        return this.maze.get_cell_id(...this.maze.exit);
    }
    get_node_neighbours(node){
        let newneighbour = false;
        const neighbours = [];
            for (let direction of [NORTH, ABOVE, BELOW, EAST, SOUTH, WEST]) { //this loop populates the list of current neighbours
                if (this.maze.get_cell(...this.maze.get_cell_coords(node))[direction] === false){
                    newneighbour = this.maze.get_neighbour(...this.maze.get_cell_coords(node),direction);
                    //console.log(this.maze.get_cell_coords(node));
                    //console.log(newneighbour);
                    if (newneighbour) neighbours.push(this.maze.get_cell_id(...newneighbour));
                }
            }
        return neighbours;
    }
    get_node_heuristic(node1,node2){
        let cell1 = [];
        let cell2 = [];
        
        cell1 = this.maze.get_cell_coords(node1);
        cell2 = this.maze.get_cell_coords(node2);
        let deltas = cell1.map((n, i) => Math.abs(n - cell2[i]));
        return deltas.reduce((partialSum, a) => partialSum + a, 0);;
    }
}
