import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedOrderComponent } from './shared-order.component';

describe('SharedOrderComponent', () => {
  let component: SharedOrderComponent;
  let fixture: ComponentFixture<SharedOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SharedOrderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharedOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
