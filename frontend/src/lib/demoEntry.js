import { resetDemoState } from './demo';
import { enterDemo } from './session';

/** Start a fresh demo session for a role (no backend needed). */
export function startDemo(role) {
  resetDemoState();
  enterDemo(role);
}
