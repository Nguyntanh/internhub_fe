import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
  withFetch,
} from '@angular/common/http';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { JwtInterceptor } from './auth/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes),

    provideClientHydration(withEventReplay()),

    // HTTP Client + Interceptor
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },


  ],
};