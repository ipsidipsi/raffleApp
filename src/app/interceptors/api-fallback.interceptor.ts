import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class ApiFallbackInterceptor implements HttpInterceptor {
  private apiUrls = [
    'http://192.168.44.25:3000',    // LAN (primary)
    'http://26.131.195.44:3000'     // VPN (fallback)
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return this.tryRequest(req, next, 0);
  }

  private tryRequest(req: HttpRequest<any>, next: HttpHandler, urlIndex: number): Observable<any> {
    const currentUrl = this.apiUrls[urlIndex];

    // Replace the URL in the request
    const modifiedReq = req.clone({
      url: req.url.replace(/http:\/\/[^\/]+/, currentUrl)
    });

    console.log(`🌐 API Call via: ${currentUrl}${modifiedReq.url.replace(currentUrl, '')}`);

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn(`❌ API call failed via ${currentUrl}:`, error.message);

        // Try next URL if available
        if (urlIndex < this.apiUrls.length - 1) {
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
