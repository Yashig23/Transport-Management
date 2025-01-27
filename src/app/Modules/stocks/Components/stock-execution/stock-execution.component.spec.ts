import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockExecutionComponent } from './stock-execution.component';

describe('StockExecutionComponent', () => {
  let component: StockExecutionComponent;
  let fixture: ComponentFixture<StockExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockExecutionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
