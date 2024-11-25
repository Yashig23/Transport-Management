import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';  
import { SharedOrderComponent } from './sharedComponents/Components/shared-order/shared-order.component';
import { SharedOrderViewComponent } from './sharedComponents/Components/shared-order-view/shared-order-view.component';
import {MatTabsModule} from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; 
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // For mat-button
import { DialogBoxComponent } from './sharedComponents/Components/dialog-box/dialog-box.component';
import { FormComponent } from './sharedComponents/Components/form/form.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CRViewComponent } from './sharedComponents/Components/crview/crview.component';
import { CopyDialogComponent } from './sharedComponents/copy-dialog/copy-dialog.component';

@NgModule({
  declarations: [
    SharedOrderComponent,
    SharedOrderViewComponent,
    DialogBoxComponent,
    FormComponent,
    CRViewComponent,
    CopyDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    RouterModule,
    MatTableModule,
    MatTabsModule,
    MatCardModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatDatepickerModule,
    // MatButtonModule
  ],
  exports: [SharedOrderComponent, SharedOrderViewComponent, FormComponent]
})
export class SharedModule { }
