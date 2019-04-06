import { Component } from '@angular/core';

@Component({
  selector: 'game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
})
export class GamePage {
  state = 'setting';
  // ship positions on the board
  myShipsPosition: Array<Array<boolean>>;
  opponentShipsPosition: Array<Array<boolean>>;
  // These array only contain ship positions
  myShips: Array<Array<Array<number>>>;
  opponentShips: Array<Array<Array<number>>>;
  // The positions that are marked as ship when user set up the board
  markedPositions: Array<Array<number>>;
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
    this.myShipsPosition = [];
    this.opponentShipsPosition = [];
    this.markedPositions = [];
    this.myBoardStatus = [];
    this.opponentBoardStatus = [];
    for (let i = 0; i < 10; i ++) {
      const shipsInit = [];
      const statusInit = [];
      for (let j = 0; j < 10; j ++) {
        shipsInit.push(false);
        statusInit.push('unknown');
      }
      this.myShipsPosition.push(shipsInit);
      this.opponentShipsPosition.push(shipsInit);
      this.myBoardStatus.push(statusInit);
      this.opponentBoardStatus.push(statusInit);
    }
  }

  /**
   * Triggered for each user move(click)
   * @param position [The position of this move(click)]
   */
  step(position: {x: number; y: number}) {
    const {x, y} = position;
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

    }
  }

  /**
   * Start the game after setting up my board
   */
  start() {
    this.state = 'playing';
  }

  /**
   * Check if any ships are completed and if it is ready to start the game
   * Algorithm:
   * Connected-component labeling algorithm -> One component at a time
   * (https://en.wikipedia.org/wiki/Connected-component_labeling)
   */
  private _checkSetUpStatus() {
    // array of ships positions
    const ships: Array<Array<Array<number>>> = [];
    // temporary stack used to group positions to ships
    const tmpStack: Array<Array<number>> = [];
    // the positions that has already been checked(labeled - in the algorithm)
    const checkedPositions: Array<Array<number>> = [];
    this.markedPositions.forEach(position => {
      if (this._positionIncludes(checkedPositions, position)) {
        return ;
      }
      const ship: Array<Array<number>> = [];
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
          if (this._positionIncludes(this.markedPositions, neighbour) &&
            !this._positionIncludes(checkedPositions, neighbour)) {
            tmpStack.push(neighbour);
            checkedPositions.push(neighbour);
            ship.push(neighbour);
          }
        });
      }
      ships.push(ship);
    });
    // now marked positions on the board are grouped as "ships"
    // need to validate those ships
    const validShips: Array<Array<Array<number>>> = [];
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
        return currentShip.size === ship.length && !currentShip.done
      });
      if (index !== -1) {
        this.ships[index].done = true;
      }
    });
    if (!this.ships.find(v => {
      return !v.done;
    }) && validShips.length === this.ships.length) {
      this.myShips = validShips.sort((a, b) => {
        return b.length - a.length
      });
      this.readyToStart = true;
    }
  }

  /**
   * Check if an position array includes the position passed in
   * @param {Array<Array<number>>} positionArray [The position array]
   * @param {Array<number>}        position      [The position to check]
   */
  private _positionIncludes(positionArray: Array<Array<number>>, position: Array<number>) {
    let result = false;
    positionArray.forEach(p => {
      if (p[0] === position[0] && p[1] === position[1]) {
        result = true;
      }
    });
    return result;
  }
}
