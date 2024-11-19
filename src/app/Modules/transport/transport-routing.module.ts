import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: '/transport-form',  // Redirect root URL to '/transport-form'
  //   pathMatch: 'full'
  // },
  // {
  //   path: 'edit/:id',
  //   component: TransportFormComponent
  // },
  // {
  //   path: 'supplier-form',
  //   component: SupplierFormComponent
  // }
  // {
  //   path: '',
  //   redirectTo: '/transport-form',
  //   pathMatch: 'full'
  // },
  // {
  //   path: 'transport-form',
  //   component: TransportFormComponent
  // },
  // {
  //   path: 'edit/:id',
  //   component: TransportFormComponent
  // },
  // {
  //   path: 'supplier-form',
  //   component: SupplierFormComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransportRoutingModule { }
