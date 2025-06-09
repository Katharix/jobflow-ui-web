import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../services/chat.service';
import { NgScrollbar, NgScrollbarModule } from 'ngx-scrollbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [NgScrollbarModule, CommonModule, FormsModule]
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  selectedConversation: any;
  messages: any[] = [];
  messageText: string = '';
  private messageSub: Subscription = new Subscription();

  constructor(private chatService: ChatService, private http: HttpClient) { }

  ngOnInit(): void {
    this.chatService.startConnection();
    this.loadConversations();

    this.chatService.onMessageReceived((message) => {
      if (message.conversationId === this.selectedConversation?.id) {
        this.messages.push(message);
      }
    });
  }

  ngOnDestroy(): void {
    this.messageSub.unsubscribe();
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
  }

  loadConversations() {
    this.http.get<any[]>('/api/chat/conversations').subscribe((convos) => {
      this.conversations = convos;
    });
  }

  selectConversation(convo: any): void {
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }

    this.selectedConversation = convo;
    this.chatService.joinConversation(convo.id);

    this.http.get<any[]>(`/api/chat/messages/${convo.id}`).subscribe((msgs) => {
      this.messages = msgs;
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedConversation) return;

    const msg = {
      content: this.messageText,
      timestamp: new Date().toISOString(),
      senderId: 'currentUserId', // Replace or pull from auth
      conversationId: this.selectedConversation.id
    };

    this.chatService.sendMessage(this.selectedConversation.id, msg);
    this.messages.push({ ...msg, isMine: true });
    this.messageText = '';
  }

  startNewChat(): void {
    // In real app, show modal to pick user(s)
    const recipientId = prompt('Enter recipient user ID'); // For demo only

    if (!recipientId) return;

    this.http.post('/api/chat/conversations', {
      participantIds: [recipientId]
    }).subscribe((newConvo: any) => {
      this.conversations.unshift(newConvo); // Push to list
      this.selectConversation(newConvo);     // Auto-open it
    });
  }

}
