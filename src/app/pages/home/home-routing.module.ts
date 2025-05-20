import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';

const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'registration',
        loadChildren: () => import('../registration/registration.module').then(m => m.RegistrationPageModule)
      },
      {
        path: 'raffle',
        loadChildren: () => import('../raffle/raffle.module').then(m => m.RafflePageModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('../reports/reports.module').then(m => m.ReportsPageModule)
      },
      {
        path: '',
        redirectTo: 'registration',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
