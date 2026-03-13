import {of} from 'rxjs';
import {ChatComponent} from './chat.component';

describe('ChatComponent', () => {
   let component: ChatComponent;
   let chatServiceSpy: any;
   let httpSpy: any;
   let receiveMessageHandler: ((message: any) => void) | null;

   beforeEach(() => {
      receiveMessageHandler = null;

      chatServiceSpy = jasmine.createSpyObj('ChatService', [
         'startConnection',
         'joinConversation',
         'leaveConversation',
         'sendMessage',
         'onMessageReceived'
      ]);

      chatServiceSpy.onMessageReceived.and.callFake((callback: (message: any) => void) => {
         receiveMessageHandler = callback;
      });

      httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
      httpSpy.get.and.returnValue(of([]));
      httpSpy.post.and.returnValue(of({id: 'new-convo', name: 'New Conversation'}));

      component = new ChatComponent(chatServiceSpy, httpSpy);
   });

   it('starts connection and loads conversations on init', () => {
      httpSpy.get.and.returnValue(of([{id: 'c1', name: 'Alpha'}]));

      component.ngOnInit();

      expect(chatServiceSpy.startConnection).toHaveBeenCalled();
      expect(httpSpy.get).toHaveBeenCalledWith('/api/chat/conversations');
      expect(chatServiceSpy.onMessageReceived).toHaveBeenCalled();
      expect(component.conversations.length).toBe(1);
      expect(component.conversations[0].name).toBe('Alpha');
   });

   it('selects a conversation and loads messages', () => {
      const conversation = {id: 'c1', name: 'Alpha', unreadCount: 2};
      component.conversations = [conversation as any];

      httpSpy.get.and.returnValue(of([
         {content: 'Hello', timestamp: '2026-03-12T12:00:00.000Z', senderId: 'user-2', conversationId: 'c1'}
      ]));

      component.selectConversation(conversation as any);

      expect(chatServiceSpy.joinConversation).toHaveBeenCalledWith('c1');
      expect(httpSpy.get).toHaveBeenCalledWith('/api/chat/messages/c1');
      expect(component.chatPanelVisible).toBeTrue();
      expect(component.messages.length).toBe(1);
      expect(component.messages[0].isMine).toBeFalse();
   });

   it('sends message and updates local list', () => {
      component.selectedConversation = {id: 'c1', name: 'Alpha'} as any;
      component.conversations = [{id: 'c1', name: 'Alpha', unreadCount: 1} as any];
      component.messageText = '  Test message  ';

      component.sendMessage();

      expect(chatServiceSpy.sendMessage).toHaveBeenCalled();
      expect(component.messages.length).toBe(1);
      expect(component.messages[0].content).toBe('Test message');
      expect(component.messageText).toBe('');
      expect(component.conversations[0].unreadCount).toBe(0);
   });

   it('does not send message when no conversation selected', () => {
      component.selectedConversation = null;
      component.messageText = 'Hello';

      component.sendMessage();

      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
      expect(component.messages.length).toBe(0);
   });

   it('filters conversations by name, role, and message preview', () => {
      component.conversations = [
         {id: 'c1', name: 'Alice', role: 'Manager', lastMessage: {content: 'Budget approved'}},
         {id: 'c2', name: 'Bob', role: 'Technician', lastMessage: {content: 'On site'}}
      ] as any;

      component.searchQuery = 'budget';
      expect(component.filteredConversations.length).toBe(1);
      expect(component.filteredConversations[0].id).toBe('c1');

      component.searchQuery = 'technician';
      expect(component.filteredConversations.length).toBe(1);
      expect(component.filteredConversations[0].id).toBe('c2');
   });

   it('handles incoming message for selected conversation', () => {
      const conversation = {id: 'c1', name: 'Alpha', unreadCount: 0} as any;
      component.conversations = [conversation];
      component.selectedConversation = conversation;
      httpSpy.get.and.returnValue(of([{id: 'c1', name: 'Alpha', unreadCount: 0}]));

      component.ngOnInit();
      expect(receiveMessageHandler).toBeTruthy();

      receiveMessageHandler?.({
         content: 'Incoming',
         timestamp: '2026-03-12T17:00:00.000Z',
         senderId: 'other-user',
         conversationId: 'c1'
      });

      expect(component.messages.length).toBe(1);
      expect(component.messages[0].content).toBe('Incoming');
      expect(component.messages[0].isMine).toBeFalse();
      expect(component.conversations[0].unreadCount).toBe(0);
   });
});