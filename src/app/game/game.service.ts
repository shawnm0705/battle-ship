import { Injectable } from '@angular/core';

// Position = [x, y]
export type Position = Array<number>;
export type Ship = Array<Position>;
export type ShipsPosition = Array<Array<boolean>>;
export type BoardStatus = Array<Array<string>>;

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private ships = [
    {
      name: 'Carrier',
      size: 5,
      done: false
    },
    {
      name: 'Battleship',
      size: 4,
      done: false
    },
    {
      name: 'Cruiser',
      size: 3,
      done: false
    },
    {
      name: 'Submarine',
      size: 3,
      done: false
    },
    {
      name: 'Destroyer',
      size: 2,
      done: false
    }
  ];

  constructor() { }

  getShips() {
    return this.ships;
  }

  /**
   * Group positions into ships (regard positions that are connected as a ship)
   * @param positions [Positions array]
   */
  getShipsFromPositions(positions: Array<Position>) {
    // array of ships positions
    let ships: Array<Ship> = [];
    // temporary stack used to group positions to ships
    const tmpStack: Array<Position> = [];
    // the positions that has already been checked(labeled - in the algorithm)
    const checkedPositions: Array<Position> = [];
    positions.forEach(position => {
      if (this.positionIncludes(checkedPositions, position)) {
        return ;
      }
      const ship: Ship = [];
      tmpStack.push(position);
      checkedPositions.push(position);
      ship.push(position);
      // keep checking neighbours of positions inside the stack until stack is empty
      while (tmpStack[0]) {
        const tmpPosition = tmpStack.pop();
        const [x, y] = tmpPosition;
        // check if the neighbour of this position is marked
        // if so, they belongs to the same ship
        // push it to the stack
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(neighbour => {
          if (this.positionIncludes(positions, neighbour) &&
            !this.positionIncludes(checkedPositions, neighbour)) {
            tmpStack.push(neighbour);
            checkedPositions.push(neighbour);
            ship.push(neighbour);
          }
        });
      }
      ships.push(ship);
    });
    // sort ship by length descending
    ships = ships.sort((a, b) => {
      return b.length - a.length;
    });
    return ships;
  }

  /**
   * Automatically set up the game board with ships
   * @param ships           Ships array
   * @param shipsPosition   Ships position array
   */
  autoSetupBoard() {
    let ships = [];
    let shipsPosition = this.initialiseBoard(false);
    this.ships.forEach(ship => {
      // try maximum
      for (let i = 0; i < 1000; i ++) {
        let validation = this.validateShip(ship.size, this.randomPosition(), this.randomBoolean(), ships, shipsPosition)
        if (validation.valid) {
          ships = validation.ships;
          shipsPosition = validation.shipsPosition;
          break;
        }
      }
    });
    return {
      ships: ships,
      shipsPosition: shipsPosition
    };
  }

  /**
   * Create a 10 * 10 two dimensional array of given value
   * @param value   the value of each cell
   * @return the two dimensional array
   */
  initialiseBoard(value) {
    const board = [];
    for (let i = 0; i < 10; i ++) {
      const row = [];
      for (let j = 0; j < 10; j ++) {
        row.push(value);
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Check if this random ship is valid, if so, push this ship to the ships array, and mark the positions on the board as true
   * @param size       Size of this ship
   * @param start      Start position of this ship
   * @param isHorizontal If this ship is horizontal
   * @param ships      The array of ships
   * @param shipsPosition    The ships position array
   */
  validateShip(size: number, start: Position, isHorizontal: boolean, ships: Array<Ship>, shipsPosition: ShipsPosition) {
    const ship: Ship = [];
    const [x, y] = start;
    let end: Position = [start[0] + size - 1, start[1]];
    if (isHorizontal) {
      end = [start[0], start[1] + size - 1];
    }
    // ship body should be inside the board
    if (!this.validatePosition(end)) {
      return {
        valid: false
      };
    }
    // check if the ship body and ship surrounded positions are taken
    for (let i = -1; i < size + 1; i++) {
      let position = [x + i, y];
      if (isHorizontal) {
        position = [x, y + i];
      }
      // don't need to check the position outside of the board
      // this will only happen for the position i = -1 / i = size
      if (!this.validatePosition(position)) {
        continue;
      }
      if (shipsPosition[position[0]][position[1]]) {
        return {
          valid: false
        };
      }
      // don't need to check left(top)/right(bottom) for i = -1 and i = size
      if (i < 0 || i >= size) {
        continue;
      }
      // check the left/top and right/bottom of this position
      // left or top
      let left = [x + i, y - 1];
      // right or bottom
      let right = [x + i, y + 1];
      if (isHorizontal) {
        left = [x - 1, y + i];
        right = [x + 1, y + i];
      }
      if (this.validatePosition(left)) {
        if (shipsPosition[left[0]][left[1]]) {
          return {
            valid: false
          };
        }
      }
      if (this.validatePosition(right)) {
        if (shipsPosition[right[0]][right[1]]) {
          return {
            valid: false
          };
        }
      }
      ship.push(position);
    }
    ships.push(ship);
    ship.forEach(position => {
      shipsPosition[position[0]][position[1]] = true;
    });
    return {
      valid: true,
      ships: ships,
      shipsPosition: shipsPosition
    };
  }

  /**
   * Validate if this position is valid
   *
   * @param position  The position that we are validating
   */
  validatePosition(position: Position) {
    const [x, y] = position;
    if (x < 0 || x > 9 || y < 0 || y > 9) {
      return false;
    }
    return true;
  }

  /**
   * Check if an position array includes the position passed in
   * @param positionArray [The position array]
   * @param position      [The position to check]
   */
  positionIncludes(positionArray: Array<Position>, position: Position) {
    let result = false;
    positionArray.forEach(p => {
      if (p[0] === position[0] && p[1] === position[1]) {
        result = true;
      }
    });
    return result;
  }

  /**
   * Get a random position
   */
  randomPosition() {
    return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  }

  /**
   * A random boolean choice
   */
  randomBoolean() {
    return Math.random() < 0.5;
  }
}
