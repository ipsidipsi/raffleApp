// src/app/pages/reports/components/raffle-report/raffle-report.component.ts
import { Component, OnInit } from '@angular/core';
import { ReportsService, RaffleReport, RaffleDraw } from 'src/app/services/reports.service';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';

@Component({
  standalone: false,  // <-- This should be false
  selector: 'app-raffle-report',
  templateUrl: './raffle-report.component.html',
  styleUrls: ['./raffle-report.component.scss']
})
export class RaffleReportComponent implements OnInit {
  reportData: RaffleReport | null = null;
  isLoading = false;
  expandedDraws: Set<number> = new Set();

  constructor(
    private reportsService: ReportsService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadRaffleReport();
  }

  async loadRaffleReport() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading raffle data...',
      spinner: 'circles'
    });
    await loading.present();

    this.reportsService.getRaffleReport().subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        console.error('Failed to load raffle report:', error);
        this.isLoading = false;
        loading.dismiss();

        const toast = await this.toastController.create({
          message: 'Failed to load raffle data',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  toggleDrawExpansion(drawId: number) {
    if (this.expandedDraws.has(drawId)) {
      this.expandedDraws.delete(drawId);
    } else {
      this.expandedDraws.add(drawId);
    }
  }

  isDrawExpanded(drawId: number): boolean {
    return this.expandedDraws.has(drawId);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'valid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'disqualified':
      case 'invalid':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'valid':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'disqualified':
      case 'invalid':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  }

  async exportData(format: 'excel' | 'csv') {
    const loading = await this.loadingController.create({
      message: `Generating ${format.toUpperCase()} export...`,
      spinner: 'circles'
    });
    await loading.present();

    this.reportsService.exportRaffleData(format).subscribe({
      next: (blob) => {
        loading.dismiss();
        this.downloadFile(blob, format);
      },
      error: async (error) => {
        console.error('Export failed:', error);
        loading.dismiss();

        const toast = await this.toastController.create({
          message: 'Export failed. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  private downloadFile(blob: Blob, format: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `raffle-report-${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async showExportOptions() {
    const alert = await this.alertController.create({
      header: 'Export Raffle Report',
      message: 'Choose your preferred export format:',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Excel (.xlsx)',
          handler: () => {
            this.exportData('excel');
          }
        },
        {
          text: 'CSV (.csv)',
          handler: () => {
            this.exportData('csv');
          }
        }
      ]
    });

    await alert.present();
  }
}
