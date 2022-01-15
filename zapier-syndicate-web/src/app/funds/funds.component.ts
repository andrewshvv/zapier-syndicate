import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../web3.service'

@Component({
  selector: 'funds',
  templateUrl: './funds.component.html',
  styleUrls: ['./funds.component.scss']
})
export class FundsComponent implements OnInit {

  constructor(private web3: Web3Service){}

  ngOnInit(): void {
      
  }

}
