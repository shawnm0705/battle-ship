import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { RouterModule } from '@angular/router';

import { BoardModule } from '@app/board/board.module';
import { GamePage } from './game.page';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: GamePage
      }
    ]),
    BoardModule
  ],
  declarations: [GamePage]
})
export class GameModule {}
