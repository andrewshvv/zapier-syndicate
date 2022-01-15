import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FundsModule } from './funds/funds.module'

import { Web3Service } from './web3.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    FundsModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule
  ],
  providers: [Web3Service],
  bootstrap: [AppComponent]
})
export class AppModule { }
