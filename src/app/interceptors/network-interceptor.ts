import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { NetworkSelectionService } from '../services/network-selection.service';

@Injectable()
export class NetworkInterceptor implements HttpInterceptor {
  constructor(private networkService: NetworkSelectionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const selectedApiUrl = this.networkService.getCurrentApiUrl();

    // Replace the URL with the selected network
    const modifiedReq = req.clone({
      url: req.url.replace(/http:\/\/[^\/]+/, selectedApiUrl)
    });

    return next.handle(modifiedReq);
  }
}
