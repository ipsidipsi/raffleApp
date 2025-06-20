// Update your reports.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PlatformHttpService } from './platform-http.service'; // Add this import

export interface AreaReport {
  areaCode: string;
  areaName: string;
  registrantCount: number;
}

export interface RegistrantReport {
  totalRegistrants: number;
  areaBreakdown: AreaReport[];
  lastUpdated: string;
}

export interface RaffleWinner {
  registrantId: number;
  consumerName: string;
  accountNumber: string;
  areaCode: string;
  areaName: string;
  meterNumber: string;
  consumerAddress: string;
  town: string;
  district: string;
  status: string;
  prizeWon: string;
  isWinner: boolean;
  confirmedAt: string | null;
  registrationTimestamp: string;
  stubNumber:string;
}

export interface RaffleDraw {
  id: number;
  drawGuid: string;
  drawNumber: string;
  prizeName: string;
  totalWinners: number;
  numberOfWinners: number;
  drawDate: string;
  filterCriteria: string;
  createdBy: string;
  status: string;
  winners: RaffleWinner[];
}

export interface RaffleReport {
  raffleDraws: RaffleDraw[];
  summary: {
    totalDraws: number;
    totalWinners: number;
    confirmedWinners: number;
    disqualifiedWinners: number;
    pendingWinners: number;
    validWinners: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private platformHttp: PlatformHttpService // Add this
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getRegistrantReport(): Observable<RegistrantReport> {
    const headers = this.getAuthHeaders();
    return this.platformHttp.get(`${this.apiUrl}/reports/registrants`, { headers });
  }

  getRaffleReport(): Observable<RaffleReport> {
    const headers = this.getAuthHeaders();
    return this.platformHttp.get(`${this.apiUrl}/reports/raffle`, { headers });
  }

  exportRaffleData(format: 'excel' | 'csv'): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.platformHttp.get(`${this.apiUrl}/reports/raffle/export?format=${format}`, {
      headers,
      responseType: 'blob'
    });
  }
}
