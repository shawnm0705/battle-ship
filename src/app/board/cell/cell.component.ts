import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'cell',
  templateUrl: 'cell.component.html',
  styleUrls: ['cell.component.scss'],
})
export class CellComponent {
  @Input() disabled: boolean;
  // The type of this cell. Valid values:
  // 'correct' => this cell is part of a ship
  // 'wrong' => this cell is not part of a ship
  // 'unkown' => this cell has not been shot yet
  @Input() type = 'unknown';
  @Output() clickEvent = new EventEmitter();
  colors = {
    correct: 'success',
    wrong: 'primary-contrast',
    unknown: 'medium'
  }

  constructor() {}

  onClick() {
    this.clickEvent.emit();
  }

  color() {
    return this.colors[this.type];
  }

}
