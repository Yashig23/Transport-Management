import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StocksRoutingModule } from './stocks-routing.module';
import { StockDetailsComponent } from './Components/stock-details/stock-details.component';
import { StockExecutionComponent } from './Components/stock-execution/stock-execution.component';
import { SharedModule } from '../shared/shared.module';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { TestComponent } from './Components/test/test.component';
import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [
    StockDetailsComponent,
    StockExecutionComponent,
    TestComponent
  ],
  imports: [
    CommonModule,
    StocksRoutingModule,
    SharedModule,
    MatIconModule,
    MatTableModule,
    FormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule
  ]
})
export class StocksModule { }
