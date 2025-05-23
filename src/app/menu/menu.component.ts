import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { IonicModule } from '@ionic/angular';

import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuButton,
  IonTitle,
  IonToolbar,
  IonItem,
} from '@ionic/angular';

@Component({
  standalone:false,
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
 // imports: [ IonContent, IonHeader, IonMenu,  IonTitle, IonToolbar,IonItem, IonicModule],
})
export class MenuComponent {
  isAdmin: boolean = false;

  constructor(private router: Router, private authService: AuthService) {
    this.checkUserRole();
  }

  checkUserRole() {
    const role = this.authService.getUserRole();
    console.log('Menu - User Role:', role); // Log the user role in the menu
    this.isAdmin = role === 'admin';
  }

  navigateTo(page: string) {
    this.router.navigate([page]);
  }
  logout() {
    this.authService.logout(); // Ensure you have a logout method in AuthService
    this.router.navigate(['/login']);
  }
}
