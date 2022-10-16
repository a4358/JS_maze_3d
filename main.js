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
const resetbtn = document.getElementById('resetbtn');
const name = document.getElementById('name');
const solvebtn = document.getElementById('solvebtn');
const hintbtn = document.getElementById('hintbtn');
const autobtn = document.getElementById('automovebtn');
const rows = document.getElementById('rows');
const columns = document.getElementById('columns');
const layers = document.getElementById('layers');
const generationalg = document.getElementById('genalgs');
const searchalg = document.getElementById('searchalgs');
const lowresmode = document.getElementById('lowresmode'); //forbid/allow/force substitution of images into lowres/high vis graphics
const bonuscarving = document.getElementById('bonuscarving');
const automovespeed = document.getElementById('speed');//ms to traverse one tile in auto mode

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
let cellsize = 50; //default size of one cell in px
const mincellsize = 5 //minimal cell size allowed before scrollbars appear instead of scaling
let solutionvisible = false; //flag for when a solution is being shown
let automoving = false; //flag for what automove is engaged
let movementinterval = false; //storage for automove interval id

//canvases and drawing contexts
const canvas = document.getElementById('mazeimage');
const mazectx = canvas.getContext('2d');
const canvas2 = document.getElementById('playercanvas');
const playerctx = canvas2.getContext('2d');

