// src/app/pages/raffle/raffle.page.ts - Updated with Animations
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { RaffleService, AreaInfo, Winner, DrawRequest } from '../../services/raffle.service';

@Component({
  standalone: false,
  selector: 'app-raffle',
  templateUrl: './raffle.page.html',
  styleUrls: ['./raffle.page.scss'],
  animations: [
    // Slide animation for winner cards
    {
      name: 'slideAnimation',
      trigger: 'slideAnimation',
      states: [
        { name: 'pending_validation', styles: { transform: 'translateX(0)', opacity: '1' } },
        { name: 'valid_winner', styles: { transform: 'translateX(30px)', opacity: '0.8' } },
        { name: 'invalid_winner', styles: { transform: 'translateX(-30px)', opacity: '0.8' } }
      ],
      transitions: [
        { from: 'pending_validation', to: 'valid_winner', duration: '0.5s ease-out' },
        { from: 'pending_validation', to: 'invalid_winner', duration: '0.5s ease-out' }
      ]
    }
  ]
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
  
  // Store original winner data for refresh recovery
  private originalWinners: Winner[] = [];

  constructor(
    private fb: FormBuilder,
    private raffleService: RaffleService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.raffleForm = this.fb.group({
      prizeName: ['', Validators.required],
      numberOfWinners: [1, [Validators.required, Validators.min(1)]],
      selectedAreas: [[]]
    });
  }

  ngOnInit() {
    this.loadAvailableAreas();
    this.setupFormValueChanges();
    this.checkForUnfinishedDraw();
  }

  // Check for unfinished draw on page load/refresh
  private checkForUnfinishedDraw() {
    const savedDrawData = localStorage.getItem('currentDraw');
    if (savedDrawData) {
      try {
        const drawData = JSON.parse(savedDrawData);
        this.winners = drawData.winners || [];
        this.currentDrawGuid = drawData.drawGuid || '';
        this.originalWinners = [...this.winners];
        
        if (this.hasPendingWinners()) {
          this.presentToast('Restored unfinished draw. Please confirm all winners.', 'warning');
        }
      } catch (error) {
        console.error('Error restoring draw data:', error);
        localStorage.removeItem('currentDraw');
      }
    }
  }

  // Save current draw state to localStorage
  private saveDrawState() {
    if (this.winners.length > 0) {
      const drawData = {
        winners: this.winners,
        drawGuid: this.currentDrawGuid,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('currentDraw', JSON.stringify(drawData));
    }
  }

  // Clear saved draw state
  private clearDrawState() {
    localStorage.removeItem('currentDraw');
  }

  private setupFormValueChanges() {
    this.raffleForm.get('selectedAreas')?.valueChanges.subscribe(value => {
      this.selectedAreas = value || [];
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

  updateEligibleCount() {
    const formAreas = this.raffleForm.get('selectedAreas')?.value || [];
    this.selectedAreas = formAreas;
    
    if (formAreas.length === 0) {
      this.eligibleCount = 0;
      return;
    }

    this.raffleService.getEligibleCount(formAreas).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          this.eligibleCount = response.data.reduce((total, area) => total + area.EligibleCount, 0);
        } else {
          this.eligibleCount = 0;
        }
      },
      error: (error) => {
        console.error('Failed to get eligible count:', error);
        this.eligibleCount = 0;
      }
    });
  }

  async executeDraw() {
    if (this.raffleForm.invalid) {
      this.presentToast('Please fill all required fields', 'warning');
      return;
    }

    if (this.hasPendingWinners()) {
      this.presentToast('Please confirm all current winners before starting a new draw', 'warning');
      return;
    }

    const formValue = this.raffleForm.value;
    
    if (formValue.numberOfWinners > this.eligibleCount) {
      this.presentToast(`Only ${this.eligibleCount} eligible registrants available`, 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirm Draw',
      message: `Draw ${formValue.numberOfWinners} winner(s) for "${formValue.prizeName}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Draw', handler: () => this.performDraw() }
      ]
    });

    await alert.present();
  }

  async performDraw() {
    this.isDrawing = true;
    this.startDrawingAnimation();

    const drawRequest: DrawRequest = {
      prizeName: this.raffleForm.value.prizeName,
      numberOfWinners: this.raffleForm.value.numberOfWinners,
      areaCodes: this.selectedAreas,
      createdBy: 'admin'
    };

    // Animation duration
    setTimeout(() => {
      this.raffleService.executeDraw(drawRequest).subscribe({
        next: (response) => {
          this.stopDrawingAnimation();
          this.isDrawing = false;
          
          if (response.success) {
            this.winners = response.data.winners.map(winner => ({
              ...winner,
              animating: false
            }));
            this.originalWinners = [...this.winners];
            this.currentDrawGuid = response.data.drawGuid;
            this.saveDrawState(); // Save state for refresh recovery
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
    }, 150);
  }

  stopDrawingAnimation() {
    this.drawingAnimation = false;
    this.animationNumbers = [];
  }

  async confirmWinner(winner: Winner, status: 'valid_winner' | 'invalid_winner') {
    // Set animation flag
    winner.animating = true;
    
    const loading = await this.loadingController.create({
      message: status === 'valid_winner' ? 'Confirming winner...' : 'Rejecting winner...',
    });
    await loading.present();

    this.raffleService.confirmWinner(winner.id, status).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.success) {
          // Update winner status with animation
          const winnerIndex = this.winners.findIndex(w => w.id === winner.id);
          if (winnerIndex > -1) {
            this.winners[winnerIndex].status = status;
            this.winners[winnerIndex].animating = false;
            
            // Slide fade animation
            setTimeout(() => {
              this.winners[winnerIndex].animating = false;
            }, 500);
          }
          
          // Save updated state
          this.saveDrawState();
          
          const message = status === 'valid_winner' ? 'Winner confirmed!' : 'Winner rejected!';
          this.presentToast(message, status === 'valid_winner' ? 'success' : 'warning');
          
          // Check if all winners are confirmed
          if (!this.hasPendingWinners()) {
            this.clearDrawState(); // Clear saved state when all confirmed
            this.presentToast('All winners processed! You can now start a new draw.', 'success');
          }
        }
      },
      error: (error) => {
        loading.dismiss();
        winner.animating = false;
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
      message: `${status === 'valid_winner' ? 'Confirm' : 'Reject'} ALL winners in this draw?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: status === 'valid_winner' ? 'Confirm All' : 'Reject All',
          handler: () => this.performBulkConfirm(status)
        }
      ]
    });

    await alert.present();
  }

  async performBulkConfirm(status: 'valid_winner' | 'invalid_winner') {
    const loading = await this.loadingController.create({
      message: status === 'valid_winner' ? 'Confirming all winners...' : 'Rejecting all winners...',
    });
    await loading.present();

    // Animate all pending winners
    this.winners.forEach(winner => {
      if (winner.status === 'pending_validation') {
        winner.animating = true;
      }
    });

    this.raffleService.bulkConfirmDraw(this.currentDrawGuid, status).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.success) {
          // Update all winner statuses
          this.winners.forEach(winner => {
            if (winner.status === 'pending_validation') {
              winner.status = status;
              winner.animating = false;
            }
          });
          
          this.clearDrawState(); // Clear saved state after bulk action
          
          const message = status === 'valid_winner' ? 'All winners confirmed!' : 'All winners rejected!';
          this.presentToast(message, status === 'valid_winner' ? 'success' : 'warning');
        }
      },
      error: (error) => {
        loading.dismiss();
        // Reset animation flags on error
        this.winners.forEach(winner => {
          winner.animating = false;
        });
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
    this.originalWinners = [];
    this.clearDrawState();
    this.resetForm();
  }

  // Helper methods for template
  hasPendingWinners(): boolean {
    return this.winners.some(w => w.status === 'pending_validation');
  }

  hasWinners(): boolean {
    return this.winners && this.winners.length > 0;
  }

  isPendingValidation(status: string): boolean {
    return status === 'pending_validation';
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
      case 'invalid_winner': return 'Rejected';
      case 'pending_validation': return 'Pending';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'valid_winner': return 'confirmed';
      case 'invalid_winner': return 'rejected';
      case 'pending_validation': return 'pending';
      default: return 'pending';
    }
  }

  // Track by function for ngFor optimization
  trackByWinnerId(index: number, winner: Winner): number {
    return winner.id;
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

  // Method to handle page visibility change (detect refresh/navigation)
  ngOnDestroy() {
    // Save state before component is destroyed
    if (this.hasPendingWinners()) {
      this.saveDrawState();
    }
  }
}