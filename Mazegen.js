import {NORTH, ABOVE, BELOW, EAST, SOUTH, WEST } from './Maze3d.js';
import Maze3d from './Maze3d.js';
import MazeAdapter from './adapter.js';
import Searchable from "./Searchable.js";
import { UniversalDFS } from './search-algorithms/DFS.js';
import { UniversalBFS } from './search-algorithms/BFS.js';
import { UniversalAstar } from './search-algorithms/Astar.js';
class Maze3dGenerator {

    constructor() {
        if (this.constructor == Maze3dGenerator) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }
    generate(x, y, z, seed) {
        throw new Error("The method must be implemented in a subclass");
    }
    measureAlgorithmTime(x, y, z, seed) {
        const starttime = Date.now();
        const maze = this.generate(x, y, z, seed);
        const endtime = Date.now();
        const delta = endtime - starttime;
        const retstring = `generation took ${delta}ms`;
        return { maze, retstring };
    }
}

class SimpleMaze3dGenerator extends Maze3dGenerator {
    /**
    * Generates a maze by removing a bunch of walls at andom and carving a guaranteed path to a randomly placed exit
    */
    constructor() {
        super();
    }
    generate(x, y, z, seed = 1) {
        const maze = new Maze3d(x, y, z);
        for (let _x = 0; _x < maze.length; _x++) {
            for (let _y = 0; _y < maze.width; _y++) {
                for (let _z = 0; _z < maze.height; _z++) {
                    for (let removecount = 0; removecount < Math.floor(Math.random() * 7); removecount++) {
                        maze.remove_wall(_x, _y, _z, Math.floor(Math.random() * 6), false);
                    }
                }
            }
        }

        maze.entrance = [Math.floor(Math.random() * maze.length), Math.floor(Math.random() * maze.width), 0];
        let [currentx, currenty, currentz] = maze.entrance;
        let nextdirection = 0;
        for (let steps = 0; steps < maze.floorsize / 2 + Math.floor(Math.random() * maze.floorsize / 2); steps++) {
            nextdirection = Math.floor(Math.random() * 6);
            let neigh = maze.get_neighbour(currentx, currenty, currentz, nextdirection);
            if (neigh) {
                maze.remove_wall(currentx, currenty, currentz, nextdirection);
                [currentx, currenty, currentz] = neigh;
            }
        }
        maze.exit = [currentx, currenty, currentz];
        return maze;
    }
}

class DFSMaze3dGenerator extends Maze3dGenerator {
    /**
    * Generates a maze using the the random DFS algorihm
    */
    constructor() {
        super();
    }
    generate(x, y, z, seed = 1) {
        const maze = new Maze3d(x, y, z);
        const S = []; //stack for DFS
        const visited = [];
        maze.exit = false;
        maze.entrance = [Math.floor(Math.random() * maze.length), Math.floor(Math.random() * maze.width), 0];
        let [currentx, currenty, currentz] = maze.entrance;
        visited.push(maze.get_cell_id(currentx, currenty, currentz));
        S.push([currentx, currenty, currentz]);
        let neighbours = [];
        let newneighbour;
        let counter = 0;
        while (S.length > 0) {
            neighbours = [];
            for (let direction of [NORTH, ABOVE, BELOW, EAST, SOUTH, WEST]) { //this loop populates the list of current neighbours
                newneighbour = maze.get_neighbour(currentx, currenty, currentz, direction);
                //console.log(newneighbour);
                if (newneighbour && !(visited.includes(maze.get_cell_id(...newneighbour)))) neighbours[direction] = newneighbour;
            }
            //console.log(visited);
            //console.log(neighbours);
            if (neighbours.length > 0) {
                let chosendir = Math.floor(Math.random() * 6); //choose random direction
                //console.log(`choosing direction ${chosendir}`);
                while (neighbours[chosendir] === undefined) chosendir = (chosendir + 1) % 6;//look for alt directions if the neighbour is missing
                let n = neighbours[chosendir];
                //console.log(n);
                maze.remove_wall(currentx, currenty, currentz, chosendir);
                visited.push(maze.get_cell_id(...n));
                S.push(n);
                [currentx, currenty, currentz] = n;
            }

            else {
                //console.log("no neigbours found");
                if ((maze.exit === false) & (counter > Math.floor(maze.floorsize * maze.height / 3))) maze.exit = [currentx, currenty, currentz]; //add an exit at some point
                [currentx, currenty, currentz] = S.pop();
            }
            counter += 1;


        }
        return maze;
    }
}

class AldousBroderMaze3dGenerator extends Maze3dGenerator {
    /**
    * Generates a maze using the Aldous-Broder algorihm, unpredictably slow and inefficient but the maze is unbiased
    */
    constructor() {
        super();
    }
    generate(x, y, z, seed = 1) {
        const maze = new Maze3d(x, y, z);
        const visited = [];
        maze.exit = false;
        maze.entrance = [Math.floor(Math.random() * maze.length), Math.floor(Math.random() * maze.width), 0];
        let [currentx, currenty, currentz] = maze.entrance;
        visited.push(maze.get_cell_id(currentx, currenty, currentz));
        let neighbours = [];
        let newneighbour;
        while (visited.length < maze.floorsize * maze.height) {
            neighbours = [];
            for (let direction of [NORTH, ABOVE, BELOW, EAST, SOUTH, WEST]) { //this loop populates the list of current neighbours
                newneighbour = maze.get_neighbour(currentx, currenty, currentz, direction);
                //console.log(newneighbour);
                if (newneighbour != false) neighbours[direction] = newneighbour;
            }
            //console.log(visited, visited.length);
            //console.log(neighbours);
            let chosendir = Math.floor(Math.random() * 6); //choose random direction
            //console.log(`choosing direction ${chosendir}`);
            while (neighbours[chosendir] === undefined) chosendir = (chosendir + 1) % 6;//look for alt directions if the neighbour is missing
            let n = neighbours[chosendir];
            //console.log(n);
            if (!(visited.includes(maze.get_cell_id(...n)))) {
                //console.log(`adding cell ${maze.get_cell_id(...n)}`)
                maze.remove_wall(currentx, currenty, currentz, chosendir);
                visited.push(maze.get_cell_id(...n));
            }
            if ((maze.exit === false) & (visited.length > Math.floor(maze.floorsize * maze.height / 1.5))) maze.exit = [currentx, currenty, currentz]; //add an exit at some point
            [currentx, currenty, currentz] = n;
        }
        return maze;
    }
}

const g1 = new SimpleMaze3dGenerator();
const g2 = new DFSMaze3dGenerator();
const g3 = new AldousBroderMaze3dGenerator();
const resultmaze = g1.measureAlgorithmTime(300, 300, 1);
//console.log(resultmaze.maze.to_string());
//console.log(resultmaze.retstring);
//console.log(resultmaze.maze.entrance);
//.log(resultmaze.maze.exit);
let a1 = new MazeAdapter(resultmaze.maze);
let dfs = new UniversalDFS();
let bfs = new UniversalBFS();
let astar = new UniversalAstar();
let path1 = (dfs.search(a1));
let path2 = (bfs.search(a1));
let path3 = (astar.search(a1));

//let readablepath = path.map((n) => resultmaze.maze.get_cell_coords(n));
//console.log(path1);
//console.log(resultmaze.maze.to_string(path1));
console.log(dfs.statecounter, "states,", path1.length);
//console.log(resultmaze.maze.to_string(path2));
console.log(bfs.statecounter, "states,", path2.length);
console.log(astar.statecounter, "states,", path3.length);
