import { Component, Input } from '@angular/core';

@Component({
  selector: 'board',
  templateUrl: 'board.component.html',
  styleUrls: ['board.component.scss'],
})
export class BoardComponent {
  // size of the board
  width = 10;
  height = 10;
  // Type of the board. Valid values:
  // 'setting' => setting up the board for a new game
  // 'opponent' => the board of the player you are playing against, allow clicking actions
  // 'my' => your board, do not allow any actions
  @Input() type: string;
  @Input() myTurn = false;

  constructor() {
  }
}
