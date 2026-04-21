import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typing-indicator.component.html',
  styleUrl: './typing-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypingIndicatorComponent {
  @Input() senderName = '';
}
