import { SimpleMaze3dGenerator, DFSMaze3dGenerator, AldousBroderMaze3dGenerator } from "./Mazegen.js";
import Maze3d, { NORTH, ABOVE, BELOW, EAST, SOUTH, WEST } from './Maze3d.js';
import { UniversalDFS } from './search-algorithms/DFS.js';
import { UniversalBFS } from './search-algorithms/BFS.js';
import { UniversalAstar } from './search-algorithms/Astar.js';
import MazeAdapter from './adapter.js';

//image assets
const exitimage = document.getElementById("exitimg");
const playerimage = document.getElementById("playerimg");
const upladderimage = document.getElementById("upladderimg");
const downladderimage = document.getElementById("downladderimg");

//control elements
const newgamebtn = document.getElementById('newgamebtn');
const savebtn = document.getElementById('savebtn');
const loadbtn = document.getElementById('loadbtn');
const name = document.getElementById('name');
const solvebtn = document.getElementById('solvebtn');
const hintbtn = document.getElementById('hintbtn');
const rows = document.getElementById('rows');
const columns = document.getElementById('columns');
const layers = document.getElementById('layers');
const generationalg = document.getElementById('genalgs');
const searchalg = document.getElementById('searchalgs');

//variables
let genalg;
let maze;
let adapted_maze;
let gen;
let solver;
let solution;
let solution_recent = false; //shows whether there is no need to regenerate a solution
let srcalg = false;
let currentx;
let currenty;
let currentz;
let cellsize = 50; //size of one cell in px

//canvases and drawing contexts
const canvas = document.getElementById('mazeimage');
const mazectx = canvas.getContext('2d');
const canvas2 = document.getElementById('playercanvas');
const playerctx = canvas2.getContext('2d');

//events
newgamebtn.addEventListener('click', newgame);
savebtn.addEventListener('click', savegame);
loadbtn.addEventListener('click', loadgame);
solvebtn.addEventListener('click', showfullsolution);
hintbtn.addEventListener('click', showhint);
//keyboard input
document.addEventListener('keydown', e => {
    if (document.activeElement != name) {//allow full keyboard control while focused on the text field
        switch (e.code) {
            case 'ArrowUp':
                e.preventDefault();
                move(NORTH);
                break;

            case 'ArrowDown':
                e.preventDefault();
                move(SOUTH);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                move(WEST);
                break;

            case 'ArrowRight':
                e.preventDefault();
                move(EAST);
                break;

            case 'PageDown':
                e.preventDefault();
                move(BELOW);
                break;

            case 'PageUp':
                e.preventDefault();
                move(ABOVE);
                break;

            case 'KeyW':
                e.preventDefault();
                move(NORTH);
                break;

            case 'KeyS':
                e.preventDefault();
                move(SOUTH);
                break;

            case 'KeyA':
                e.preventDefault();
                move(WEST);
                break;

            case 'KeyD':
                e.preventDefault();
                move(EAST);
                break;

        }
    }
});


/**
 * saves game parameters into a local file with current entered name
 */
function savegame() {
    let gameinfo = {
        maze: maze,
        otherdata: [currentx, currenty, currentz, genalg]
    }
    localStorage.setItem(name.value, JSON.stringify(gameinfo));
}

/**
 * load game parameters from local file with current entered name
 */
function loadgame() {
    let gameinfo = JSON.parse(localStorage.getItem(name.value));
    maze = new Maze3d(gameinfo.maze.length, gameinfo.maze.width, gameinfo.maze.height);
    maze.cells = gameinfo.maze.cells;
    maze.entrance = gameinfo.maze.entrance;
    maze.exit = gameinfo.maze.exit;
    [currentx, currenty, currentz, genalg] = [...gameinfo.otherdata];
    [rows.value, columns.value, layers.value, generationalg.value] = [maze.width, maze.length, maze.height, genalg];
    solution_recent = false;
    adapted_maze = new MazeAdapter(maze);
    drawmaze();

}

/** renders the maze level player is currently on*/
function drawmaze() {
    canvas.hidden = false;
    canvas2.hidden = false;
    canvas.width = (maze.length) * cellsize;
    canvas.height = (maze.width) * cellsize;
    canvas2.width = (maze.length) * cellsize;
    canvas2.height = (maze.width) * cellsize;
    mazectx.clearRect(0, 0, canvas.width, canvas.height);

    /**
     * internal function to draw a sincle cell with canvas methods,  based on its x and y values in the maze
     */
    function drawcell(x, y, cell) {
        mazectx.strokeStyle = "black";
        mazectx.beginPath();
        mazectx.moveTo(x * cellsize, y * cellsize);
        if (cell[NORTH]) mazectx.lineTo((x + 1) * cellsize, y * cellsize);
        mazectx.moveTo((x + 1) * cellsize, y * cellsize);
        if (cell[EAST]) mazectx.lineTo((x + 1) * cellsize, (y + 1) * cellsize);
        mazectx.moveTo((x + 1) * cellsize, (y + 1) * cellsize);
        if (cell[SOUTH]) mazectx.lineTo(x * cellsize, (y + 1) * cellsize);
        mazectx.moveTo(x * cellsize, (y + 1) * cellsize);
        if (cell[WEST]) mazectx.lineTo(x * cellsize, y * cellsize);
        mazectx.stroke();
        if (maze.exit[0] === x && maze.exit[1] === y && maze.exit[2] === currentz)
            mazectx.drawImage(exitimage, x * cellsize, y * cellsize, cellsize, cellsize);
        if (!cell[ABOVE]) {
            mazectx.drawImage(upladderimage, x * cellsize, y * cellsize, cellsize, cellsize);
        }
        if (!cell[BELOW]) {
            mazectx.drawImage(downladderimage, x * cellsize, y * cellsize, cellsize, cellsize);
        }
    }

    for (let y = 0; y < maze.width; y++) {
        for (let x = 0; x < maze.length; x++) {
            drawcell(x, y, maze.get_cell(x, y, currentz));
        }
    }
    drawplayer();
}

