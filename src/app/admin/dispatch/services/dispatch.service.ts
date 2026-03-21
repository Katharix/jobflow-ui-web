import { Injectable, inject } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { DispatchBoardDto } from '../models/dispatch';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private api = inject(BaseApiService);


  getBoard(start: Date, end: Date) {
    return this.api.get<DispatchBoardDto>('dispatch/board', { start, end });
  }
}
