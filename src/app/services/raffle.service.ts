import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AreaInfo {
  AreaCode: string;
  AreaName: string;
  TotalRegistrants: number;
  EligibleRegistrants: number;
}

export interface DrawRequest {
  prizeName: string;
  numberOfWinners: number;
  areaCodes?: string[];
  createdBy?: string;
}

export interface Winner {
  id: number;
  stubNumber:string;
  accountNumber: string;
  consumerName: string;
  consumerAddress: string;
  area: string;
  AreaName: string;
  prizeWon: string;
  drawTimestamp: string;
  status: string;
  animating?: boolean;
}

export interface DrawResponse {
  success: boolean;
  data: {
    winners: Winner[];
    drawGuid: string;
    totalWinners: number;
    prizeName: string;
  };
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RaffleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAvailableAreas(): Observable<ApiResponse<AreaInfo[]>> {
    return this.http.get<ApiResponse<AreaInfo[]>>(`${this.apiUrl}/raffle/areas`, {
      headers: this.getHeaders()
    });
  }

  getEligibleCount(areaCodes?: string[]): Observable<ApiResponse<any[]>> {
    const payload = areaCodes ? { areaCodes } : {};
    return this.http.post<ApiResponse<any[]>>(`${this.apiUrl}/raffle/eligible-count`, payload, {
      headers: this.getHeaders()
    });
  }

  executeDraw(drawRequest: DrawRequest): Observable<DrawResponse> {
    return this.http.post<DrawResponse>(`${this.apiUrl}/raffle/draw`, drawRequest, {
      headers: this.getHeaders()
    });
  }

  getWinnersByDraw(drawGuid: string): Observable<ApiResponse<Winner[]>> {
    return this.http.get<ApiResponse<Winner[]>>(`${this.apiUrl}/raffle/winners/${drawGuid}`, {
      headers: this.getHeaders()
    });
  }

  confirmWinner(registrantId: number, status: 'valid_winner' | 'invalid_winner'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/raffle/confirm-winner`, {
      registrantId,
      status
    }, {
      headers: this.getHeaders()
    });
  }

  bulkConfirmDraw(drawGuid: string, status: 'valid_winner' | 'invalid_winner'): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/raffle/bulk-confirm`, {
      drawGuid,
      status
    }, {
      headers: this.getHeaders()
    });
  }

  getDrawStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/raffle/stats`, {
      headers: this.getHeaders()
    });
  }
}
