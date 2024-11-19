import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerAssignedComponent } from './container-assigned.component';

describe('ContainerAssignedComponent', () => {
  let component: ContainerAssignedComponent;
  let fixture: ComponentFixture<ContainerAssignedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContainerAssignedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContainerAssignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
