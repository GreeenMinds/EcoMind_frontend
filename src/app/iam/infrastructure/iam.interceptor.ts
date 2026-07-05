import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IamService } from '../application/iam.service';

export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(IamService).accessToken();
  const handledRequest = token
    ? request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`),
      })
    : request;

  return next(handledRequest);
};
