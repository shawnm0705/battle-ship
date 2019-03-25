import { Component } from '@angular/core';

@Component({
  selector: 'game',
  templateUrl: 'game.page.html',
  styleUrls: ['game.page.scss'],
})
export class GamePage {
  state = 'creating';

  constructor() {
  }
}
