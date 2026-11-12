const APPOINTMENTS_CHANGED_EVENT = "pt:appointments-changed";

export function emitAppointmentsChanged(): void {
  window.dispatchEvent(new Event(APPOINTMENTS_CHANGED_EVENT));
}

export function onAppointmentsChanged(handler: () => void): () => void {
  window.addEventListener(APPOINTMENTS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(APPOINTMENTS_CHANGED_EVENT, handler);
}
