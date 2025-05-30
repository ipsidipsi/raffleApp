import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RegistrationPageRoutingModule } from './registration-routing.module';
import { RegistrationPage } from './registration.page';
import { SearchModalComponent } from './search-modal/search-modal.component';
import { RegistrationModalComponent } from './registration-modal/registration-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule, // Required for ngModel
    ReactiveFormsModule, // Required for reactive forms
    IonicModule,
    RegistrationPageRoutingModule
  ],
  declarations: [
    RegistrationPage,
    SearchModalComponent, // Now properly declared (not imported)
    RegistrationModalComponent // Now properly declared (not imported)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RegistrationPageModule {}