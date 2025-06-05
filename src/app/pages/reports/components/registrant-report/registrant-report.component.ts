import { Component, OnInit } from '@angular/core';
import { ReportsService, RegistrantReport, AreaReport } from 'src/app/services/reports.service';
import { LoadingController, ToastController } from '@ionic/angular';
import * as XLSX from 'xlsx';
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
   // Export to CSV
  async exportToCSV() {
    if (!this.reportData) {
      await this.showErrorToast('No data available to export');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generating CSV export...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const csvData = this.generateCSVData();
      this.downloadFile(csvData, 'registrant-summary.csv', 'text/csv');
      
      loading.dismiss();
      await this.showSuccessToast('CSV file downloaded successfully');
    } catch (error) {
      console.error('CSV export failed:', error);
      loading.dismiss();
      await this.showErrorToast('Failed to generate CSV file');
    }
  }

  // Export to Excel
  async exportToExcel() {
    if (!this.reportData) {
      await this.showErrorToast('No data available to export');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generating Excel export...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      const excelData = this.generateExcelData();
      this.downloadFile(excelData, 'registrant-summary.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      loading.dismiss();
      await this.showSuccessToast('Excel file downloaded successfully');
    } catch (error) {
      console.error('Excel export failed:', error);
      loading.dismiss();
      await this.showErrorToast('Failed to generate Excel file');
    }
  }

  // Generate CSV data
  private generateCSVData(): string {
    if (!this.reportData) return '';

    const rows: string[] = [];
    
    // Add header
    rows.push('Area Code,Area Name,Registrant Count');
    
    // Add area data
    this.reportData.areaBreakdown.forEach(area => {
      const areaName = `"${area.areaName}"`;  // Wrap in quotes to handle commas
      rows.push(`${area.areaCode},${areaName},${area.registrantCount}`);
    });
    
    // Add total row
    rows.push('');  // Empty row for separation
    rows.push(`TOTAL,,${this.reportData.totalRegistrants}`);
    
    // Add metadata
    rows.push('');
    rows.push(`Generated,${new Date().toLocaleString()}`);
    
    return rows.join('\n');
  }

  // Generate Excel data
  private generateExcelData(): ArrayBuffer {
    if (!this.reportData) throw new Error('No data available');

    // Prepare data for Excel
    const worksheetData = [
      ['Area Code', 'Area Name', 'Registrant Count'], // Header
      ...this.reportData.areaBreakdown.map(area => [
        area.areaCode,
        area.areaName,
        area.registrantCount
      ]),
      [], // Empty row
      ['TOTAL', '', this.reportData.totalRegistrants], // Total row
      [], // Empty row
      ['Generated', new Date().toLocaleString(), ''] // Metadata
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style the header row (make it bold)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:C1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E3F2FD' } }
      };
    }

    // Style the total row
    const totalRowIndex = this.reportData.areaBreakdown.length + 1;
    const totalCellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: 0 });
    if (worksheet[totalCellAddress]) {
      worksheet[totalCellAddress].s = { font: { bold: true } };
    }

    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Area Code
      { width: 25 }, // Area Name
      { width: 15 }  // Count
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrant Summary');

    // Generate Excel file
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  }

  // Download file helper
  private downloadFile(data: string | ArrayBuffer, filename: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
  }
 private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      icon: 'checkmark-circle'
    });
    toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      icon: 'alert-circle'
    });
    toast.present();
  }

}
