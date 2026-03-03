import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserCreateComponent } from './user-create/user-create.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, UserCreateComponent],
  template: `
    <app-user-create></app-user-create>
  `,
  styles: ``
})
export class AccountsComponent { }
