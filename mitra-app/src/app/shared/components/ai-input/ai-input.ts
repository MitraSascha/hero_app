import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechService } from '../../../core/services/speech.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-input-wrapper">
      <textarea
        class="form-control"
        rows="4"
        [placeholder]="placeholder"
        [(ngModel)]="text"
        [disabled]="isLoading"
        (input)="onTextChange()">
      </textarea>

      <div class="d-flex gap-2 mt-2 align-items-center">
        <!-- Mikrofon-Button -->
        <button type="button"
                class="btn btn-outline-secondary"
                [class.btn-danger]="isRecording"
                (click)="toggleRecording()"
                [disabled]="isLoading || !speechSupported"
                [title]="speechSupported ? 'Spracheingabe' : 'Spracheingabe nicht unterstützt'">
          <i class="bi" [class.bi-mic]="!isRecording" [class.bi-mic-fill]="isRecording"></i>
        </button>

        <!-- Status -->
        <span class="text-muted small flex-grow-1">
          <span *ngIf="isRecording" class="text-danger">
            <span class="spinner-grow spinner-grow-sm me-1" style="width:.5rem;height:.5rem"></span>
            Aufnahme läuft...
          </span>
          <span *ngIf="isLoading && !isRecording">
            <span class="spinner-border spinner-border-sm me-1"></span>
            KI verarbeitet...
          </span>
        </span>

        <!-- Absenden -->
        <button type="button"
                class="btn btn-primary"
                [disabled]="!text.trim() || isLoading || isRecording"
                (click)="submit()">
          <i class="bi bi-magic me-1"></i>KI-Vorschau
        </button>
      </div>

      <div *ngIf="!speechSupported" class="text-muted small mt-1">
        <i class="bi bi-info-circle me-1"></i>Spracheingabe: nur Chrome / Safari verfügbar
      </div>
    </div>
  `,
  styles: [`
    .ai-input-wrapper textarea {
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
    }
  `]
})
export class AiInputComponent implements OnDestroy {
  @Input() placeholder = 'Was wurde heute gemacht?';
  @Input() isLoading = false;
  @Output() textSubmit = new EventEmitter<string>();
  @Output() voiceResult = new EventEmitter<string>();

  text = '';
  isRecording = false;
  speechSupported: boolean;
  private speechSub?: Subscription;

  constructor(private speech: SpeechService) {
    this.speechSupported = this.speech.isSupported();
  }

  onTextChange(): void {}

  toggleRecording(): void {
    if (this.isRecording) {
      this.speechSub?.unsubscribe();
      this.isRecording = false;
      return;
    }
    this.isRecording = true;
    this.speechSub = this.speech.startRecognition().subscribe({
      next: transcript => {
        this.text = transcript;
        this.voiceResult.emit(transcript);
        this.isRecording = false;
      },
      error: () => {
        this.isRecording = false;
      },
      complete: () => {
        this.isRecording = false;
      }
    });
  }

  submit(): void {
    if (this.text.trim()) {
      this.textSubmit.emit(this.text.trim());
    }
  }

  ngOnDestroy(): void {
    this.speechSub?.unsubscribe();
  }
}
