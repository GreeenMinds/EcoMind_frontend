import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamService } from '../application/iam.service';

export const iamGuard: CanActivateFn = (_route, state) => {
  const iamService = inject(IamService);
  const router = inject(Router);

  if (iamService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/sign-in'], {
    queryParams: { redirectTo: state.url },
  });
};

export const anonymousOnlyGuard: CanActivateFn = () => {
  const iamService = inject(IamService);
  const router = inject(Router);

  if (!iamService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/quests']);
};
