import { Component, OnInit } from '@angular/core';
import { Web3Service } from './web3.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  connectedToMetaMask: boolean = false;

  constructor(private web3: Web3Service){}

  ngOnInit(): void {
    this.web3.accountChanged.subscribe((data:any)=>{
      if(data != undefined && data != ''){
        this.web3Changed(true);
      }else{
        this.web3Changed(false);
      }
    })
      
  }

  public web3Changed(isConnected: boolean){
    if(isConnected){
      this.connectedToMetaMask = true;
    }else{
      this.connectedToMetaMask = false;
    }
  }

  public metamaskConnect(){
    console.log("Metamask connect trigger");
    // this.web3.connectToMetaMask();
  }
}
