import { SimpleMaze3dGenerator, DFSMaze3dGenerator, AldousBroderMaze3dGenerator } from "./Mazegen.js";
import Maze3d, { NORTH, ABOVE, BELOW, EAST, SOUTH, WEST } from './Maze3d.js';
import { UniversalDFS } from './search-algorithms/DFS.js';
import { UniversalBFS } from './search-algorithms/BFS.js';
import { UniversalAstar } from './search-algorithms/Astar.js';
import MazeAdapter from './adapter.js';


const exitimage = document.getElementById("exitimg");
const playerimage = document.getElementById("playerimg");
const ladderimage = document.getElementById("ladderimg");
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
let genalg;
let maze;
let adapted_maze;
let gen;
let solver;
let solution;
let solution_recent = false;
let srcalg = false;
let currentx;
let currenty;
let currentz;
let cellsize = 20;



const canvas = document.getElementById('mazeimage');
const mazectx = canvas.getContext('2d');
const canvas2 = document.getElementById('playercanvas');
const playerctx = canvas2.getContext('2d');




newgamebtn.addEventListener('click', newgame);
savebtn.addEventListener('click', savegame);
loadbtn.addEventListener('click', loadgame);
solvebtn.addEventListener('click', showfullsolution);
hintbtn.addEventListener('click', showhint);
document.addEventListener('keydown', e => {
    
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


    }
});

function savegame(){
    let gameinfo = {
        maze: maze,
        otherdata: [currentx, currenty, currentz, genalg]
    }
    localStorage.setItem(name.value, JSON.stringify(gameinfo));
}

function loadgame(){
    let gameinfo = JSON.parse(localStorage.getItem(name.value));
    maze = new Maze3d(maze.width, maze.length, maze.height);
    maze.cells = gameinfo.maze.cells;
    maze.entrance = gameinfo.maze.entrance;
    maze.exit = gameinfo.maze.exit;
    console.log(gameinfo.otherdata);
    [currentx, currenty, currentz, genalg] = [...gameinfo.otherdata];
    [rows.value, columns.value, layers.value, generationalg.value] = [maze.width, maze.length, maze.height, genalg];
    solution_recent = false;
    adapted_maze = new MazeAdapter(maze);
    drawmaze();

}



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

    //console.log(maze.to_string([], 0));
    currentx = maze.entrance[0];
    currenty = maze.entrance[1];
    currentz = maze.entrance[2];
    drawmaze();
}

function drawmaze() {
    canvas.hidden = false;
    canvas2.hidden = false;
    const linelength = 2 * maze.length + 1;
    const lineheight = 2 * maze.width + 1;
    const stringrepr = maze.to_string([], currentz);
    canvas.width = (linelength) * cellsize;
    canvas.height = (lineheight) * cellsize;
    canvas2.width = (linelength) * cellsize;
    canvas2.height = (lineheight) * cellsize;
    mazectx.clearRect(0, 0, canvas.width, canvas.height);
    let i = 0;
    for (let y = 0; y < lineheight; y++) {
        for (let x = 0; x < linelength; x++) {
            if (stringrepr[i] === '█') {
                mazectx.fillRect(x * cellsize, y * cellsize, cellsize, cellsize);
            }
            if (stringrepr[i] === 'G') {
                mazectx.drawImage(exitimage, x * cellsize, y * cellsize, cellsize, cellsize);
            }
            if (stringrepr[i] === '↓' || stringrepr[i] === '↑' || stringrepr[i] === '↕') {
                mazectx.drawImage(ladderimage, x * cellsize, y * cellsize, cellsize, cellsize);
            }
            i++;
        }
        i++;
    }
    drawplayer();

}
function clearplayer() {
    playerctx.clearRect((2 * currentx + 1) * cellsize, (2 * currenty + 1) * cellsize, cellsize, cellsize);
}
function drawplayer() {
    playerctx.drawImage(playerimage, (2 * currentx + 1) * cellsize, (2 * currenty + 1) * cellsize, cellsize, cellsize);
}
function move(direction) {
    if (maze.get_cell(currentx, currenty, currentz)[direction] === false) {
        solution_recent = false;
        clearplayer();
        [currentx, currenty, currentz] = maze.get_neighbour(currentx, currenty, currentz, direction);
        if (direction === ABOVE || direction === BELOW) {
            drawmaze();
        }
        else
            drawplayer();
        if (maze.exit[0] === currentx && maze.exit[1] === currenty && maze.exit[2] === currentz) victory();
    }
}
function victory() {
    alert("congratulations! you got to the exit. feel free to wander or restart.")
}
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
function showfullsolution() {
    if (solution_recent === false || searchalg.value != srcalg) solve();
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    playerctx.strokeStyle = 'blue';

    playerctx.beginPath();
    let i=0;
    while (solution.length > i){
        let cell = maze.get_cell_coords(solution[i]);
        if (cell[2] === currentz){
        playerctx.lineTo((2 * cell[0] + 1) * cellsize + cellsize / 2, (2 * cell[1] + 1) * cellsize + cellsize / 2);
        }
        i++;
        
    }
    playerctx.stroke();
}
function showhint() {
    if (solution_recent === false || searchalg.value != srcalg) solve();
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    playerctx.strokeStyle = 'blue';
    playerctx.beginPath();
    let i = 0;
    let usedpoints = 0;
    while (usedpoints < 2 && solution.length > i){
        let cell = maze.get_cell_coords(solution[i]);
        if (cell[2] === currentz){
            usedpoints += 1;
            playerctx.lineTo((2 * cell[0] + 1) * cellsize + cellsize / 2, (2 * cell[1] + 1) * cellsize + cellsize / 2);
        }
        i++;
        
    }
    playerctx.stroke();

}