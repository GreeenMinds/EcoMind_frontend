import { Injectable, inject } from '@angular/core';
import { IamService } from '../../iam/application/iam.service';

@Injectable({
  providedIn: 'root',
})
export class CurrentUser {
  private readonly iamService = inject(IamService);

  getCurrentUserId(): number {
    return this.iamService.getCurrentUserId();
  }
}
