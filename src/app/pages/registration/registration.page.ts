import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LoadingController, ModalController, ToastController, AlertController } from '@ionic/angular';
import { SearchModalComponent } from './search-modal/search-modal.component';
//import * as Swal from 'sweetalert2';
//import Swal from 'sweetalert2';
import { SweetalertService } from 'src/app/services/sweetalert.service';
import { DataSyncService } from 'src/app/services/data-sync.service';

@Component({
   standalone:false,
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {
  registrationForm: FormGroup;
  registeredConsumers: any[] = [];
  filteredRegistrants: any[] = [];
  filterType: string = 'stubNumber';
  searchFilter: string = '';
  isLoading = false;
    Math = Math;

   // New pagination properties
  currentPage: number = 1;
  totalRecords: number = 0;
  totalPages: number = 0;
  pageSize: number = 20;
  hasMore: boolean = false;

   private searchTimeout: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private sweetAlert: SweetalertService,
    private dataSyncService: DataSyncService,
  ) {
    this.registrationForm = this.fb.group({
      stubNumber: ['', [Validators.required, Validators.pattern(/^\d{1,5}$/)]],
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      consumerName: ['', Validators.required],
      consumerAddress: ['', Validators.required],
      meterNumber: ['']
    });
  }

  ngOnInit() {
    this.loadRegisteredConsumers();
  }

 onStubNumberInput(event: any) {
  // Remove non-numeric characters and limit to 5 digits
  let value = event.target.value.replace(/[^0-9]/g, '').slice(0, 5);

  // Store the raw numeric value (001 = 1)
  this.registrationForm.patchValue({ stubNumber: value });

  // Update the display to show the entered value
  event.target.value = value;
}

getFormattedStubNumber(): string {
  const stubValue = this.registrationForm.get('stubNumber')?.value;
  if (!stubValue) return '';

  // Convert to number to remove leading zeros, then back to string
  const numericValue = parseInt(stubValue, 10);
  return numericValue.toString();
}

  onAccountNumberInput(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    this.registrationForm.patchValue({ accountNumber: value });
  }

  async openSearchModal(searchType: 'accountNumber' | 'consumerName') {
    const modal = await this.modalController.create({
      component: SearchModalComponent,
      componentProps: {
        searchType: searchType
      },
      cssClass: 'search-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedConsumer) {
      this.populateFormFromSelectedConsumer(data.selectedConsumer);
    }
  }

  populateFormFromSelectedConsumer(consumer: any) {
    this.registrationForm.patchValue({
      accountNumber: consumer.accountNumber,
      consumerName: consumer.consumerName,
      consumerAddress: consumer.consumerAddress,
      meterNumber: consumer.meterNumber
    });
  }

async register() {
  if (this.registrationForm.invalid) {
    this.sweetAlert.showWarning(
      'Invalid Form',
      'Please fill in all required fields correctly.'
    );
    return;
  }

  // Show loading
  this.sweetAlert.showLoading(
    'Processing Registration...',
    'Please wait while we register the account.'
  );

  const registrationData = {
    accountNumber: this.registrationForm.value.accountNumber,
    stubNumber: this.getFormattedStubNumber(),
  };

  this.http.post(`${environment.apiUrl}/registration/`, registrationData).subscribe({
    next: async (response: any) => {
      this.sweetAlert.showSuccess(
        'Registration Successful!',
        `Account ${registrationData.accountNumber} has been registered successfully.`
      );

      // Add to local list if we're on the first page and no search filter
      if (this.currentPage === 1 && !this.searchFilter.trim()) {
        const newRegistrant = {
          id: response.id || Date.now(),
          stubNumber: registrationData.stubNumber,
          accountNumber: registrationData.accountNumber,
          consumerName: this.registrationForm.value.consumerName,
          consumerAddress: this.registrationForm.value.consumerAddress,
          registrationTimestamp: new Date().toISOString()
        };

        // Add to beginning of list (latest first)
        this.registeredConsumers.unshift(newRegistrant);
        this.filteredRegistrants = [...this.registeredConsumers];

        // Remove last item if we exceed page size
        if (this.registeredConsumers.length > this.pageSize) {
          this.registeredConsumers.pop();
          this.filteredRegistrants.pop();
        }

        // Update total count
        this.totalRecords++;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      } else {
        // If not on first page or filtering, just reload current page
        this.loadRegisteredConsumers(this.currentPage, true);
      }

      this.dataSyncService.incrementRegistrantCount();
      this.clearForm();
    },
    error: async (err) => {
      console.error('Registration failed', err);
      this.handleRegistrationError(err);
    }
  });
}
handleRegistrationError(error: any) {
  let title = 'Registration Failed';
  let message = 'An unexpected error occurred. Please try again.';

  // Check the error response for specific error messages
  if (error.error) {
    const errorMessage = error.error.message || error.error;
    const lowerErrorMessage = errorMessage.toLowerCase();

    // Handle specific error cases with better pattern matching
    if (lowerErrorMessage.includes('duplicate account') ||
        (lowerErrorMessage.includes('account') && (lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('already exists') || lowerErrorMessage.includes('exist')))) {
      title = 'Duplicate Account Number';
      message = `Account number ${this.registrationForm.value.accountNumber} already exists. Please check your records.`;
    }
    else if (lowerErrorMessage.includes('duplicate stub') ||
             (lowerErrorMessage.includes('stub') && (lowerErrorMessage.includes('duplicate') || lowerErrorMessage.includes('already exists') || lowerErrorMessage.includes('exist')))) {
      title = 'Duplicate Stub Number';
      message = `Stub number ${this.registrationForm.value.stubNumber} is already registered. Please use a different stub number.`;
    }
    else if (lowerErrorMessage.includes('not found') ||
             lowerErrorMessage.includes('invalid account')) {
      title = 'Invalid Account';
      message = `Account number ${this.registrationForm.value.accountNumber} was not found in the system. Please verify the account number.`;
    }
    else if (lowerErrorMessage.includes('validation') ||
             lowerErrorMessage.includes('invalid format')) {
      title = 'Invalid Input Format';
      message = 'Please check that your stub number is 5 digits and account number is 10 digits.';
    }
    else {
      // If we have a specific error message but it doesn't match our patterns
      message = errorMessage;
    }
  }

  // Handle HTTP status codes
  else if (error.status) {
    switch (error.status) {
      case 400:
        title = 'Invalid Request';
        message = 'The registration data provided is invalid. Please check your inputs.';
        break;
      case 409:
        title = 'Registration Conflict';
        message = 'This account or stub number is already registered.';
        break;
      case 500:
        title = 'Server Error';
        message = 'There was a server error. Please try again later.';
        break;
      default:
        title = 'Connection Error';
        message = 'Unable to connect to the server. Please check your internet connection.';
    }
  }

  console.log('Error handling - Title:', title, 'Message:', message); // Debug log
  this.sweetAlert.showError(title, message);
}
  async presentSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Success',
      message: 'Registration completed successfully!',
      buttons: ['OK']
    });
    await alert.present();
  }

  clearForm() {
    this.registrationForm.reset();
  }

  getPageNumbers(): number[] {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  const half = Math.floor(maxVisiblePages / 2);

  let start = Math.max(1, this.currentPage - half);
  let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (end - start < maxVisiblePages - 1) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
}

