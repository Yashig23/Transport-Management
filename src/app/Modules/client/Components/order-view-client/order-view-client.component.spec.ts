import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderViewClientComponent } from './order-view-client.component';

describe('OrderViewClientComponent', () => {
  let component: OrderViewClientComponent;
  let fixture: ComponentFixture<OrderViewClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderViewClientComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrderViewClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
