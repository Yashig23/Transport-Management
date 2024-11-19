import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TransportRoutingModule } from './transport-routing.module';
import { SupplierDialogComponent } from './Utils/supplier-dialog/supplier-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule} from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatSnackBarModule} from '@angular/material/snack-bar';

// import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@NgModule({
  declarations: [
    SupplierDialogComponent,
  ],
  imports: [
    CommonModule,
    TransportRoutingModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    // MatDialogModule,
    MatNativeDateModule ,
    MatSnackBarModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatCardModule,
    MatTableModule,
    FormsModule
  ],
  providers: [
  ]
})
export class TransportModule { }
