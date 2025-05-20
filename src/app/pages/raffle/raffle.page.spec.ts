import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RafflePage } from './raffle.page';

describe('RafflePage', () => {
  let component: RafflePage;
  let fixture: ComponentFixture<RafflePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RafflePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
