import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../Interfaces/dialogInterface';
// import { DeleteDialogComponent } from '../Components/delete-dialog/delete-dialog.component';
import { DialogBoxComponent } from '../Components/dialog-box/dialog-box.component';

@Injectable({
  providedIn: 'root'
})
export class DeleteDialogService {

  constructor(private dialog: MatDialog) { }

  public openConfirmDialog(msg: string): MatDialogRef<DialogBoxComponent, any>{
    const dialogData: DialogData = {message: msg};
    return this.dialog.open(DialogBoxComponent, {
      width: '390px',
      panelClass: 'confirm-dialog-container',
      disableClose: true,
      data: dialogData
    });
  }
}