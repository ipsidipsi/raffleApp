import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { RegistrationModalComponent } from './registration-modal/registration-modal.component';
import { SearchModalComponent } from './search-modal/search-modal.component';

@Component({
  standalone:false,
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {
  registrationForm: FormGroup;
  consumers: any[] = [];
  searchTerm: string = '';
  selectedConsumer: any = null; // Property to hold the selected consumer
  searchType: string = 'accountNumber'; // Add property for selected
  registeredConsumers: any[] = []; // Property to hold the list of registered consumers
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController,
  ) {
    this.registrationForm = this.fb.group({
      accountNumber: ['', Validators.required],
      consumerName: ['', Validators.required], // Add consumerName control
      consumerAddress: ['', Validators.required], // Add address control
      meterNumber: ['', Validators.required], // Add meterNumber// Add more form controls as needed
    });
  }
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    toast.present();
  }

  async openRegistrationModal() {
    const modal = await this.modalController.create({
      component: RegistrationModalComponent,
      cssClass: 'registration-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.registered) {
      this.presentToast('Consumer registered successfully!');
      this.loadRegisteredConsumers();
    }
  }

  async openSearchModal() {
    const modal = await this.modalController.create({
      component: SearchModalComponent,
      cssClass: 'search-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedConsumer) {
      // If you want to do anything with the selected consumer
      // For example, highlight it in the table
      console.log('Selected consumer:', data.selectedConsumer);
    }
  }
  oldregister() {
    if (this.registrationForm.valid) {
      this.http.post(`${environment.apiUrl}/registration`, this.registrationForm.value).subscribe({
        next: () => {
          console.log('Registration successful');
           // Optionally navigate to another page or display a success message
           this.loadRegisteredConsumers(); // reload the list
           this.presentToast('Customer registered successfully!');
           this.clearForm(); // optional: clear the form
        },
        error: (err) => {
          console.error('Registration failed', err);
        },
      });
    }
  }

  // searchConsumers() {
  //   this.http.get(`${environment.apiUrl}/registration/searchAccountMaster?term=${this.searchTerm}`).subscribe({
  //     next: (data) => {
  //       this.consumers = data as any[];
  //     },
  //     error: (err) => {
  //       console.error('Search failed', err);
  //     },
  //   });
  // }

  searchConsumers() {
    // Use 'field' and 'term' query parameters as per the sample API
    let apiUrl = `${environment.apiUrl}/registration/searchAccountMaster`;
    // Ensure searchTerm is not empty before making the call
    if (this.searchTerm.trim() === '') {
      this.consumers = []; // Clear previous results if search term is empty
      return;
    }

    // Construct the URL with 'field' and 'term' parameters
    apiUrl += `?field=${this.searchType}&term=${this.searchTerm}`;

    this.http.get(apiUrl).subscribe({
      next: (data) => {
        this.consumers = data as any[];
      },
      error: (err) => {
        console.error('Search failed', err);
        this.consumers = []; // Clear results on error
      },
    });
  }


// Method to select a consumer from the search results
selectConsumer(consumer: any) {
  this.selectedConsumer = consumer;
  // Populate the form with selected consumer data
  this.registrationForm.patchValue({
    accountNumber: consumer.accountNumber, // Assuming your consumer object has these properties
    consumerName: consumer.consumerName,
    consumerAddress: consumer.consumerAddress,
    meterNumber: consumer.meterNumber,
  });
  this.consumers = []; // Clear search results after selection
  this.searchTerm = ''; // Clear search term
}
 // Method to clear the form and reset state
 clearForm() {
  this.registrationForm.reset(); // Reset the form controls
  this.selectedConsumer = null; // Clear the selected consumer
  this.consumers = []; // Clear search results
  this.searchTerm = ''; // Clear search term
}

async loadRegisteredConsumers() {
  const loading = await this.loadingController.create({
    message: 'Loading ...',
    spinner: 'circles'
  });

  await loading.present();

  this.http.get(`${environment.apiUrl}/registration/all`).subscribe({
    next: (data) => {
      this.registeredConsumers = data as any[];
      loading.dismiss();
    },
    error: (err) => {
      console.error('Failed to load registered consumers', err);
      this.presentToast('Failed to load consumers', 'danger');
      loading.dismiss();
    }
  });
}

ngOnInit() {
  this.loadRegisteredConsumers();
}

}
