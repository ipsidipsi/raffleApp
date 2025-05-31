import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  private userSubscription?: Subscription;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to user changes to update menu in real-time
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.checkUserRole();
    });

    // Initial check
    this.checkUserRole();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  checkUserRole() {
    const role = this.authService.getUserRole();
    console.log('Menu - User Role:', role);
    this.isAdmin = role === 'admin';
  }

  navigateTo(page: string) {
    this.router.navigate([page]);
  }

  logout() {
    this.authService.logout(); // This will handle clearing storage and redirecting
  }
}
