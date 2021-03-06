/**by Dinesh Selvam -  PheoDScop#3470*/
import {BehaviorSubject} from "rxjs";
import {environment} from '../environments/environment';
import {Injectable} from "@angular/core";
import FundContractV1 from '../assets/FundContractV1.json';
import NftFactoryV1 from '../assets/NftFactoryV1.json';

const Web3 = require('web3');
var Contract = require('web3-eth-contract');

/**
 * Import contract abi (json) after deployment.
 */


declare let require: any;
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  public activeAccount: any; // tracks what account address is currently used.
  public accounts = []; // metamask or other accounts address
  // web3 provider vars
  private readonly web3: any;
  private chainId: any;
  private networkId: any;
  private FundContractInstance: any;
  private NftFactoryInstance: any;


  /** this Subject is like a Event fired. When wallet address (account) is changed then this gets fired.
   *   we can use something similar to track other events.
   */
  private accountChangeSubject = new BehaviorSubject<string>("");
  accountChanged = this.accountChangeSubject.asObservable();

  private getFundingSubject = new BehaviorSubject<string>("");
  userFunded = this.getFundingSubject.asObservable();


  constructor() {
    if (window.ethereum === undefined) {
      console.log('Non-Ethereum browser detected. Install Metamask');
    } else {
      if (typeof window.web3 !== 'undefined') {
        this.web3 = window.web3.currentProvider;
        console.log('Constructor :: window.web3 - Metamask is set');
      } else {
        this.web3 = new Web3.providers.HttpProvider('http://localhost:7545');
        console.log('Constructor :: window.ethereum web3 HTTP provider set');
      }
      console.log(this.web3);
      window.web3 = new Web3(window.ethereum);
      Contract.setProvider(this.web3);
    }
  }

  public accountChecker() {
    const self: this = this;

    return setInterval(function () {
      if (self.activeAccount != window.web3.currentProvider.selectedAddress) {
        self.updateActiveAccount();
      }
    }, 100);
  }

  public updateActiveAccount() {

    if (window.web3.currentProvider.selectedAddress !== null) {
      this.activeAccount = window.web3.currentProvider.selectedAddress;
      //change of account ==> update all pages and go back to main.
      this.accountChangeSubject.next(window.web3.currentProvider.selectedAddress);
    } else {
      this.activeAccount = '';
      this.accountChangeSubject.next("");
      // call disconnected subject
    }
  }

  public async connectToABI() {

    if (window.ethereum !== undefined) {
      // read contract abi
      try {
        // Contract abi connection codes goes here.
        // self.FundContractInstance = new Contract(FundContractV1.abi, environment.fundContractInstance);
        this.FundContractInstance = new window.web3.eth.Contract(FundContractV1.abi, environment.fundContractInstance);
        console.log("FundContractInstance: ", this.FundContractInstance);

        // self.NftFactoryInstance = new Contract(NftFactoryV1.abi, environment.nftFactoryInstance);
        this.NftFactoryInstance = new window.web3.eth.Contract(NftFactoryV1.abi, environment.nftFactoryInstance);
        console.log("NftFactoryInstance: ", this.NftFactoryInstance);

      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(`Failed to load web3, accounts contracts. Check console for details.`);
        console.log(error);
      }
    }
  }

  public async connectToMetaMask() {
    const self: this = this;

    self.chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    self.networkId = await window.ethereum.request({
      method: 'net_version'
    });

    await window.ethereum.request({method: 'eth_requestAccounts'}).then((data: any) => {
      console.log("accounts", data);
      this.activeAccount = data[0];

      console.log("selected add ", window.web3.currentProvider.selectedAddress);

      //set up Behaviour Subject to detect changes to connected account.
      self.accountChangeSubject.next(window.web3.currentProvider.selectedAddress);

      self.accountChecker();

    }).catch((err: any) => {
      console.log("Account Request failed", err);
    });
  }

  public getChainID() {
    return parseInt(this.chainId, 16);
  }

  public async getAccountBalance() {
    let balance = await window.web3.eth.getBalance(this.activeAccount);
    return Web3.utils.fromWei(balance, 'ether')
  }

  //helpers
  public convertToEther(amnt: any) {
    return Web3.utils.fromWei(amnt, 'ether');
  }


  // API to connect -as functions goes here
  // NFT Factory
  public getCredentials(address: string) { //returns uint256 [] credentials
    const self: this = this;
    return self.NftFactoryInstance.methods.getCredentials(address).call().then((data: any) => {
      return data;
    })
  }

  public getidentifiers(credential: number) { //returns bytes4 identifers
    const self: this = this;
    return self.NftFactoryInstance.methods.getidentifiers(credential).call().then((data: any) => {
      return data;
    })
  }

  public canTransfer() { //returns bool
    const self: this = this;
    return self.NftFactoryInstance.methods.canTransfer().call().then((data: any) => {
      return data;
    })
  }

  public mintAnItem(address: string, tokenURI: string, credentialIdentifier: number) { // returns uint256 newCredential
    const self: this = this;
    return self.NftFactoryInstance.methods.mintAnItem(address, tokenURI, credentialIdentifier).send().then((data: any) => {
      return data;
    })
  }

  // Fund Contract
  public createFund(name: string, description: string, distributionAmountPerTram: number, credentailsUsed: number) { //returns uint256 newFundType
    const self: this = this;
    return self.FundContractInstance.methods.createFund(name, description, distributionAmountPerTram, credentailsUsed).send().then((data: any) => {
      return data;
    })
  }

  public getFundDetails() { //returns FundDetails[]
    return this.FundContractInstance.methods.getFundDetails().call().then((result: []) => {
      return result;
    })
  }

  // send the amount you want to transfer to contract and it will be converted to wei before sending to contract via msg.value
  // activeAccount is the current metamask account being used.
  public depositFund(fundType: number, amount: number) { //no return - will prob get some kinda success msg from contract
    const self: this = this;
    return self.FundContractInstance.methods.depositFund(fundType).send({
      from: this.activeAccount,
      value: Web3.utils.toWei(amount, 'ether')
    }).then((data: any) => {
      return data;
    })
  }

  public evaluavateNFTCredentials(credentials: any) { //returns uint256[]
    const self: this = this;
    return self.FundContractInstance.methods.evaluavateNFTCredentials(credentials).call({from: this.activeAccount}).then((data: any) => {
      return data;
    })
  }

  public getFunding(credential: number, fundType: number) { //no return - will prob get some kinda success msg from contract
    const self: this = this;
    return self.FundContractInstance.methods.getFunding(credential, fundType).send({from: this.activeAccount}).then((data: any) => {
      this.getFundingSubject.next("userFunded");
      return data;
    })
  }

}
