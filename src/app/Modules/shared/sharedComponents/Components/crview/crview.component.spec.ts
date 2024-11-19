import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CRViewComponent } from './crview.component';

describe('CRViewComponent', () => {
  let component: CRViewComponent;
  let fixture: ComponentFixture<CRViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CRViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CRViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
