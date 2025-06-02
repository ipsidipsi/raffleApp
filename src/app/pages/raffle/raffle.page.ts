import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { RaffleService, AreaInfo, Winner, DrawRequest } from '../../services/raffle.service';

@Component({
  standalone: false,
  selector: 'app-raffle',
  templateUrl: './raffle.page.html',
  styleUrls: ['./raffle.page.scss'],
})
export class RafflePage implements OnInit {
  raffleForm: FormGroup;
  availableAreas: AreaInfo[] = [];
  selectedAreas: string[] = [];
  winners: Winner[] = [];
  currentDrawGuid: string = '';
  isDrawing: boolean = false;
  eligibleCount: number = 0;

  // Animation states
  drawingAnimation: boolean = false;
  animationNumbers: string[] = [];

  constructor(
    private fb: FormBuilder,
    private raffleService: RaffleService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.raffleForm = this.fb.group({
      prizeName: ['', [Validators.required, Validators.minLength(2)]],
      numberOfWinners: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      //selectedAreas: [[], Validators.required]
       selectedAreas: [[]] ,
    });
  }
  arrayNotEmptyValidator(control: any) {
  const value = control.value;
  if (!value || value.length === 0) {
    return { required: true };
  }
  return null;
}
  ngOnInit() {
    this.loadAvailableAreas();
    console.log('Form initialized:', this.raffleForm.value);
  console.log('Form valid:', this.raffleForm.valid);
  // Watch for changes to selectedAreas form control
  this.raffleForm.get('selectedAreas')?.valueChanges.subscribe(value => {
    console.log('Form control selectedAreas changed to:', value);
    this.selectedAreas = value || [];
    console.log('Updated this.selectedAreas to:', this.selectedAreas);
    this.updateEligibleCount();
  });

  }

  async loadAvailableAreas() {
    const loading = await this.loadingController.create({
      message: 'Loading areas...',
    });
    await loading.present();

    this.raffleService.getAvailableAreas().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableAreas = response.data;
        }
        loading.dismiss();
      },
      error: (error) => {
        console.error('Failed to load areas:', error);
        this.presentToast('Failed to load areas', 'danger');
        loading.dismiss();
      }
    });
  }

