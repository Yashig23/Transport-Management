import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-order-list-client',
  templateUrl: './order-list-client.component.html',
  styleUrl: './order-list-client.component.scss'
})
export class OrderListClientComponent implements OnInit{
  public isClient!: boolean;

  constructor(){

  }

  ngOnInit(): void {
    this.isClient = false; 
  }

}
