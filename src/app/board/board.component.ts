import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'board',
  templateUrl: 'board.component.html',
  styleUrls: ['board.component.scss'],
})
export class BoardComponent {
  // size of the board
  width = 10;
  height = 10;
  rows = Array(this.width).fill(0).map((v, i) => i);
  columns = Array(this.height).fill(0).map((v, i) => i);
  @Input() disabled = false;
  // Current board status -> which cell is correct/wrong/unknown
  @Input() status;
  @Output() step = new EventEmitter();

  constructor() {}

  onClick(x, y) {
    this.step.emit([x, y]);
  }
}
