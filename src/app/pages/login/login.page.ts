import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { AuthService } from 'src/app/auth.service';
import { NetworkSelectionService } from 'src/app/services/network-selection.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  selectedNetwork = 'lan';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private networkService: NetworkSelectionService,
    private actionSheetController: ActionSheetController
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }

    this.selectedNetwork = this.networkService.getCurrentNetworkType();
  }

  async toggleNetworkMenu(event: Event) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Network Connection',
      cssClass: 'network-action-sheet',
      buttons: [
        {
          text: '🌐 LAN Network (Fast)',
          icon: 'wifi',
          cssClass: this.selectedNetwork === 'lan' ? 'selected-option' : '',
          handler: () => {
            this.selectNetwork('lan');
          }
        },
        {
          text: '🔗 VPN/Internet Connection',
          icon: 'globe-outline',
          cssClass: this.selectedNetwork === 'vpn' ? 'selected-option' : '',
          handler: () => {
            this.selectNetwork('vpn');
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  selectNetwork(network: 'lan' | 'vpn') {
    this.selectedNetwork = network;
    this.networkService.setNetwork(network);
    console.log(`Network switched to: ${network.toUpperCase()}`);
  }

  getNetworkIcon(): string {
    return this.selectedNetwork === 'lan' ? 'LAN' : 'VPN';
  }

  getNetworkLabel(): string {
    return this.selectedNetwork === 'lan' ? 'LAN' : 'VPN';
  }

  login() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Login failed', error);
          this.errorMessage = 'Invalid username or password';
        },
      });
    }
  }
}