//events
newgamebtn.addEventListener('click', newgame);
savebtn.addEventListener('click', savegame);
loadbtn.addEventListener('click', loadgame);
resetbtn.addEventListener('click', resetposition);
solvebtn.addEventListener('click', showfullsolution);
hintbtn.addEventListener('click', showhint);
autobtn.addEventListener('click', automove);
lowresmode.addEventListener('change', drawmaze);
searchalg.addEventListener('change', e => {
    stopmoving();
    if (solutionvisible) {
        hidesolution();
        showfullsolution();
    }
});
//keyboard input
document.addEventListener('keydown', e => {
    if ((document.activeElement != (name || rows || columns || layers)) && (automoving === false)) {//allow full keyboard control while focused on the text field,
        //do not change movement during automove
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

/** saves game parameters into a local file with current entered name */
function savegame() {
    let gameinfo = {
        maze: maze,
        otherdata: [currentx, currenty, currentz, genalg]
    }
    localStorage.setItem(name.value, JSON.stringify(gameinfo));
}

/** load game parameters from local file with current entered name */
function loadgame() {
    stopmoving();
    let gameinfo = JSON.parse(localStorage.getItem(name.value));
    maze = new Maze3d(gameinfo.maze.length, gameinfo.maze.width, gameinfo.maze.height);
    maze.cells = gameinfo.maze.cells;
    maze.entrance = gameinfo.maze.entrance;
    maze.exit = gameinfo.maze.exit;
    [currentx, currenty, currentz, genalg] = [...gameinfo.otherdata];
    [rows.value, columns.value, layers.value, generationalg.value] = [maze.width, maze.length, maze.height, genalg];
    solution_recent = false;
    adapted_maze = new MazeAdapter(maze);
    choosecellsize();
    drawmaze();
    hidesolution();

}

/** chooses an optimal cell size depending on maze size and display size */
function choosecellsize() {
    let candidatesizex = 0.72 * window.innerWidth / maze.length; //multiplier is to leave space for the sidebar
    let candidatesizey = 0.95 * window.innerHeight / maze.width;
    cellsize = Math.max(mincellsize, Math.min((Math.floor(candidatesizex)), (Math.floor(candidatesizey))));
    //cells will be as big as possible while still quare and fitting on the screen, otherwise they will not go below minimum size and the page will need to be scrolled
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
        if (maze.exit[0] === x && maze.exit[1] === y && maze.exit[2] === currentz) {
            if ((cellsize <= mincellsize * 2 && lowresmode.value === "1") || (lowresmode.value === "2")) {
                mazectx.fillStyle = "#0000FF";
                mazectx.fillRect(x * cellsize + 1, y * cellsize + 1, cellsize - 2, cellsize - 2);
            }
            else mazectx.drawImage(exitimage, x * cellsize, y * cellsize, cellsize, cellsize);
        }
        if (!cell[ABOVE]) {
            if ((cellsize <= mincellsize * 2 && lowresmode.value === "1") || (lowresmode.value === "2")) {
                mazectx.fillStyle = "#00FF00";
                mazectx.fillRect(x * cellsize + cellsize / 2, y * cellsize, cellsize / 2 - 2, cellsize);
            }
            else mazectx.drawImage(upladderimage, x * cellsize, y * cellsize, cellsize, cellsize);
        }
        if (!cell[BELOW]) {
            if ((cellsize <= mincellsize * 2 && lowresmode.value === "1") || (lowresmode.value === "2")) {
                mazectx.fillStyle = "grey";
                mazectx.fillRect(x * cellsize + 2, y * cellsize, cellsize / 2 - 2, cellsize);
            }
            else mazectx.drawImage(downladderimage, x * cellsize, y * cellsize, cellsize, cellsize);
        }
    }

    for (let y = 0; y < maze.width; y++) {
        for (let x = 0; x < maze.length; x++) {
            drawcell(x, y, maze.get_cell(x, y, currentz));
        }
    }
    if (solutionvisible) {
        drawsolution();
    }
    else drawplayer();
}

/** draws the player sprite at the current coordinates*/
function drawplayer() {
    if ((cellsize <= mincellsize * 2 && lowresmode.value === "1") || (lowresmode.value === "2")) { //visual assist for super zoomed out mazes, draws a red block instead of the player
        playerctx.fillStyle = "#FF0000";
        playerctx.fillRect(currentx * cellsize + 1, currenty * cellsize + 1, cellsize - 2, cellsize - 2);
    }
    else playerctx.drawImage(playerimage, currentx * cellsize, currenty * cellsize, cellsize, cellsize); //place image as normal otherwise
}

/** clears a player sprite-sized space at the current coordinates*/
function clearplayer() {
    playerctx.clearRect(currentx * cellsize, currenty * cellsize, cellsize, cellsize);
}

/** generates a maze (+search adapter) based on current entered parameters, sets current coordinates to its start and renders it*/
function newgame() {
    const y = rows.value;
    const x = columns.value;
    const z = layers.value;
    genalg = generationalg.value;
    solution_recent = false;
    stopmoving();
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
    if (bonuscarving.value != "0") {
        let holenum = Math.floor(maze.floorsize / 10);
        if (bonuscarving.value = "2") holenum *= 2;
        for (let k = 0; k < Math.random() * holenum; k++) {
            if (maze.remove_wall(Math.floor(Math.random() * x), Math.floor(Math.random() * y), Math.floor(Math.random() * z), Math.floor(Math.random() * 6), false) === false)
                k -= 1;
        }
    }
    adapted_maze = new MazeAdapter(maze);
    //console.log(maze.to_string([], maze.entrance[2]));
    currentx = maze.entrance[0];
    currenty = maze.entrance[1];
    currentz = maze.entrance[2];
    choosecellsize();
    drawmaze();
    hidesolution();
}

/** updates current coordinates and calls a player redraw if the move is legal
 * provide a cell id to unconditionally teleport there 
 */
function move(direction, id = -1) {
    if ((maze.get_cell(currentx, currenty, currentz)[direction] === false) || (id != -1)) {
        clearplayer();
        const oldz = currentz;
        if (id === -1) [currentx, currenty, currentz] = maze.get_neighbour(currentx, currenty, currentz, direction); //actual coordinate reassignment
        else[currentx, currenty, currentz] = maze.get_cell_coords(id);
        if (solution_recent) { //check if player is following the solution, trim it to not have to recalculate
            let expectedcell = solution[solution.length - 2];
            let currentcell = maze.get_cell_id(currentx, currenty, currentz);
            if (expectedcell != currentcell) { //player has broken out of the solution, it is now invalid
                solution_recent = false;
                solvebtn.innerText = "Show full solution";
                solutionvisible = false;
                playerctx.clearRect(0, 0, canvas.width, canvas.height);
                drawplayer();
            }
            else solution.pop(); //trim solution as the player moves

        }
        if (oldz != currentz) { //check if there has been a layer change
            drawmaze();
        }
        else {
            clearplayer();
            drawplayer();
        }
        if (solutionvisible && (maze.height > 1)) drawsolution(); //redraw solution so player movement does not erase possible lines on other levels, only possible in 3d)
        if (maze.exit[0] === currentx && maze.exit[1] === currenty && maze.exit[2] === currentz) victory();
    }
}

/**resets player position to start*/
function resetposition() {
    move(null, maze.get_cell_id(...maze.entrance));
}
/** shows a victory screen */
function victory() {
    alert("congratulations! you got to the exit. feel free to wander or restart.")
}

/** creates a solution based on the currently selected algorithm */
function solve() {
    srcalg = searchalg.value;
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
    solution.reverse();
    solution_recent = true;
}

/** displays a solution if one is fresh, calls solve to obtain one if not */
function showfullsolution() {
    if (solutionvisible === false) {
        if (solution_recent === false || searchalg.value != srcalg) solve();
        drawsolution();
        solvebtn.innerText = "Hide solution";
        solutionvisible = true;
    }
    else {
        hidesolution();
    }
}

/** actually draws the solution line */
function drawsolution() {
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    let i = 0;
    playerctx.beginPath();
    playerctx.strokeStyle = 'blue';
    let dotted = false
    while (i < solution.length) {
        let cell = maze.get_cell_coords(solution[i]);

        if (cell[2] === currentz) {
            if (dotted) playerctx.setLineDash([10, 10]);
            else playerctx.setLineDash([]);
            playerctx.lineTo(cell[0] * cellsize + cellsize / 2, cell[1] * cellsize + cellsize / 2);
            playerctx.stroke();
            playerctx.beginPath();
            playerctx.lineTo(cell[0] * cellsize + cellsize / 2, cell[1] * cellsize + cellsize / 2);
            dotted = false;

        }
        if (cell[2] != currentz) dotted = true;
        // canvasx = cell[0] * cellsize + cellsize / 2;
        //     canvasy = cell[1] * cellsize + cellsize / 2;
        // if (cell[2] === currentz) {

        //     playerctx.lineTo(canvasx, canvasy);
        //     playerctx.stroke();
        //     playerctx.beginPath();
        //     playerctx.strokeStyle = 'blue';
        //     playerctx.setLineDash([]);
        //     playerctx.moveTo(canvasx, canvasy);

        //     playerctx.lineTo(canvasx, canvasy);
        //     playerctx.stroke();
        //     playerctx.beginPath();
        //     playerctx.moveTo(canvasx, canvasy);
        //     playerctx.setLineDash([10,10]);
        //     playerctx.strokeStyle = 'red';
        // }

        i++;
    }
    playerctx.stroke();
}

/** clears the solution graphic and resets interface and flag for it */
function hidesolution() {
    playerctx.clearRect(0, 0, canvas.width, canvas.height);
    drawplayer();
    solvebtn.innerText = "Show full solution";
    solutionvisible = false;
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
        let cell = maze.get_cell_coords(solution[solution.length - i - 1]);
        if (cell[2] === currentz) {
            usedpoints += 1;
            playerctx.lineTo(cell[0] * cellsize + cellsize / 2, cell[1] * cellsize + cellsize / 2);
        }
        i++;
    }
    playerctx.stroke();
    solvebtn.innerText = "Show full solution";
    solutionvisible = false;
}

/** automatically moves the player to the exit following the current solution, interruptable with keyboard or second press */
function automove() {
    if (automoving === false) {
        autobtn.innerText = "Stop automatic navigation";
        automoving = true;
        if (solution_recent === false || searchalg.value != srcalg) solve();
        movementinterval = setInterval(movestep, automovespeed.value);
        document.addEventListener('keydown', e => {
            e.preventDefault();
            stopmoving();
        }, {
            once: true
        });

        function movestep() {
            if (solution.length <= 2) {
                stopmoving();
            }
            move(null, solution[solution.length - 2]);
        }
    }
    else stopmoving();
}

/** interrupts automovement and resets interface and flag for it*/
function stopmoving() {
    autobtn.innerText = "Take me to the exit";
    clearInterval(movementinterval);
    automoving = false;
}