// async loadRegisteredConsumers() {
//   this.isLoading = true;

//   this.http.get(`${environment.apiUrl}/registration/all?limit=30&offset=0`).subscribe({
//     next: (data) => {
//       this.registeredConsumers = data as any[];
//       this.filteredRegistrants = [...this.registeredConsumers];
//       this.isLoading = false;
//     },
//     error: (err) => {
//       console.error('Failed to load registered consumers', err);
//       this.isLoading = false;
//       this.sweetAlert.showError(
//     'Loading Failed',
//     'Unable to load registered consumers. Please refresh the page.'
//   );

//     }
//   });
// }

async loadRegisteredConsumers(page: number = 1, resetList: boolean = true) {
  // Don't show loading for subsequent pages to prevent flickering
  if (resetList) {
    this.isLoading = true;
  }

  const offset = (page - 1) * this.pageSize;

  let queryParams = `limit=${this.pageSize}&offset=${offset}`;

  if (this.searchFilter && this.searchFilter.trim()) {
    queryParams += `&filterType=${this.filterType}&filterValue=${encodeURIComponent(this.searchFilter.trim())}`;
  }

  this.http.get(`${environment.apiUrl}/registration/all?${queryParams}`).subscribe({
    next: (response: any) => {
      // Smooth transition without layout shift
      if (resetList) {
        this.registeredConsumers = response.registrants;
      } else {
        this.registeredConsumers = [...this.registeredConsumers, ...response.registrants];
      }

      this.filteredRegistrants = [...this.registeredConsumers];
      this.totalRecords = response.total;
      this.totalPages = response.totalPages;
      this.currentPage = response.page;
      this.hasMore = response.hasMore;

      // Always set loading to false
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load registered consumers', err);
      this.isLoading = false;

      this.sweetAlert.showError(
        'Loading Failed',
        'Unable to load registered consumers. Please refresh the page.'
      );
    }
  });
}

