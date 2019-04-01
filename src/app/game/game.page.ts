import { Component } from '@angular/core';

@Component({
  selector: 'game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
})
export class GamePage {
  state = 'setting';
  myShips: Array<Array<boolean>>;
  opponentShips: Array<Array<boolean>>;
  myBoardStatus: Array<Array<string>>;
  opponentBoardStatus: Array<Array<string>>;
  ships = [
    {
      name: 'Carrier',
      size: 5
    },
    {
      name: 'Battleship',
      size: 4
    },
    {
      name: 'Cruiser',
      size: 3
    },
    {
      name: 'Submarine',
      size: 3
    },
    {
      name: 'Destroyer',
      size: 2
    }
  ];

  constructor() {
    this.myShips = [];
    this.opponentShips = [];
    this.myBoardStatus = [];
    this.opponentBoardStatus = [];
    for(let i = 0; i < 10; i ++) {
      const shipArray = [];
      const statusArray = [];
      for(let j = 0; j < 10; j ++) {
        shipArray.push(false);
        statusArray.push('unknown');
      }
      this.myShips.push(shipArray);
      this.opponentShips.push(shipArray);
      this.myBoardStatus.push(statusArray);
      this.opponentBoardStatus.push(statusArray);
    }
  }

  step(event: {x: number; y: number}) {
    let {x, y} = event;
    switch (this.state) {
      case 'setting':
        this.myShips[x][y] = !this.myShips[x][y];
        this.myBoardStatus[x][y] = this.myShips[x][y] ? 'correct' : 'unknown';
        break;

      default:
        // code...
        break;
    }
  }
}
