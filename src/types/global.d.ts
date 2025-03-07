import { Observable } from 'rxjs';
import { Keyboard } from '../ts/browser/keyboard';
import { Viewport } from '../ts/browser/viewport';

declare global {
  interface Window {
    document$: Observable<Document>;
    location$: Observable<URL>;
    target$: Observable<HTMLElement>;
    keyboard$: Observable<Keyboard>;
    viewport$?: Observable<Viewport>;
    tablet$?: Observable<boolean>;
    screen$?: Observable<boolean>;
    print$?: Observable<boolean>;
    alert$?: Observable<string>;
    progress$?: Observable<number>;
    component$: Observable<unknown>;
  }
}
