import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-view-client',
  templateUrl: './order-view-client.component.html',
  styleUrl: './order-view-client.component.scss'
})
export class OrderViewClientComponent implements OnInit{
  public isClient!: boolean;
  public paramId!: string|null;

  constructor(private activatedRoute: ActivatedRoute){

  }

  ngOnInit(): void {
      this.isClient = false;
      this.initializeEditForm();
  }

  public initializeEditForm(): void {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.paramId = String(paramMap.get('id'));
    });
  }
}
