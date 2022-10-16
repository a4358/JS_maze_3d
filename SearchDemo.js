import {DFSMaze3dGenerator} from "./Mazegen.js";
import { UniversalDFS } from './search-algorithms/DFS.js';
import { UniversalBFS } from './search-algorithms/BFS.js';
import { UniversalAstar } from './search-algorithms/Astar.js';
import MazeAdapter from './adapter.js';
export default class SearchDemo{
    constructor(){

    }
    run(){
        const generator = new DFSMaze3dGenerator();
        const maze = generator.generate(200,200,1);
        const dfs = new UniversalDFS();
        const bfs = new UniversalBFS();
        const astar = new UniversalAstar();
        const adaptedmaze = new MazeAdapter(maze);
        dfs.search(adaptedmaze);
        bfs.search(adaptedmaze);
        astar.search(adaptedmaze);
        return (`dfs visited ${dfs.statecounter} states, bfs ${bfs.statecounter} states, A* ${astar.statecounter} states`);


    }
}
const demo = new SearchDemo();
console.log(demo.run());