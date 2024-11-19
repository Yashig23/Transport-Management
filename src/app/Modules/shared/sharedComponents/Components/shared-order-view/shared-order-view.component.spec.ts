import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedOrderViewComponent } from './shared-order-view.component';

describe('SharedOrderViewComponent', () => {
  let component: SharedOrderViewComponent;
  let fixture: ComponentFixture<SharedOrderViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SharedOrderViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharedOrderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
