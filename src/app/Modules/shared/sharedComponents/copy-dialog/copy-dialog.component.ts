import { Component, OnInit } from '@angular/core';
import { TransportFormService } from '../../../transport/Services/transport-form.service';
import { TransportFormType } from '../../../transport/Constants/constants';

@Component({
  selector: 'app-copy-dialog',
  templateUrl: './copy-dialog.component.html',
  styleUrl: './copy-dialog.component.scss'
})
export class CopyDialogComponent{
  public fieldId!: string;
  public formValues!: TransportFormType;

  constructor( public _transportService: TransportFormService){
    this.getValueOfField();
  }
  
  public getValueOfField(): void{
    this._transportService.getOrderById(this.fieldId).subscribe({
      next: (data: TransportFormType)=>{
        
      }
    })
  }

}
