import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalController, LoadingController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { IonHeader, IonInput, IonButton } from "@ionic/angular/standalone";

@Component({
  standalone: false,
  selector: 'app-registration-modal',
  templateUrl: './registration-modal.component.html',
  styleUrls: ['./registration-modal.component.scss'],
})
export class RegistrationModalComponent implements OnInit {
  registrationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private modalController: ModalController,
    private loadingController: LoadingController
  ) {
    this.registrationForm = this.fb.group({
      accountNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
      consumerName: ['', [Validators.required, Validators.minLength(2)]],
      consumerAddress: ['', Validators.required],
      meterNumber: ['', [Validators.required, Validators.pattern(/^M[0-9]+$/)]],
    });
  }

  ngOnInit() {}

  dismissModal(data?: any) {
    this.modalController.dismiss(data);
  }

  async register() {
    if (this.registrationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registrationForm.controls).forEach(key => {
        const control = this.registrationForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registering consumer...',
      spinner: 'circles'
    });

    await loading.present();

    this.http.post(`${environment.apiUrl}/registration`, this.registrationForm.value).subscribe({
      next: () => {
        loading.dismiss();
        this.dismissModal({ registered: true });
      },
      error: (err) => {
        console.error('Registration failed', err);
        loading.dismiss();
        this.dismissModal({ error: 'Registration failed' });
      },
    });
  }

  // Helper method to check if a field is invalid and touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return field !== null && field.invalid && (field.dirty || field.touched);
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);

    if (!field) return '';

    if (field.errors?.['required']) {
      return 'This field is required';
    }

    if (field.errors?.['pattern']) {
      if (fieldName === 'accountNumber') {
        return 'Account number must contain only uppercase letters and numbers';
      }
      if (fieldName === 'meterNumber') {
        return 'Meter number must start with M followed by numbers';
      }
    }

    if (field.errors?.['minlength']) {
      return `Minimum length is ${field.errors?.['minlength'].requiredLength} characters`;
    }

    return 'Invalid input';
  }
}
