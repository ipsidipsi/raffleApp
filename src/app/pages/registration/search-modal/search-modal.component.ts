import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IonHeader, IonLabel } from "@ionic/angular/standalone";

@Component({
  standalone:false,
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],

})
export class SearchModalComponent implements OnInit {
  searchTerm = new FormControl('');
  searchType: string = 'accountNumber';
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

    // Construct the URL with query parameters
    let apiUrl = `${environment.apiUrl}/registration/searchAccountMaster?field=${this.searchType}&term=${term}`;

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
}
