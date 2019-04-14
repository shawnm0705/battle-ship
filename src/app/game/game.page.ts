import { Component } from '@angular/core';

// Position = [x, y]
type Position = Array<number>;
type Ship = Array<Position>;

@Component({
  selector: 'game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
})
export class GamePage {
  state = 'setting';
  gameOver = false;
  myTurn = true;
  winMsg = '';
  // ship positions on the board
  myShipsPosition: Array<Array<boolean>>;
  opponentShipsPosition: Array<Array<boolean>>;
  // These array only contain ship positions
  myShips: Array<Ship>;
  opponentShips: Array<Ship>;
  // The positions that are marked as ship when user set up the board
  markedPositions: Array<Position>;
  // current board status
  // 'correct' -> correct shoot
  // 'wrong' -> incorrect shoot
  // 'unknown' -> hasn't been shoot yet
  myBoardStatus: Array<Array<string>>;
  opponentBoardStatus: Array<Array<string>>;
  readyToStart = false;
  ships = [
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

  constructor() {
    this._initialise();
  }

  private _initialise() {
    this.state = 'setting';
    this.gameOver = false;
    this.myTurn = true;
    this.myShipsPosition = [];
    this.opponentShipsPosition = [];
    this.myShips = [];
    this.opponentShips = [];
    this.markedPositions = [];
    this.myBoardStatus = [];
    this.opponentBoardStatus = [];
    this.readyToStart = false;
    this.ships = this.ships.map(ship => {
      ship.done = false;
      return ship;
    });
    for (let i = 0; i < 10; i ++) {
      const myShipsInit = [];
      const oppnentShipsInit = [];
      const myStatusInit = [];
      const oppnentStatusInit = [];
      for (let j = 0; j < 10; j ++) {
        myShipsInit.push(false);
        oppnentShipsInit.push(false);
        myStatusInit.push('unknown');
        oppnentStatusInit.push('unknown');
      }
      this.myShipsPosition.push(myShipsInit);
      this.opponentShipsPosition.push(oppnentShipsInit);
      this.myBoardStatus.push(myStatusInit);
      this.opponentBoardStatus.push(oppnentStatusInit);
    }
  }

  /**
   * Triggered for each user move(click)
   * @param position [The position of this move(click)]
   */
  step(position: Position) {
    const [x, y] = position;
    switch (this.state) {
      case 'setting':
        this.myShipsPosition[x][y] = !this.myShipsPosition[x][y];
        this.myBoardStatus[x][y] = this.myShipsPosition[x][y] ? 'correct' : 'unknown';
        // get all marked positions
        if (this.myShipsPosition[x][y]) {
          this.markedPositions.push([x, y]);
        } else {
          const p = this.markedPositions.findIndex(v => {
            return v[0] === x && v[1] === y;
          });
          if (p > -1) {
            this.markedPositions.splice(p, 1);
          }
        }
        this._checkSetUpStatus();
        break;

      case 'playing':
        // clicking on a known position doesn't do anything
        if (this.opponentBoardStatus[x][y] !== 'unknown') {
          return;
        }
        this.opponentBoardStatus[x][y] = this.opponentShipsPosition[x][y] ? 'correct' : 'wrong';
        this.myTurn = false;
        this._checkOpponentBoard();
        if (this.gameOver) {
          return;
        }
        this._opponentMove();
        this._checkMyBoard();
        if (!this.gameOver) {
          this.myTurn = true;
        }
        break;
    }
  }

  /**
   * Automatically set up my board
   */
  autoSetup() {
    this._initialise();
    this._autoSetupBoard(true);
    // display board status
    this.myBoardStatus = this.myBoardStatus.map((row, x) => {
      return row.map((column, y) => {
        return this.myShipsPosition[x][y] ? 'correct' : 'unknown';
      });
    });
    this.readyToStart = true;
  }

  /**
   * Start the game after setting up my board
   */
  start() {
    this._autoSetupBoard();
    // initialise my board
    this.myBoardStatus = this.myBoardStatus.map(row => {
      return row.map(column => {
        return 'unknown';
      });
    });
    this.state = 'playing';
  }

  /**
   * Restart a new game
   */
  restart() {
    this._initialise();
  }

  /**
   * Check if this ship sunk
   * @param owner [opponent or me]
   * @param index [which ship is checked]
   */
  isShipSunk(owner: string, index: number) {
    let ship: Ship;
    let board;
    if (owner === 'opponent') {
      ship = this.opponentShips[index];
      board = this.opponentBoardStatus;
    }
    if (owner === 'me') {
      ship = this.myShips[index];
      board = this.myBoardStatus;
    }
    return ship.findIndex(position => {
      return board[position[0]][position[1]] !== 'correct';
    }) === -1;
  }

  /**
   * The AI move
   */
  private _opponentMove() {
    let movePosition: Position;
    movePosition = this._smartMove();
    if (!movePosition) {
      // pick a random position if there's no smarter move
      // try maximum 1000 times
      for (let i = 0; i < 1000; i++) {
        movePosition = this._randomPosition();
        if (this._validateOpponentMove(movePosition)) {
          break;
        }
      }
    }
    this.myBoardStatus[movePosition[0]][movePosition[1]] = this.myShipsPosition[movePosition[0]][movePosition[1]] ? 'correct' : 'wrong';
  }

  /**
   * A smart move for AI
   * If there's an unsunk ship, try to sink this ship first
   */
  private _smartMove() {
    // get all marked positions from my board
    const markedPositions: Array<Position> = [];
    this.myBoardStatus.forEach((row, x) => {
      row.forEach((status, y) => {
        if (status === 'correct') {
          markedPositions.push([x, y]);
        }
      });
    });
    // get "ships"(may not be a full ship) from marked positions
    const ships = this._getShipsFromPositions(markedPositions);
    // AI will finish this ship first
    let targetShip: Ship;
    ships.forEach(ship => {
      // find which ship these positions belong to
      const correctShip = this.myShips.find(eachShip => {
        return this._positionIncludes(eachShip, ship[0]);
      });
      if (ship.length === correctShip.length) {
        // this ship is finished
        return;
      }
      targetShip = ship;
    });
    // if there's no ship that is not finished, no smart move needed
    if (!targetShip) {
      return null;
    }
    // get the size of the target ship that is not sunk
    let targetShipSize = 0;
    for (let i = this.ships.length - 1; i >= 0; i--) {
      if (!this.isShipSunk('me', i) && this.ships[i].size > targetShip.length) {
        targetShipSize = this.ships[i].size;
        break;
      }
    }
    // if this next ship is just a single position, need to guess if the ship is horizontal or vertical
    if (targetShip.length === 1) {
      return this._nextMoveFromSinglePosition(targetShip[0], targetShipSize);
    }
    return this._nextMoveFromPartialShip(targetShip);
  }

  /**
   * Get the next move position from a ship that has only one position available yet
   * @param position The position that is available
   * @param shipSize The guessed ship size
   */
  private _nextMoveFromSinglePosition(position: Position, shipSize: number) {
    // the position of this ship
    const [x, y] = position;
    let leftMax, rightMax, topMax, bottomMax;
    // get the top max position
    for (let i = 1; i < 10; i++) {
      if (!this._validateOpponentMove([x - i, y], [x - i + 1, y])) {
        topMax = x - i + 1;
        break;
      }
    }
    // the top of the current position is able to form the ship
    if (x - topMax + 1 >= shipSize) {
      return [x - 1, y];
    }
    // get the bottom max position
    for (let i = 1; i < 10; i++) {
      if (!this._validateOpponentMove([x + i, y], [x + i - 1, y])) {
        bottomMax = x + i - 1;
        break;
      }
    }
    // it is able to form the ship vertically
    if (bottomMax - topMax + 1 >= shipSize) {
      return [x + 1, y];
    }
    // get the left max position
    for (let i = 1; i < 10; i++) {
      if (!this._validateOpponentMove([x, y - i], [x, y - i + 1])) {
        leftMax = y - i + 1;
        break;
      }
    }
    // the left of the current position is able to form the ship
    if (y - leftMax + 1 >= shipSize) {
      return [x, y - 1];
    }
    // get the right max position
    for (let i = 1; i < 10; i++) {
      if (!this._validateOpponentMove([x, y + i], [x, y + i - 1])) {
        rightMax = y + i - 1;
        break;
      }
    }
    // it is able to form the ship horizontally
    if (rightMax - leftMax + 1 >= shipSize) {
      return [x, y + 1];
    }
    // it must have enough space for a ship horizontally or vertically,
    // so logically this should not happen, the function should return earlier
    console.error('can not find a valid next move with \nposition: ', position, '\nsize: ', shipSize);
    return null;
  }

  private _nextMoveFromPartialShip(ship: Ship) {
    let head = ship[0];
    let tail = ship[1];
    // horizontal ship
    if (head[0] === tail[0]) {
      // sort ship
      ship = ship.sort((a, b) => {
        return a[1] - b[1];
      });
      // the real head and tail
      head = ship[0];
      tail = ship[ship.length - 1];
      if (this._validateOpponentMove([head[0], head[1] - 1], head)) {
        return [head[0], head[1] - 1];
      } else {
        return [tail[0], tail[1] + 1];
      }
    }
    // vertical ship
    if (head[1] === tail[1]) {
      ship = ship.sort((a, b) => {
        return a[0] - b[0];
      });
      // the real head and tail
      head = ship[0];
      tail = ship[ship.length - 1];
      if (this._validateOpponentMove([head[0] - 1, head[1]], head)) {
        return [head[0] - 1, head[1]];
      } else {
        return [tail[0] + 1, tail[1]];
      }
    }
    // logically it will never comes here, there should be a valid next move since the ship is not sunk
    console.error('can not find a valid next move with \nship: ', ship);
    return null;
  }

  /**
   * Check if this move is valid
   * check if this position is a neighbour of an existing ship
   *
   * @param position The move position
   * @param validNeighbour The neighbour that is part of the same ship with this position
   */
  private _validateOpponentMove(position: Position, validNeighbour?: Position) {
    if (!this._validatePosition(position)) {
      return false;
    }
    if (this.myBoardStatus[position[0]][position[1]] !== 'unknown') {
      return false;
    }
    // use smart check to validate this position
    let valid = true;
    const [x, y] = position;
    [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(p => {
      if (validNeighbour !== undefined && p[0] === validNeighbour[0] && p[1] === validNeighbour[1]) {
        // this is the valid neighbour
        return;
      }
      if (this.myBoardStatus[p[0]] !== undefined &&
          this.myBoardStatus[p[0]][p[1]] !== undefined &&
          this.myBoardStatus[p[0]][p[1]] === 'correct') {
        // this position is a neighbour of a ship
        valid = false;
      }
    });
    return valid;
  }

  private _checkOpponentBoard() {
    for (let i = 0; i < this.ships.length; i++) {
      if (!this.isShipSunk('opponent', i)) {
        return;
      }
    }
    this.winMsg = 'You Win ^_^';
    this._gameOver();
  }

  private _checkMyBoard() {
    for (let i = 0; i < this.ships.length; i++) {
      if (!this.isShipSunk('me', i)) {
        return;
      }
    }
    this.winMsg = 'You Lose :(';
    this._gameOver();
  }

  private _gameOver() {
    this.myTurn = false;
    this.gameOver = true;
    this.myBoardStatus = this._showResult(this.myBoardStatus, this.myShipsPosition);
    this.opponentBoardStatus = this._showResult(this.opponentBoardStatus, this.opponentShipsPosition);
  }

  /**
   * Show result of not found ships
   * @param board [Board status]
   * @param ships [Ship positions]
   */
  private _showResult(board, ships) {
    return board.map((row, x) => {
      return row.map((status, y) => {
        if (status === 'unknown' && ships[x][y]) {
          return 'result';
        }
        return status;
      });
    });
  }

  /**
   * Check if any ships are completed and if it is ready to start the game
   * Algorithm:
   * Connected-component labeling algorithm -> One component at a time
   * (https://en.wikipedia.org/wiki/Connected-component_labeling)
   */
  private _checkSetUpStatus() {
    const ships = this._getShipsFromPositions(this.markedPositions);
    // now marked positions on the board are grouped as "ships"
    // need to validate those ships
    const validShips: Array<Ship> = [];
    ships.forEach(ship => {
      if (ship.length < 2 || ship.length > 5) {
        return ;
      }
      const [x, y] = ship[0];
      const xEquals = ship.filter(v => {
        return v[0] === x;
      });
      const yEquals = ship.filter(v => {
        return v[1] === y;
      });
      if (xEquals.length === ship.length || yEquals.length === ship.length) {
        validShips.push(ship);
      }
    });
    // now check which ship has been set up already
    // initialise all ships' done status to false
    this.ships = this.ships.map(v => {
      v.done = false;
      return v;
    });
    // initialise ready to start as false
    this.readyToStart = false;
    validShips.forEach(ship => {
      const index = this.ships.findIndex(currentShip => {
        return currentShip.size === ship.length && !currentShip.done;
      });
      if (index !== -1) {
        this.ships[index].done = true;
      }
    });
    if (!this.ships.find(v => {
      return !v.done;
    }) && validShips.length === this.ships.length) {
      this.myShips = validShips;
      this.readyToStart = true;
    }
  }

  /**
   * Group positions into ships (regard positions that are connected as a ship)
   * @param positions [Positions array]
   */
  private _getShipsFromPositions(positions: Array<Position>) {
    // array of ships positions
    let ships: Array<Ship> = [];
    // temporary stack used to group positions to ships
    const tmpStack: Array<Position> = [];
    // the positions that has already been checked(labeled - in the algorithm)
    const checkedPositions: Array<Position> = [];
    positions.forEach(position => {
      if (this._positionIncludes(checkedPositions, position)) {
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
          if (this._positionIncludes(positions, neighbour) &&
            !this._positionIncludes(checkedPositions, neighbour)) {
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
   * @param myBoard If it is used to set up my board, or AI's board
   */
  private _autoSetupBoard(myBoard = false) {
    this.ships.forEach(ship => {
      // try maximum
      for (let i = 0; i < 1000; i ++) {
        if (this._validateShip(ship.size, this._randomPosition(), this._randomBoolean(), myBoard)) {
          break;
        }
      }
    });
  }

  /**
   * Check if this random ship is valid, if so, push this ship to the ships array, and mark the positions on the board as true
   * @param size       Size of this ship
   * @param start      Start position of this ship
   * @param isHorizontal If this ship is horizontal
   * @param myBoard    Whether this is for my board or AI's board
   */
  private _validateShip(size: number, start: Position, isHorizontal: boolean, myBoard = false) {
    let shipsPosition = this.opponentShipsPosition;
    if (myBoard) {
      shipsPosition = this.myShipsPosition;
    }
    const ship: Ship = [];
    const [x, y] = start;
    let end: Position = [start[0] + size - 1, start[1]];
    if (isHorizontal) {
      end = [start[0], start[1] + size - 1];
    }
    // ship body should be inside the board
    if (!this._validatePosition(end)) {
      return false;
    }
    // check if the ship body and ship surrounded positions are taken
    for (let i = -1; i < size + 1; i++) {
      let position = [x + i, y];
      if (isHorizontal) {
        position = [x, y + i];
      }
      // don't need to check the position outside of the board
      // this will only happen for the position i = -1 / i = size
      if (!this._validatePosition(position)) {
        continue;
      }
      if (shipsPosition[position[0]][position[1]]) {
        return false;
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
      if (this._validatePosition(left)) {
        if (shipsPosition[left[0]][left[1]]) {
          return false;
        }
      }
      if (this._validatePosition(right)) {
        if (shipsPosition[right[0]][right[1]]) {
          return false;
        }
      }
      ship.push(position);
    }
    if (myBoard) {
      this.myShips.push(ship);
    } else {
      this.opponentShips.push(ship);
    }
    ship.forEach(position => {
      if (myBoard) {
        this.myShipsPosition[position[0]][position[1]] = true;
      } else {
        this.opponentShipsPosition[position[0]][position[1]] = true;
      }
    });
    return true;
  }

  /**
   * Get a random position
   */
  private _randomPosition() {
    return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  }

  /**
   * A random boolean choice
   */
  private _randomBoolean() {
    return Math.random() < 0.5;
  }

  /**
   * Validate if this position is valid
   *
   * @param position  The position that we are validating
   */
  private _validatePosition(position: Position) {
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
  private _positionIncludes(positionArray: Array<Position>, position: Position) {
    let result = false;
    positionArray.forEach(p => {
      if (p[0] === position[0] && p[1] === position[1]) {
        result = true;
      }
    });
    return result;
  }

  test() {
    this._autoSetupBoard();
    this.opponentShips.forEach(ship => {
      ship.forEach(position => {
        this.myBoardStatus[position[0]][position[1]] = 'correct';
      });
    });
  }
}
