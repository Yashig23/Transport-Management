import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SupplierDialogService } from '../Services/supplier-dialog-service';
import { Supplier, SupplierFormType } from '../../Constants/constants';

@Component({
  selector: 'app-container-assigned',
  templateUrl: './container-assigned.component.html',
  styleUrl: './container-assigned.component.scss'
})
export class ContainerAssignedComponent implements OnInit{
  public supplierData!: SupplierFormType[]

  constructor(private _supplierService: SupplierDialogService){
  }
  
  ngOnInit(): void {  
  }


}
