
//universal global representation of directions to not get confused, reversable by shifting by 3
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
        this.entrance = [0, 0, 0]; //default, can be changed in generation
        this.exit = [x - 1, y - 1, z - 1]; //default, can be changed in generation
        for (let i = 0; i < x * y * z; i++) {
            this.cells[i] = Array(6).fill(true); // by default all cells are walled off
        }
    }

    /**
     *inverts a direction
     */
    oppositedir(direction) {

        return (direction + 3) % 6;
    }

    /**
     *throws an error (by default) or returns false (if throwing = false) if coordinates are invalid
     */
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

    /**
     *provides the cell array by coordinates
     */
    get_cell(x, y, z) {
        this.bounds_check(x, y, z);
        return this.cells[this.floorsize * z + this.length * y + x];
    }

    /**
     *returns flattened cell coordinate
     */
    get_cell_id(x, y, z) {
        this.bounds_check(x, y, z);
        return this.floorsize * z + this.length * y + x;
    }

    /**
     *returns reconstructed coordinates from flattened coordinate
     */
    get_cell_coords(id) {
        let ry = 0;
        let rz = 0;
        while (id >= this.floorsize) {
            id -= this.floorsize;
            rz += 1;
        }
        while (id >= this.length) {
            id -= this.length;
            ry += 1;
        }
        return [id, ry, rz];
    }

    /**
     * sets a cell at coordinates to the provided array
     */
    set_cell(x, y, z, value) {
        this.bounds_check(x, y, z);
        this.cells[this.floorsize * z + this.length * y + x] = value;
    }

    /**
     * sets a specific wall of a cell
     */
    set_wall(x, y, z, direction, value) {
        this.bounds_check(x, y, z);
        this.cells[this.floorsize * z + this.length * y + x][direction] = value;
    }

    /**
     * gives coordinates of a cell in a direction or false if there isnt one
     */
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

    /**
     * attempts to knock down a wall, in case of it being illegal throws an error or returns false (toggleable via throwing)
     */
    remove_wall(x, y, z, direction, throwing = true) {
        this.bounds_check(x, y, z);
        let neighbour = this.get_neighbour(x, y, z, direction);
        if (throwing === false && neighbour === false) return false;
        if (neighbour === false) throw new RangeError(`neighbour ${direction} cell ${x, y, z} is out of bounds`);
        this.set_wall(x, y, z, direction, false);
        [x, y, z] = neighbour;
        this.set_wall(x, y, z, this.oppositedir(direction), false);
    }

    /** returns a string representation, draws a solution in stars if provided, only returns one floor if floor number is provided */
    to_string(solution = [], level = false) {
        let repr = "";

        //symbols to use
        const wall = "█";
        const uparrow = "↑";
        const downarrow = "↓";
        const biarrow = "↕";
        const entrancesign = "S";
        const exitsign = "G";
        const pathsymbol = "*"

        /**
         * internal function to draw one level of the maze
         */
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
                            if (solution.includes(this.get_cell_id(x, y, z))) {
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

        if (level === false) {
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
