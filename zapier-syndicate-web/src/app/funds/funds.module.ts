import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

//component
import {FundsComponent} from './funds.component';
//directives
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    FundsComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [FundsComponent]
})
export class FundsModule {
}
