import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  standalone: false, // Changed from true to false
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],
})
export class SearchModalComponent implements OnInit {
  @Input() searchType: string = 'accountNumber';
  
  searchTerm = new FormControl('');
  consumers: any[] = [];
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    // Setup debounced search
    this.searchTerm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value && value.length >= 2) {
          this.searchConsumers();
        } else {
          this.consumers = [];
        }
      });
  }

  dismissModal(data?: any) {
    this.modalController.dismiss(data);
  }

  searchConsumers() {
    const term = this.searchTerm.value?.trim();

    if (!term || term.length < 2) {
      this.consumers = [];
      return;
    }

    this.isLoading = true;

    const apiUrl = `${environment.apiUrl}/registration/searchAccountMaster?field=${this.searchType}&term=${term}`;

    this.http.get(apiUrl).subscribe({
      next: (data) => {
        this.consumers = data as any[];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.consumers = [];
        this.isLoading = false;
      },
    });
  }

  selectConsumer(consumer: any) {
    this.dismissModal({ selectedConsumer: consumer });
  }

  clearSearch() {
    this.searchTerm.setValue('');
    this.consumers = [];
  }

  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'accountNumber':
        return 'Enter account number...';
      case 'consumerName':
        return 'Enter consumer name...';
      default:
        return 'Enter search term...';
    }
  }

  getModalTitle(): string {
    switch (this.searchType) {
      case 'accountNumber':
        return 'Search by Account Number';
      case 'consumerName':
        return 'Search by Consumer Name';
      default:
        return 'Search Consumers';
    }
  }
}