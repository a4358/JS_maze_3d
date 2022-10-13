

export const NORTH = 0;
export const WEST = 1;
export const ABOVE = 2;
export const SOUTH = 3;
export const EAST = 4;
export const BELOW = 5;




export default class Maze3d {
    constructor(x, y, z) {
        this.length = x;
        this.width = y;
        this.height = z;
        this.floorsize = x * y;
        this.cells = Array(x * y * z);
        this.entrance = [0, 0, 0];
        this.exit = [x - 1, y - 1, z - 1];
        for (let i = 0; i < x * y * z; i++) {
            this.cells[i] = Array(6).fill(true);
        }
    }
    oppositedir (direction){
        return (direction + 3) % 6;
    }
    bounds_check(x, y, z, throwing = true) {
        if (throwing) {
            if (x < 0 || x >= this.length) throw new RangeError(`x ${x} is out of bounds (max x = ${this.length})`);
            if (y < 0 || y >= this.width) throw new RangeError(`y ${y} is out of bounds (max y = ${this.width})`);
            if (z < 0 || z >= this.height) throw new RangeError(`z ${z} is out of bounds (max z = ${this.height})`);
        }
        else {
            if (x < 0 || x >= this.length) return false;
            if (y < 0 || y >= this.width) return false;
            if (z < 0 || z >= this.height) return false;
            return true;
        }
    }
    get_cell(x, y, z) {
        this.bounds_check(x, y, z);
        return this.cells[this.floorsize * z + this.length * y + x];
    }
    get_cell_id(x, y, z) {
        this.bounds_check(x, y, z);
        return this.floorsize * z + this.length * y + x;
    }
    get_cell_coords(id) {
        let ry = 0;
        let rz = 0;
        while (id >= this.floorsize){
            id -= this.floorsize;
            rz +=1 ;
        }
        while (id >= this.length){
            id -= this.length;
            ry +=1 ;
        }
        return [id, ry, rz];
    }
    set_cell(x, y, z, value) {
        this.bounds_check(x, y, z);
        this.cells[this.floorsize * z + this.length * y + x] = value;
    }
    set_wall(x, y, z, direction, value) {
        this.bounds_check(x, y, z);
        this.cells[this.floorsize * z + this.length * y + x][direction] = value;
    }
    get_neighbour(x, y, z, direction) {
        this.bounds_check(x, y, z);
        switch (direction) {
            case NORTH:
                if (this.bounds_check(x, y - 1, z, false)) return [x, y - 1, z];
                else return false;
            case SOUTH:
                if (this.bounds_check(x, y + 1, z, false)) return [x, y + 1, z];
                else return false;
            case WEST:
                if (this.bounds_check(x - 1, y, z, false)) return [x - 1, y, z];
                else return false;
            case EAST:
                if (this.bounds_check(x + 1, y, z, false)) return [x + 1, y, z];
                else return false;
            case ABOVE:
                if (this.bounds_check(x, y, z + 1, false)) return [x, y, z + 1];
                else return false;
            case BELOW:
                if (this.bounds_check(x, y, z - 1, false)) return [x, y, z - 1];
                else return false;
        }
    }
    remove_wall(x, y, z, direction, throwing = true) {
       
        this.bounds_check(x, y, z);
        let neighbour = this.get_neighbour(x, y, z, direction);
        if (throwing === false && neighbour === false) return false;
        if (neighbour === false) throw new RangeError(`neighbour ${direction} cell ${x, y, z} is out of bounds`);
        this.set_wall(x, y, z, direction, false);
        [x, y, z] = neighbour;
        this.set_wall(x, y, z, this.oppositedir(direction), false);
    }
    to_string(solution = [],level = false) {
        let repr = "";
        const wall = "█";
        const uparrow = "↑";
        const downarrow = "↓";
        const biarrow = "↕";
        const entrancesign = "S";
        const exitsign = "G";
        const pathsymbol = "*"
        let reprlevel = (z) => {
            for (let y = 0; y < this.width; y++) {
                for (let x = 0; x < this.length; x++) {
                    repr += wall;
                    if (this.get_cell(x, y, z)[NORTH] === true)
                        repr += wall;
                    else
                        repr += " ";
                }
                repr += wall + '\n';
                for (let x = 0; x < this.length; x++) {
                    let cell = this.get_cell(x, y, z)
                    if (cell[WEST] === true)
                        repr += wall;
                    else
                        repr += " ";
                    if (x === this.entrance[0] && y === this.entrance[1] && z === this.entrance[2]) repr += entrancesign;
                    else {
                        if (x === this.exit[0] && y === this.exit[1] && z === this.exit[2]) repr += exitsign;
                        else {
                            if (solution.includes(this.get_cell_id(x,y,z))){
                                repr += pathsymbol;
                            }
                            else {
                                if (cell[ABOVE] === false)
                                    if (cell[BELOW] === false)
                                        repr += biarrow;
                                    else
                                        repr += uparrow;
                                else
                                    if (cell[BELOW] === false)
                                        repr += downarrow;
                                    else
                                        repr += " ";
                            }
                        }
                    }
                }
                repr += wall + "\n";
            }
            for (let x = 0; x < this.length; x++)
                repr += wall + wall;
            repr += wall + "\n";
        }
        if (level === false){
            for (let z = 0; z < this.height; z++) {
                repr += `   Level ${z} \n`;
                reprlevel(z);
            }
        }
        else {
            let z = level;
            reprlevel(z);
        }
        return repr;
    }
}
/*
//testing ↓ ↑ ↕ █
//const maze1 = new Maze3d(5, 5, 5);
//maze1.set_cell(1, 2, 3, [true, true, true, false, true, true]);
//maze1.set_cell(1, 2, 4, [true, true, true, false, true, true]);
//console.log(maze1.get_cell(1, 2, 3));
//console.log(maze1.to_string());
//console.log("↓ ↑ ↕ █");
//console.log(maze1.bounds_check(1,3,4));
//console.log(maze1.bounds_check(1,9,4,false));
//maze1.remove_wall(0, 0, 0, ABOVE);
//maze1.remove_wall(0, 0, 0, EAST);
//maze1.remove_wall(0, 0, 1, ABOVE);
//console.log(maze1.get_cell(...maze1.get_neighbour(0,0,0,ABOVE)));
//console.log(...maze1.get_neighbour(0,0,0,"ABOVE"));
//console.log(maze1.to_string());
//console.log(maze1.get_cell(0, 0, 0));
//console.log(maze1.get_cell(0, 0, 1));
//console.log(maze1.get_cell(0, 0, 2));
console.log(maze1.get_cell_id(0, 0, 2));
console.log(maze1.floorsize);
console.log(maze1.get_cell_coords(maze1.get_cell_id(4, 4, 3)));
console.log(maze1.to_string());
*/