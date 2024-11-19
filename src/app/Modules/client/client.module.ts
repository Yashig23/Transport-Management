import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { OrderListClientComponent } from './Components/order-list-client/order-list-client.component';
import { SharedModule } from '../shared/shared.module';
import { OrderViewClientComponent } from './Components/order-view-client/order-view-client.component';

@NgModule({
  declarations: [
    OrderListClientComponent,
    OrderViewClientComponent
  ],
  imports: [
    CommonModule,
    ClientRoutingModule,
    SharedModule
  ]
})
export class ClientModule { }
