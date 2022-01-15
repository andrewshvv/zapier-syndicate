import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../web3.service'

@Component({
  selector: 'funds',
  templateUrl: './funds.component.html',
  styleUrls: ['./funds.component.scss']
})
export class FundsComponent implements OnInit {

    connectedToMetaMask: boolean = false;

    public otherFunds: any = [];
    
    constructor(private web3: Web3Service){}

    ngOnInit(): void {
        // this.otherFunds.push('test')
        this.web3.accountChanged.subscribe((data:any)=>{
            if(data != undefined && data != ''){
            //   this.web3Changed(true);
              this.connectedToMetaMask = true;
            }else{
            //   this.web3Changed(false);
              this.connectedToMetaMask = false;
            }
          })
    }

    public metamaskConnect(){
        console.log("Metamask connect trigger");
        this.web3.connectToMetaMask();
      }

}
