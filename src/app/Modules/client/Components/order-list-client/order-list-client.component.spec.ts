import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderListClientComponent } from './order-list-client.component';

describe('OrderListClientComponent', () => {
  let component: OrderListClientComponent;
  let fixture: ComponentFixture<OrderListClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderListClientComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OrderListClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