onAreaSelectionChange(event: any) {
  console.log('onAreaSelectionChange called with:', event.detail.value);
  this.selectedAreas = event.detail.value || [];
  console.log('Selected areas updated to:', this.selectedAreas);
  this.updateEligibleCount();
}
updateEligibleCount() {
  const formAreas = this.raffleForm.get('selectedAreas')?.value || [];
  this.selectedAreas = formAreas;

  console.log('=== ELIGIBLE COUNT DEBUG ===');
  console.log('Form areas:', formAreas);
  console.log('Area codes being sent to API:', formAreas);

  if (formAreas.length === 0) {
    this.eligibleCount = 0;
    console.log('No areas selected, eligible count set to 0');
    return;
  }

  console.log('Making API call to getEligibleCount with:', formAreas);

  this.raffleService.getEligibleCount(formAreas).subscribe({
    next: (response) => {
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Full response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      console.log('Response data length:', response.data?.length);
      console.log('Response message:', response.message);

      if (response.success && response.data && response.data.length > 0) {
        console.log('Processing response data...');
        response.data.forEach((area, index) => {
          console.log(`Area ${index}:`, area);
          console.log(`- EligibleCount: ${area.EligibleCount}`);
        });

        this.eligibleCount = response.data.reduce((total, area) => total + area.EligibleCount, 0);
        console.log('Final eligible count calculated:', this.eligibleCount);
      } else {
        this.eligibleCount = 0;
        console.log('Setting eligible count to 0 because:');
        console.log('- Success:', response.success);
        console.log('- Data exists:', !!response.data);
        console.log('- Data length:', response.data?.length);
      }
    },
    error: (error) => {
      console.error('=== API ERROR ===');
      console.error('Full error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      this.eligibleCount = 0;
    }
  });
}
  async executeDraw() {
    if (this.raffleForm.invalid) {
      this.presentToast('Please fill all required fields', 'warning');
      return;
    }

    const formValue = this.raffleForm.value;

    if (formValue.numberOfWinners > this.eligibleCount) {
      this.presentToast(`Only ${this.eligibleCount} eligible registrants available`, 'warning');
      return;
    }

    // Show confirmation alert
    const alert = await this.alertController.create({
      header: 'Confirm Draw',
      message: `Are you sure you want to draw ${formValue.numberOfWinners} winner(s) for "${formValue.prizeName}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Draw',
          handler: () => {
            this.performDraw();
          }
        }
      ]
    });

    await alert.present();
  }
  private disableForm() {
  this.raffleForm.get('prizeName')?.disable();
  this.raffleForm.get('numberOfWinners')?.disable();
  this.raffleForm.get('selectedAreas')?.disable();
}

private enableForm() {
  this.raffleForm.get('prizeName')?.enable();
  this.raffleForm.get('numberOfWinners')?.enable();
  this.raffleForm.get('selectedAreas')?.enable();
}


  async performDraw() {
    this.isDrawing = true;
    this.startDrawingAnimation();
    this.disableForm();
    const drawRequest: DrawRequest = {
      prizeName: this.raffleForm.value.prizeName,
      numberOfWinners: this.raffleForm.value.numberOfWinners,
      areaCodes: this.selectedAreas,
      createdBy: 'admin' // Get from auth service
    };

    // Simulate drawing animation for 3 seconds
    setTimeout(() => {
      this.raffleService.executeDraw(drawRequest).subscribe({
        next: (response) => {
          this.stopDrawingAnimation();
          this.isDrawing = false;

          if (response.success) {
            this.winners = response.data.winners;
            this.currentDrawGuid = response.data.drawGuid;
            this.presentToast(`Successfully selected ${response.data.totalWinners} winner(s)!`, 'success');
            this.resetForm();
          } else {
            this.presentToast(response.message, 'danger');
          }
        },
        error: (error) => {
          this.stopDrawingAnimation();
          this.isDrawing = false;
          console.error('Draw failed:', error);
          this.presentToast('Draw failed: ' + error.message, 'danger');
        }
      });
    }, 3000);
  }

  startDrawingAnimation() {
    this.drawingAnimation = true;
    this.animationNumbers = [];

    const interval = setInterval(() => {
      if (!this.drawingAnimation) {
        clearInterval(interval);
        return;
      }

      // Generate random account numbers for animation
      const randomNumbers = [];
      for (let i = 0; i < 3; i++) {
        randomNumbers.push((Math.random() * 9999999999).toFixed(0).padStart(10, '0'));
      }
      this.animationNumbers = randomNumbers;
    }, 100);
  }

  stopDrawingAnimation() {
    this.drawingAnimation = false;
    this.animationNumbers = [];
  }

  async confirmWinner(winner: Winner, status: 'valid_winner' | 'invalid_winner') {
    const loading = await this.loadingController.create({
      message: status === 'valid_winner' ? 'Confirming winner...' : 'Disqualifying winner...',
    });
    await loading.present();

    this.raffleService.confirmWinner(winner.id, status).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.success) {
          // Update local winner status
          const winnerIndex = this.winners.findIndex(w => w.id === winner.id);
          if (winnerIndex > -1) {
            this.winners[winnerIndex].status = status;
          }

          const message = status === 'valid_winner' ? 'Winner confirmed!' : 'Winner disqualified!';
          this.presentToast(message, 'success');
        }
      },
      error: (error) => {
        loading.dismiss();
        console.error('Failed to confirm winner:', error);
        this.presentToast('Failed to update winner status', 'danger');
      }
    });
  }

  async bulkConfirm(status: 'valid_winner' | 'invalid_winner') {
    if (!this.currentDrawGuid) {
      this.presentToast('No active draw to confirm', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Bulk Confirmation',
      message: `Are you sure you want to ${status === 'valid_winner' ? 'confirm' : 'disqualify'} ALL winners in this draw?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: status === 'valid_winner' ? 'Confirm All' : 'Disqualify All',
          handler: () => {
            this.performBulkConfirm(status);
          }
        }
      ]
    });

    await alert.present();
  }

  async performBulkConfirm(status: 'valid_winner' | 'invalid_winner') {
    const loading = await this.loadingController.create({
      message: status === 'valid_winner' ? 'Confirming all winners...' : 'Disqualifying all winners...',
    });
    await loading.present();

    this.raffleService.bulkConfirmDraw(this.currentDrawGuid, status).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.success) {
          // Update all local winner statuses
          this.winners.forEach(winner => {
            if (winner.status === 'pending_validation') {
              winner.status = status;
            }
          });

          const message = status === 'valid_winner' ? 'All winners confirmed!' : 'All winners disqualified!';
          this.presentToast(message, 'success');
        }
      },
      error: (error) => {
        loading.dismiss();
        console.error('Failed to bulk confirm:', error);
        this.presentToast('Failed to update winners', 'danger');
      }
    });
  }

  resetForm() {
    this.raffleForm.patchValue({
      prizeName: '',
      numberOfWinners: 1,
      selectedAreas: []
    });
    this.selectedAreas = [];
    this.eligibleCount = 0;
  }

  newDraw() {
    this.winners = [];
    this.currentDrawGuid = '';
    this.resetForm();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'valid_winner': return 'success';
      case 'invalid_winner': return 'danger';
      case 'pending_validation': return 'warning';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'valid_winner': return 'Confirmed';
      case 'invalid_winner': return 'Disqualified';
      case 'pending_validation': return 'Pending';
      default: return status;
    }
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
  hasPendingWinners(): boolean {
  return this.winners.some(w => w.status === 'pending_validation');
}

hasWinners(): boolean {
  return this.winners && this.winners.length > 0;
}

isPendingValidation(status: string): boolean {
  return status === 'pending_validation';
}
}

// ============================================
