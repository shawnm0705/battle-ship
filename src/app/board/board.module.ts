import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { BoardComponent } from './board.component';
import { CellComponent } from './cell/cell.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    BoardComponent,
    CellComponent
  ],
  exports: [
    BoardComponent
  ]
})
export class BoardModule {}
