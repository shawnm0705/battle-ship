import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { BoardComponent } from './board.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [BoardComponent]
})
export class BoardModule {}
