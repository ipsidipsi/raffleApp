import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkSelectionService {
  private networks = {
    lan: 'http://192.168.44.25:3000',
    vpn: 'http://26.131.195.44:3000'
  };

  private currentNetworkSubject = new BehaviorSubject<string>('lan');
  public currentNetwork$ = this.currentNetworkSubject.asObservable();

  constructor() {
    // Load saved preference or default to LAN
    const savedNetwork = localStorage.getItem('selected-network') || 'lan';
    this.currentNetworkSubject.next(savedNetwork);
  }

  setNetwork(networkType: 'lan' | 'vpn') {
    this.currentNetworkSubject.next(networkType);
    localStorage.setItem('selected-network', networkType);
    console.log(`🌐 Switched to ${networkType.toUpperCase()}: ${this.networks[networkType]}`);
  }

  getCurrentNetworkType(): string {
    return this.currentNetworkSubject.value;
  }

  getCurrentApiUrl(): string {
    const networkType = this.currentNetworkSubject.value as 'lan' | 'vpn';
    return this.networks[networkType];
  }

  getNetworkLabel(): string {
    const type = this.currentNetworkSubject.value;
    return type === 'lan' ? '🌐 LAN (Fast)' : '🔗 VPN/Internet';
  }
}
