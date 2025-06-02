import { Component, OnInit } from '@angular/core';
import { ReportsService, RegistrantReport, AreaReport } from 'src/app/services/reports.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { IonSpinner } from "@ionic/angular/standalone";

@Component({
  standalone: false,
  selector: 'app-registrant-report',
  templateUrl: './registrant-report.component.html',
  styleUrls: ['./registrant-report.component.scss']
})
export class RegistrantReportComponent implements OnInit {
  reportData: RegistrantReport | null = null;
  isLoading = false;
  lastRefresh: Date = new Date();

  constructor(
    private reportsService: ReportsService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadReport();
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadReport(false);
    }, 30000);
  }

  async loadReport(showLoading = true) {
    if (showLoading) {
      this.isLoading = true;
      const loading = await this.loadingController.create({
        message: 'Loading registrant data...',
        spinner: 'circles'
      });
      await loading.present();
    }

    this.reportsService.getRegistrantReport().subscribe({
      next: (data) => {
        this.reportData = data;
        this.lastRefresh = new Date();
        this.isLoading = false;
        if (showLoading) {
          this.loadingController.dismiss();
        }
      },
      error: async (error) => {
        console.error('Failed to load registrant report:', error);
        this.isLoading = false;
        if (showLoading) {
          this.loadingController.dismiss();
        }

        const toast = await this.toastController.create({
          message: 'Failed to load registrant data',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  async refreshReport() {
    await this.loadReport();
    const toast = await this.toastController.create({
      message: 'Report refreshed successfully',
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }

  // Helper method to arrange areas in 3x5 grid
  getAreaGrid(): AreaReport[][] {
    if (!this.reportData?.areaBreakdown) return [];

    const areas = this.reportData.areaBreakdown;
    const grid: AreaReport[][] = [];

    // Create 5 rows with 3 columns each
    for (let i = 0; i < 5; i++) {
      const row: AreaReport[] = [];
      for (let j = 0; j < 3; j++) {
        const index = i * 3 + j;
        if (index < areas.length) {
          row.push(areas[index]);
        }
      }
      if (row.length > 0) {
        grid.push(row);
      }
    }

    return grid;
  }
}
