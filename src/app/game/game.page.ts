import { Component } from '@angular/core';
import { Position, Ship, ShipsPosition, BoardStatus, GameService } from './game.service';


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
  myShipsPosition: ShipsPosition;
  opponentShipsPosition: ShipsPosition;
  // These array only contain ship positions
  myShips: Array<Ship>;
  opponentShips: Array<Ship>;
  // The positions that are marked as ship when user set up the board
  markedPositions: Array<Position>;
  // current board status
  // 'correct' -> correct shoot
  // 'wrong' -> incorrect shoot
  // 'unknown' -> hasn't been shoot yet
  myBoardStatus: BoardStatus;
  opponentBoardStatus: BoardStatus;
  readyToStart = false;
  ships: Array<{
    name: string;
    size: number;
    done: boolean;
  }>;

  constructor(
    private gameService: GameService
  ) {
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
    this.ships = this.gameService.ships;
    this.gameService.ships = this.gameService.ships.map(ship => {
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
    let setUp = this.gameService.autoSetupBoard(this.myShips, this.myShipsPosition);
    this.myShips = setUp.ships;
    this.myShipsPosition = setUp.shipsPosition;
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
    let setUp = this.gameService.autoSetupBoard(this.opponentShips, this.opponentShipsPosition);
    this.opponentShips = setUp.ships;
    this.opponentShipsPosition = setUp.shipsPosition;
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
        movePosition = this.gameService.randomPosition();
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
    const ships = this.gameService.getShipsFromPositions(markedPositions);
    // AI will finish this ship first
    let targetShip: Ship;
    ships.forEach(ship => {
      // find which ship these positions belong to
      const correctShip = this.myShips.find(eachShip => {
        return this.gameService.positionIncludes(eachShip, ship[0]);
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
    for (let i = this.gameService.ships.length - 1; i >= 0; i--) {
      if (!this.isShipSunk('me', i) && this.gameService.ships[i].size > targetShip.length) {
        targetShipSize = this.gameService.ships[i].size;
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
    if (!this.gameService.validatePosition(position)) {
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
    for (let i = 0; i < this.gameService.ships.length; i++) {
      if (!this.isShipSunk('opponent', i)) {
        return;
      }
    }
    this.winMsg = 'You Win ^_^';
    this._gameOver();
  }

  private _checkMyBoard() {
    for (let i = 0; i < this.gameService.ships.length; i++) {
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
    const ships = this.gameService.getShipsFromPositions(this.markedPositions);
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
    this.gameService.ships = this.gameService.ships.map(v => {
      v.done = false;
      return v;
    });
    // initialise ready to start as false
    this.readyToStart = false;
    validShips.forEach(ship => {
      const index = this.gameService.ships.findIndex(currentShip => {
        return currentShip.size === ship.length && !currentShip.done;
      });
      if (index !== -1) {
        this.gameService.ships[index].done = true;
      }
    });
    if (!this.gameService.ships.find(v => {
      return !v.done;
    }) && validShips.length === this.gameService.ships.length) {
      this.myShips = validShips;
      this.readyToStart = true;
    }
  }

}
