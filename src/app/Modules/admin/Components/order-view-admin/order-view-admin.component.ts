import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-view-admin',
  templateUrl: './order-view-admin.component.html',
  styleUrl: './order-view-admin.component.scss'
})
export class OrderViewAdminComponent implements OnInit{
  public isAdmin!: boolean;
  public paramId!: string|null;

  constructor(private activatedRoute: ActivatedRoute){}

  ngOnInit(): void {
      this.isAdmin = true;
      this.initializeEditForm();
  }

  public initializeEditForm(): void {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.paramId = String(paramMap.get('id'));
    });
  }

}
