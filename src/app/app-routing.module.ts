import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'transport',
    loadChildren: () => import('./Modules/transport/transport.module').then(m => m.TransportModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./Modules/admin/admin.module').then(m => m.AdminModule),
    data: { moduleType: true }
  },
  {
    path: 'client',
    loadChildren: () => import('./Modules/client/client.module').then(m => m.ClientModule),
    data: { moduleType: false }
  },
  {
    path: '',
    redirectTo: '/admin', 
    pathMatch: 'full'
  },
  {
    path: '**', 
    redirectTo: '/admin'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

