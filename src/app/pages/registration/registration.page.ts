import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LoadingController, ModalController, ToastController, AlertController } from '@ionic/angular';
import { SearchModalComponent } from './search-modal/search-modal.component';

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastController: ToastController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    this.registrationForm = this.fb.group({
      stubNumber: ['', [Validators.required, Validators.pattern(/^\d$/)]],
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
    let value = event.target.value.replace(/[^0-9]/g, '').slice(0, 5);
    this.registrationForm.patchValue({ stubNumber: value });
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
      await this.presentToast('Please fill in all required fields', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Processing registration...',
      spinner: 'circles'
    });

    await loading.present();

    const registrationData = {
      accountNumber: this.registrationForm.value.accountNumber,
      stubNumber: this.registrationForm.value.stubNumber
    };

    this.http.post(`${environment.apiUrl}/registration/`, registrationData).subscribe({
      next: async (response) => {
        loading.dismiss();
        await this.presentSuccessAlert();
        this.clearForm();
        this.loadRegisteredConsumers();
      },
      error: async (err) => {
        loading.dismiss();
        console.error('Registration failed', err);
        await this.presentToast('Registration failed. Please try again.', 'danger');
      }
    });
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

  async loadRegisteredConsumers() {
    this.isLoading = true;

    this.http.get(`${environment.apiUrl}/registration/all`).subscribe({
      next: (data) => {
        this.registeredConsumers = data as any[];
        this.filteredRegistrants = [...this.registeredConsumers];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load registered consumers', err);
        this.presentToast('Failed to load consumers', 'danger');
        this.isLoading = false;
      }
    });
  }

  filterRegistrants() {
    if (!this.searchFilter.trim()) {
      this.filteredRegistrants = [...this.registeredConsumers];
      return;
    }

    const filter = this.searchFilter.toLowerCase();
    this.filteredRegistrants = this.registeredConsumers.filter(registrant => {
      switch (this.filterType) {
        case 'stubNumber':
          return registrant.stubNumber?.toString().includes(filter);
        case 'accountNumber':
          return registrant.accountNumber?.toLowerCase().includes(filter);
        case 'consumerName':
          return registrant.consumerName?.toLowerCase().includes(filter);
        default:
          return false;
      }
    });
  }

  trackByRegistrant(index: number, registrant: any): any {
    return registrant.id || index;
  }

  async deleteRegistrant(accountNumber: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this registrant?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.performDelete(accountNumber);
          }
        }
      ]
    });
    await alert.present();
  }

  performDelete(accountNumber: string) {
  this.http.delete(`${environment.apiUrl}/registration/${accountNumber}`, { responseType: 'text' }).subscribe({
    next: (response) => {
      console.log('Delete response:', response); // Will show the text message
      this.presentToast('Registrant deleted successfully', 'success');
      this.loadRegisteredConsumers();
    },
    error: (err) => {
      console.error('Delete failed', err);
      this.presentToast('Failed to delete registrant', 'danger');
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
}
