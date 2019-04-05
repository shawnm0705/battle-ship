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
  myShips: Array<Array<number>>;
  opponentShips: Array<Array<number>>;
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
        console.table(this.markedPositions);
        this._checkSetUpStatus();
        break;

    }
  }

  /**
   * Check if any ships is completed and if it is ready to start the game
   * Algorithm:
   * Connected-component labeling algorithm -> One component at a time
   * (https://en.wikipedia.org/wiki/Connected-component_labeling)
   */
  private _checkSetUpStatus() {
    const ships = [];
    const tmpStack = [];
    const checkedPositions = [];
    this.markedPositions.forEach(position => {
      if (checkedPositions.includes(position)) {
        return ;
      }
      const ship = [];
      tmpStack.push(position);
      checkedPositions.push(position);
      ship.push(position);
      while (tmpStack[0]) {
        const tmpPosition = tmpStack.pop();
        const [x, y] = tmpPosition;
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(neighbour => {
          if (this.markedPositions.includes(neighbour) && !checkedPositions.includes(neighbour)) {
            tmpStack.push(neighbour);
            checkedPositions.push(neighbour);
            ship.push(position);
          }
        });
      }

    });
  }
}
