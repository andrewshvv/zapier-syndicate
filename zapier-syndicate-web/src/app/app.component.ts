import { Component, OnInit } from '@angular/core';
import { Web3Service } from './web3.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  connectedToMetaMask: boolean = false;

  connectedNetwork: string = '';
  currentAccountBalance: number = 0;

  networks: any = {
    1: "Ethereum",
    4: "Ethereum Rinkeby",
    97: "Binance Smart Chain Testnet"
  };

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
      this.getNetworkName(this.web3.getChainID());
      this.getCurrentAccountBalance();
    }else{
      this.connectedToMetaMask = false;
    }
  }

  public metamaskConnect(){
    console.log("Metamask connect trigger");
    this.web3.connectToMetaMask();
  }

  public getNetworkName(chainId: any){
    if(chainId != undefined || chainId != ''){
      this.connectedNetwork = this.networks[chainId];
    }
  }

  public async getCurrentAccountBalance(){
    this.currentAccountBalance = await this.web3.getAccountBalance().then((data: any) =>{
      console.log(data);
      return data;
    });
  }
}
