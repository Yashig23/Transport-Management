import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedOrderComponent } from '../shared/sharedComponents/Components/shared-order/shared-order.component';
import { SharedOrderViewComponent } from '../shared/sharedComponents/Components/shared-order-view/shared-order-view.component';
import { FormComponent } from '../shared/sharedComponents/Components/form/form.component';
const routes: Routes = [
  {
    path: '',
    component: SharedOrderComponent, 
  },
  // {path: "", component: OrderListAdminComponent},
  {path: 'order-view/:id', component: SharedOrderViewComponent},
  {path: 'transport-form/:id', component: FormComponent},
  {path: 'transport-form', component: FormComponent},
  {path: 'transport-form/changeRequest/:id', component: FormComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
