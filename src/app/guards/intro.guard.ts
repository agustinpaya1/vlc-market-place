import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class IntroGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(): boolean | UrlTree {
        const introSeen = localStorage.getItem('introSeen');

        if (introSeen === 'true') {
            return true;
        }

        // Redirect to intro if not seen
        return this.router.createUrlTree(['/intro']);
    }
}
