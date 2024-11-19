import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-order-list-admin',
  templateUrl: './order-list-admin.component.html',
  styleUrl: './order-list-admin.component.scss'
})
export class OrderListAdminComponent implements OnInit{
  public isAdmin!: boolean;

  constructor(){

  }

  ngOnInit(): void {
      this.isAdmin = true;
  }

}
