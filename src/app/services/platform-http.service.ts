// Update: src/app/services/platform-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Make sure HttpHeaders is imported
import { Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlatformHttpService {

  constructor(private http: HttpClient) {}

  post(url: string, data: any, options?: any): Observable<any> {
    if (Capacitor.isNativePlatform()) {
      // Mobile: Use Capacitor community HTTP plugin (truly native)
      console.log('📱 Using Capacitor Community HTTP for mobile');
      return from(this.capacitorPost(url, data, options));
    } else {
      // Web: Use regular HttpClient
      console.log('🌐 Using HttpClient for web');
      return this.http.post(url, data, options);
    }
  }

  get(url: string, options?: any): Observable<any> {
    if (Capacitor.isNativePlatform()) {
      // Mobile: Use Capacitor community HTTP plugin (truly native)
      console.log('📱 Using Capacitor Community HTTP for mobile');
      return from(this.capacitorGet(url, options));
    } else {
      // Web: Use regular HttpClient
      console.log('🌐 Using HttpClient for web');
      return this.http.get(url, options);
    }
  }

  private async capacitorPost(url: string, data: any, options?: any): Promise<any> {
    try {
      console.log('📱 Capacitor Community POST to:', url);
      console.log('📱 Data:', data);
      console.log('📱 Options:', options);

      // Extract headers from options
      const headers = options?.headers instanceof HttpHeaders
        ? this.convertHttpHeadersToObject(options.headers)
        : (options?.headers || {});

      const result = await Http.post({
        url: url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        data: data,
        params: {} // Add empty params to avoid NullPointerException
      });

      console.log('📱 Capacitor Community response:', result);
      console.log('📱 Response status:', result.status);
      console.log('📱 Response data:', result.data);

      // Check if the response was successful
      if (result.status >= 200 && result.status < 300) {
        return result.data;
      } else {
        throw new Error(`HTTP error! status: ${result.status}`);
      }
    } catch (error) {
      console.error('📱 Capacitor Community POST error:', error);
      throw error;
    }
  }

  private async capacitorGet(url: string, options?: any): Promise<any> {
    try {
      console.log('📱 Capacitor Community GET to:', url);
      console.log('📱 Options:', options);

      // Extract headers from options
      const headers = options?.headers instanceof HttpHeaders
        ? this.convertHttpHeadersToObject(options.headers)
        : (options?.headers || {});

      const result = await Http.get({
        url: url,
        headers: headers,
        params: {} // Add empty params to avoid NullPointerException
      });

      console.log('📱 Capacitor Community response:', result);

      // Check if the response was successful
      if (result.status >= 200 && result.status < 300) {
        return result.data;
      } else {
        throw new Error(`HTTP error! status: ${result.status}`);
      }
    } catch (error) {
      console.error('📱 Capacitor Community GET error:', error);
      throw error;
    }
  }

  // Helper method to convert Angular HttpHeaders to plain object
  private convertHttpHeadersToObject(headers: HttpHeaders): Record<string, string> {
    const headersObj: Record<string, string> = {};
    headers.keys().forEach((key: string) => {
      const value = headers.get(key);
      if (value) {
        headersObj[key] = value;
      }
    });
    return headersObj;
  }
}
