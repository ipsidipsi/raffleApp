import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth.service';

@Component({
  standalone: false,
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage implements OnInit {
  selectedSegment: string = 'registrants';
  isAdmin: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.checkUserRole();
  }

  checkUserRole() {
    const role = this.authService.getUserRole();
    this.isAdmin = role === 'admin';

    // If not admin and trying to view raffle, switch to registrants
    if (!this.isAdmin && this.selectedSegment === 'raffle') {
      this.selectedSegment = 'registrants';
    }
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
  }
}
