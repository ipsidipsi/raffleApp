import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';
import { AuthGuard } from 'src/app/auth.guard';
import { AdminGuard } from 'src/app/admin.guard';

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
        loadChildren: () => import('../raffle/raffle.module').then(m => m.RafflePageModule),
        canActivate: [AdminGuard],
      },
      {
        path: 'reports',
        loadChildren: () => import('../reports/reports.module').then(m => m.ReportsPageModule),
        canActivate: [AdminGuard],
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
