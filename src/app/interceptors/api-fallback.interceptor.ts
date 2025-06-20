import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';

@Injectable()
export class ApiFallbackInterceptor implements HttpInterceptor {

  private getApiUrls(): string[] {
    // Check if running on mobile (Capacitor) or web
    if (Capacitor.isNativePlatform()) {
      // Mobile: Only use ZeroTier VPN
      return [
        'http://172.24.234.179:3000'  // VPN only for mobile
      ];
    } else {
      // Web: Try LAN first, then VPN fallback
      return [
        'http://192.168.44.25:3000',    // LAN (primary for web)
        'http://172.24.234.179:3000'    // VPN (fallback for web)
      ];
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return this.tryRequest(req, next, 0);
  }

  private tryRequest(req: HttpRequest<any>, next: HttpHandler, urlIndex: number): Observable<any> {
    const apiUrls = this.getApiUrls();
    const currentUrl = apiUrls[urlIndex];

    // Replace the URL in the request
    const modifiedReq = req.clone({
      url: req.url.replace(/http:\/\/[^\/]+/, currentUrl)
    });

    const platform = Capacitor.isNativePlatform() ? 'Mobile' : 'Web';
    console.log(`🌐 ${platform} API Call via: ${currentUrl}${modifiedReq.url.replace(currentUrl, '')}`);

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn(`❌ API call failed via ${currentUrl}:`, error.message);

        // Try next URL if available
        if (urlIndex < apiUrls.length - 1) {
          console.log(`🔄 Retrying with next URL...`);
          return this.tryRequest(req, next, urlIndex + 1);
        }

        // All URLs failed
        console.error('🚨 All API URLs failed');
        return throwError(error);
      })
    );
  }
}