/** draws the player sprite at the current coordinates*/
function drawplayer() {
    playerctx.drawImage(playerimage, currentx * cellsize, currenty * cellsize, cellsize, cellsize);
}

/** clears a player sprite-sized space at the current coordinates*/
function clearplayer() {
    playerctx.clearRect(currentx * cellsize, currenty * cellsize, cellsize, cellsize);
}

/**
 * generates a maze (+search adapter) based on current entered parameters, sets current coordinates to its start and renders it
 */
function newgame() {
    const y = rows.value;
    const x = columns.value;
    const z = layers.value;
    genalg = generationalg.value;
    //alert(`${x},${y},${z},${genalg}`);
    solution_recent = false;
    switch (genalg) {
        case 'randomgen':
            gen = new SimpleMaze3dGenerator();
            break;
        case 'dfsgen':
            gen = new DFSMaze3dGenerator();
            break;
        case 'abgen':
            gen = new AldousBroderMaze3dGenerator();
            break;
    }
    maze = gen.generate(x, y, z);
    adapted_maze = new MazeAdapter(maze);
    console.log(maze.to_string([], maze.entrance[2]));
    currentx = maze.entrance[0];
    currenty = maze.entrance[1];
    currentz = maze.entrance[2];
    drawmaze();
}

/** updates current coordinates and calls a player redraw if the move is legal */
function move(direction) {
    if (maze.get_cell(currentx, currenty, currentz)[direction] === false) {
        solution_recent = false;
        clearplayer();
        [currentx, currenty, currentz] = maze.get_neighbour(currentx, currenty, currentz, direction);
        if (direction === ABOVE || direction === BELOW) {
            drawmaze();
        }
        else
            clearplayer();
            drawplayer();
        if (maze.exit[0] === currentx && maze.exit[1] === currenty && maze.exit[2] === currentz) victory();
    }
}

/** shows a victory screen */
function victory() {
    alert("congratulations! you got to the exit. feel free to wander or restart.")
}

/** creates a solution based on the currently selected algorithm */
function solve() {
    srcalg = searchalg.value;
    //console.log(srcalg);
    switch (srcalg) {
        case 'dfs':
            solver = new UniversalDFS();
            break;
        case 'bfs':
            solver = new UniversalBFS();
            break;
        case 'astar':
            solver = new UniversalAstar();
            break;
    }
    adapted_maze.set_start_node(currentx, currenty, currentz);
    solution = solver.search(adapted_maze);
    solution_recent = true;
}

/** displays a solution if one is fresh, calls solve to obtain one if not */
function showfullsolution() {
    if (solution_recent === false || searchalg.value != srcalg) solve();
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    playerctx.strokeStyle = 'blue';

    playerctx.beginPath();
    let i = 0;
    while (i < solution.length) {
        let cell = maze.get_cell_coords(solution[i]);
        if (cell[2] === currentz) {
            //playerctx.lineTo((2 * cell[0] + 1) * cellsize + cellsize / 2, (2 * cell[1] + 1) * cellsize + cellsize / 2);
            playerctx.lineTo(cell[0] * cellsize + cellsize / 2, cell[1] * cellsize + cellsize / 2);
        }
        i++;

    }
    playerctx.stroke();
}

/** displays the first move of the current solution if it is fresh, calls solve to obtain one if not */
function showhint() {
    if (solution_recent === false || searchalg.value != srcalg) solve();
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    playerctx.strokeStyle = 'blue';
    playerctx.beginPath();
    let i = 0;
    let usedpoints = 0;
    while (usedpoints < 2 && solution.length > i) {
        let cell = maze.get_cell_coords(solution[i]);
        if (cell[2] === currentz) {
            usedpoints += 1;
            //playerctx.lineTo((2 * cell[0] + 1) * cellsize + cellsize / 2, (2 * cell[1] + 1) * cellsize + cellsize / 2);
            playerctx.lineTo(cell[0] * cellsize + cellsize / 2, cell[1] * cellsize + cellsize / 2);
        }
        i++;

    }
    playerctx.stroke();
}