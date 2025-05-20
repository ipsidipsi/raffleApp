import { MenuModule } from './../../menu/menu.module';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { MenuComponent } from 'src/app/menu/menu.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    MenuModule,
  ],
  declarations: [HomePage,],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePageModule {}
