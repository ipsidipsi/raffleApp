// src/app/services/data-sync.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {
  private registrantCountSubject = new BehaviorSubject<number>(0);
  public registrantCount$ = this.registrantCountSubject.asObservable();
  private areaCountsSubject = new BehaviorSubject<{[areaCode: string]: number}>({});
  public areaCounts$ = this.areaCountsSubject.asObservable();

  updateAreaCount(areaCode: string, count: number) {
    const currentCounts = this.areaCountsSubject.value;
    currentCounts[areaCode] = count;
    this.areaCountsSubject.next({...currentCounts});
  }
  updateRegistrantCount(count: number) {
    this.registrantCountSubject.next(count);
  }

  incrementRegistrantCount() {
    const currentCount = this.registrantCountSubject.value;
    this.registrantCountSubject.next(currentCount + 1);
  }


}
