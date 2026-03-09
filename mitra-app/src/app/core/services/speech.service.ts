import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  startRecognition(): Observable<string> {
    return new Observable(observer => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        observer.error('Spracheingabe wird von diesem Browser nicht unterstützt.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        observer.next(transcript);
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        observer.error(event.error);
      };

      recognition.onend = () => {
        // Falls kein Ergebnis und kein Fehler → complete
        observer.complete();
      };

      recognition.start();

      // Teardown: Aufnahme stoppen wenn unsubscribed
      return () => {
        try { recognition.stop(); } catch {}
      };
    });
  }
}
