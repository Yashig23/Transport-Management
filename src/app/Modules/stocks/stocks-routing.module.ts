import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockDetailsComponent } from './Components/stock-details/stock-details.component';
import { StockExecutionComponent } from './Components/stock-execution/stock-execution.component';

const routes: Routes = [
  {path:'', component: StockDetailsComponent},
  {path:"stock-execution/:id", component: StockExecutionComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StocksRoutingModule { }