//   filterRegistrants() {
//     if (!this.searchFilter.trim()) {
//       this.filteredRegistrants = [...this.registeredConsumers];
//       return;
//     }

//     const filter = this.searchFilter.toLowerCase();
// this.filteredRegistrants = this.registeredConsumers.filter(registrant => {
//   switch (this.filterType) {
//     case 'stubNumber':
//       return registrant.stubNumber?.toString().startsWith(filter);
//     case 'accountNumber':
//       return registrant.accountNumber?.toLowerCase().startsWith(filter);
//     case 'consumerName':
//       return registrant.consumerName?.toLowerCase().startsWith(filter);
//     default:
//       return false;
//   }
// });
//   }
filterRegistrants() {
  // Clear previous timeout
  if (this.searchTimeout) {
    clearTimeout(this.searchTimeout);
  }

  // Debounce search to avoid too many API calls
  this.searchTimeout = setTimeout(() => {
    this.currentPage = 1; // Reset to first page for new search
    this.loadRegisteredConsumers(1, true); // Load with filter
  }, 500); // Wait 500ms after user stops typing
}

// Clear search and reload all data
clearSearch() {
  this.searchFilter = '';
  this.currentPage = 1;
  this.loadRegisteredConsumers(1, true);
}

// Load next page
nextPage() {
  if (this.hasMore && !this.isLoading) {
    this.loadRegisteredConsumers(this.currentPage + 1, true);
  }
}

// Load previous page
previousPage() {
  if (this.currentPage > 1 && !this.isLoading) {
    this.loadRegisteredConsumers(this.currentPage - 1, true);
  }
}

// Go to specific page
goToPage(page: number) {
  if (page >= 1 && page <= this.totalPages && page !== this.currentPage && !this.isLoading) {
    this.loadRegisteredConsumers(page, true);
  }
}

// Load more records (append to current list)
loadMore() {
  if (this.hasMore && !this.isLoading) {
    this.loadRegisteredConsumers(this.currentPage + 1, false);
  }
}

// Change page size
changePageSize(newSize: number) {
  this.pageSize = newSize;
  this.currentPage = 1;
  this.loadRegisteredConsumers(1, true);
}

  trackByRegistrant(index: number, registrant: any): any {
    return registrant.id || index;
  }

async deleteRegistrant(accountNumber: string) {
  const result = await this.sweetAlert.showConfirmation(
    'Delete Registrant',
    `Are you sure you want to delete account ${accountNumber}?`
  );

  if (result.isConfirmed) {
    this.performDelete(accountNumber);
  }
}
performDelete(accountNumber: string) {
  this.http.delete(`${environment.apiUrl}/registration/${accountNumber}`, { responseType: 'text' }).subscribe({
    next: (response) => {
      this.sweetAlert.showSuccess(
        'Deleted!',
        'Registrant has been deleted successfully.'
      );
      this.loadRegisteredConsumers();
    },
    error: (err) => {
      console.error('Delete failed', err);
      this.sweetAlert.showError(
        'Delete Failed',
        'Unable to delete registrant. Please try again.'
      );
    }
  });
}
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

    // Add these computed properties
  get displayStart(): number {
    return ((this.currentPage - 1) * this.pageSize) + 1;
  }

  get displayEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  get displayText(): string {
    if (this.totalRecords === 0) return 'No registrants found';
    return `Showing ${this.displayStart} to ${this.displayEnd} of ${this.totalRecords} registrants`;
  }
}
