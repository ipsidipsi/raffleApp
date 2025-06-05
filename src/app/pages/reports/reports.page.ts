import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
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
  @ViewChild(IonContent, { static: false }) content!: IonContent;
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
