import { Injectable } from '@angular/core';

const DEFAULT_USER_ID = 1;

@Injectable({
  providedIn: 'root',
})
export class CurrentUser {
  getCurrentUserId(): number {
    return DEFAULT_USER_ID;
  }
}
