import { Component, OnInit } from '@angular/core';
import { ReportsService, RegistrantReport, AreaReport } from 'src/app/services/reports.service';
import { LoadingController, ToastController } from '@ionic/angular';

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

  // Simplified area colors - just for borders now
  // private areaBorderColors: { [key: string]: string } = {
  //   '0001': '#2563eb', '0002': '#059669', '0003': '#d97706', '0004': '#7c3aed',
  //   '0005': '#dc2626', '0006': '#0891b2', '0010': '#65a30d', '0012': '#ea580c',
  //   '0013': '#db2777', '0014': '#0284c7', '0015': '#9333ea', '0016': '#16a34a',
  //   '0019': '#ca8a04', '0020': '#e11d48'
  // };

  constructor(
    private reportsService: ReportsService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadReport();
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

  formatLargeNumber(num: number): string {
    return num.toLocaleString();
  }

  formatAreaCount(num: number): string {
    return num.toLocaleString();
  }

  getShortAreaName(fullName: string): string {
    return fullName
      .replace(' CO', '')
      .replace(' SO', '')
      // .replace('REINA MERCEDES', 'R. MERCEDES')
      // .replace('SAN GUILLERMO', 'S. GUILLERMO')
      // .replace('SAN AGUSTIN', 'S. AGUSTIN')
      // .replace('SAN ISIDRO', 'S. ISIDRO')
      // .replace('SAN MATEO', 'S. MATEO');
  }

  // getAreaBorderStyle(areaCode: string): string {
  //   const color = this.areaBorderColors[areaCode] || '#e2e8f0';
  //   return `4px solid ${color}`;
  // }

  getEmptySlots(): number[] {
    if (!this.reportData?.areaBreakdown) return [];

    const currentCount = this.reportData.areaBreakdown.length;
    const maxSlots = 15;
    const emptyCount = Math.max(0, maxSlots - currentCount);

    return Array(emptyCount).fill(0).map((_, i) => i);
  }
}
