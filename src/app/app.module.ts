import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from "./Modules/shared/shared.module";


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatNativeDateModule,
    HttpClientModule,
    MatDialogModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
        positionClass: 'toast-upper-right',
        timeOut: 3000,
        extendedTimeOut: 1000,
        closeButton: true
    }),
    MatIconModule,
    SharedModule
],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    { provide: DateAdapter, useClass: NativeDateAdapter } 
  ],
  exports: [RouterModule],
  bootstrap: [AppComponent]
})
export class AppModule { }
