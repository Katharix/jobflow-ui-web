import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { SupportHubSignalRService } from './support-hub-signalr.service';

describe('SupportHubSignalRService', () => {
  let service: SupportHubSignalRService;
  let mockConnection: {
    state: HubConnectionState;
    start: jasmine.Spy;
    stop: jasmine.Spy;
    invoke: jasmine.Spy;
    on: jasmine.Spy;
    onreconnected: jasmine.Spy;
  };
  let reconnectedCallback: (() => void) | undefined;

  beforeEach(() => {
    reconnectedCallback = undefined;

    mockConnection = {
      state: HubConnectionState.Disconnected,
      start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
      stop: jasmine.createSpy('stop').and.returnValue(Promise.resolve()),
      invoke: jasmine.createSpy('invoke').and.returnValue(Promise.resolve()),
      on: jasmine.createSpy('on'),
      onreconnected: jasmine.createSpy('onreconnected').and.callFake((cb: () => void) => {
        reconnectedCallback = cb;
      }),
    };

    spyOn(HubConnectionBuilder.prototype, 'withUrl').and.returnValue(
      HubConnectionBuilder.prototype as unknown as HubConnectionBuilder
    );
    spyOn(HubConnectionBuilder.prototype, 'withAutomaticReconnect').and.returnValue(
      HubConnectionBuilder.prototype as unknown as HubConnectionBuilder
    );
    spyOn(HubConnectionBuilder.prototype, 'configureLogging').and.returnValue(
      HubConnectionBuilder.prototype as unknown as HubConnectionBuilder
    );
    spyOn(HubConnectionBuilder.prototype, 'build').and.returnValue(mockConnection as unknown as ReturnType<HubConnectionBuilder['build']>);

    TestBed.configureTestingModule({
      providers: [
        SupportHubSignalRService,
        { provide: Auth, useValue: { currentUser: null } },
      ],
    });
    service = TestBed.inject(SupportHubSignalRService);
  });

  it('_isRepMode is false by default — reconnect does not invoke JoinRepGroup', async () => {
    await service.startConnection();

    reconnectedCallback!();

    expect(mockConnection.invoke).not.toHaveBeenCalledWith('JoinRepGroup');
  });

  it('joinRepGroup() causes onreconnected to invoke JoinRepGroup', async () => {
    await service.startConnection();
    await service.joinRepGroup();
    mockConnection.invoke.calls.reset();

    reconnectedCallback!();

    expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRepGroup');
  });

  it('disconnect() resets _isRepMode so subsequent reconnect skips JoinRepGroup', async () => {
    await service.startConnection();
    await service.joinRepGroup();
    await service.disconnect();
    mockConnection.invoke.calls.reset();

    // Start a new connection (connection was nulled by disconnect)
    await service.startConnection();
    reconnectedCallback!();

    expect(mockConnection.invoke).not.toHaveBeenCalledWith('JoinRepGroup');
  });

  it('startConnection() calls start() when connection state is Disconnected', async () => {
    await service.startConnection();
    mockConnection.state = HubConnectionState.Disconnected;
    mockConnection.start.calls.reset();

    await service.startConnection();

    expect(mockConnection.start).toHaveBeenCalledTimes(1);
  });

  it('startConnection() skips start() when connection state is not Disconnected', async () => {
    await service.startConnection();
    mockConnection.state = HubConnectionState.Connected;
    mockConnection.start.calls.reset();

    await service.startConnection();

    expect(mockConnection.start).not.toHaveBeenCalled();
  });
});
