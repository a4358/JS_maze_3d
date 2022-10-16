import { NORTH, ABOVE, BELOW, EAST, SOUTH, WEST } from './Maze3d.js';
import Maze3d from './Maze3d.js';

/** Abstract base generator class */
class Maze3dGenerator {
    constructor() {
        if (this.constructor == Maze3dGenerator) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    generate(x, y, z) {
        throw new Error("The method must be implemented in a subclass");
    }

    measureAlgorithmTime(x, y, z) {
        const starttime = Date.now();
        const maze = this.generate(x, y, z);
        const endtime = Date.now();
        const delta = endtime - starttime;
        const retstring = `generation took ${delta}ms`;
        return { maze, retstring };
    }
}

/**Generates a maze by removing a bunch of walls at andom and carving a guaranteed path to a randomly placed exit*/
export class SimpleMaze3dGenerator extends Maze3dGenerator {
    constructor() {
        super();
    }

    generate(x, y, z) {
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

/**Generates a maze using the the random DFS algorihm*/
export class DFSMaze3dGenerator extends Maze3dGenerator {
    constructor() {
        super();
    }

    generate(x, y, z) {
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
                if (newneighbour && !(visited.includes(maze.get_cell_id(...newneighbour)))) neighbours[direction] = newneighbour;
            }
            if (neighbours.length > 0) {
                let chosendir = Math.floor(Math.random() * 6); //choose random direction
                while (neighbours[chosendir] === undefined) chosendir = (chosendir + 1) % 6;//look for alt directions if the neighbour is missing
                let n = neighbours[chosendir];
                maze.remove_wall(currentx, currenty, currentz, chosendir);
                visited.push(maze.get_cell_id(...n));
                S.push(n);
                [currentx, currenty, currentz] = n;
            }

            else {
                if ((maze.exit === false) & (counter > Math.floor(maze.floorsize * maze.height / 3))) maze.exit = [currentx, currenty, currentz]; //add an exit at some point
                [currentx, currenty, currentz] = S.pop();
            }
            counter += 1;

        }
        return maze;
    }
}

/** Generates a maze using the Aldous-Broder algorihm, unpredictably slow and inefficient but the maze is unbiased*/
export class AldousBroderMaze3dGenerator extends Maze3dGenerator {
    
    constructor() {
        super();
    }
    generate(x, y, z) {
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
                if (newneighbour != false) neighbours[direction] = newneighbour;
            }
            let chosendir = Math.floor(Math.random() * 6); //choose random direction
            while (neighbours[chosendir] === undefined) chosendir = (chosendir + 1) % 6;//look for alt directions if the neighbour is missing
            let n = neighbours[chosendir];
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
