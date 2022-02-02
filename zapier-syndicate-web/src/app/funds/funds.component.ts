import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../web3.service'

@Component({
  selector: 'funds',
  templateUrl: './funds.component.html',
  styleUrls: ['./funds.component.scss']
})
export class FundsComponent implements OnInit {

  connectedToMetaMask: boolean = false;

  public otherFunds: any = [];
  public credentials: any = [];
  public validFunds: any = [];
  public userFunds: any = [];

  constructor(private web3: Web3Service) {
  }

  ngOnInit(): void {
    // this.otherFunds.push('test')
    this.web3.accountChanged.subscribe((data: any) => {
      if (data != undefined && data != '') {
        //   this.web3Changed(true);
        this.connectedToMetaMask = true;
      } else {
        //   this.web3Changed(false);
        this.connectedToMetaMask = false;
      }
    })

    this.web3.userFunded.subscribe((data: any) => {
      if (data != undefined && data != '') {
        this.otherFunds = [];
        this.credentials = [];
        this.validFunds = [];
        this.userFunds = [];

        this.getAllFunds();
        this.getCredentials();
      }
    })

    this.getAllFunds();
  }

  public metamaskConnect() {
    console.log("Metamask connect trigger");
    this.web3.connectToMetaMask().then(() => {
      this.getCredentials()
    });
  }

  public async getCredentials() {
    let res = await this.web3.getCredentials(this.web3.activeAccount).then((data: any) => {
      console.log(data)
      this.credentials.push(data[0]);
      this.evaluavateCreds();
    })
  }

  public async evaluavateCreds() {
    let res = await this.web3.evaluavateNFTCredentials(this.credentials).then((data: []) => {
      console.log("evel creds", data);

      for (var i = 0; i < data.length; i++) {
        if (data[i] != 0) {
          this.validFunds.push(data[i]);
        }
      }

      for (var i = 0; i < this.otherFunds.length; i++) {
        if (this.otherFunds[i].fundType == this.validFunds[0]) {
          this.userFunds.push(this.otherFunds[i]);
        }
      }

    })
  }

  public async getFunding() {
    let res = await this.web3.getFunding(this.credentials[0], this.userFunds[0].fundType).then((data: any) => {
      console.log(data);
    })
  }

  public async getAllFunds() {
    let res = await this.web3.getFundDetails().then((result: []) => {
      console.log(result);
      if (result != null && result.length > 0) {
        result.forEach((res: any) => {
          let obj = {
            createdBy: res.createdBy,
            createdDate: res.createdDate,
            credentailsUsed: res.credentailsUsed,
            description: res.description,
            fundType: res.fundType,
            maxDistributableAmountPerTeam: this.web3.convertToEther(res.maxDistributableAmountPerTeam),
            name: res.name,
            totalAmountDeposited: this.web3.convertToEther(res.totalAmountDeposited),
            totalAmountDisbursed: this.web3.convertToEther(res.totalAmountDisbursed)
          }

          this.otherFunds.push(obj);
        })
      }
    })
  }

  public getDifference(deposit: string, disbursed: string) {
    return (parseFloat(deposit) - parseFloat(disbursed)).toFixed(2);
  }

}
