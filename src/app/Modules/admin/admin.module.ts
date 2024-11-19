import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { OrderListAdminComponent } from './Components/order-list-admin/order-list-admin.component';
import { OrderViewAdminComponent } from './Components/order-view-admin/order-view-admin.component';


@NgModule({
  declarations: [
    OrderListAdminComponent,
    OrderViewAdminComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule
  ]
})
export class AdminModule { }
