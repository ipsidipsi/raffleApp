import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetalertService {

  private getBaseConfig() {
    return {
      backdrop: `rgba(0, 0, 0, 0.5)`,
      allowOutsideClick: true,
      allowEscapeKey: true,
      width: '400px',
      padding: '25px',
      heightAuto: false,
      customClass: {
        container: 'swal-container-center',
        popup: 'swal-popup-center'
      }
    };
  }

  showSuccess(title: string, message: string, timer: number = 3000) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text: message,
      icon: 'success',
      timer,
      showConfirmButton: timer ? false : true,
      confirmButtonText: 'OK'
    });
  }

  showError(title: string, message: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }

  showWarning(title: string, message: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f39c12'
    });
  }

  showConfirmation(title: string, message: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
  }

  showLoading(title: string, message: string) {
    return Swal.fire({
      ...this.getBaseConfig(),
      title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
}
